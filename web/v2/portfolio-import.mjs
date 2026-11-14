// Local-only portfolio file preview. Nothing is sent to the server until onApply
// receives one fully validated, immutable plan for a versioned profile write.
const MAX_FILE_BYTES=5*1024*1024;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isDate=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(`${value}T00:00:00Z`);return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===value;};
const number=value=>{const v=String(value??'').trim().replaceAll(',','');return v!==''&&/^\d+(?:\.\d+)?$/.test(v)?Number(v):NaN;};
const headers={code:['代码','证券代码','股票代码','股票','code','symbol','ts_code'],name:['名称','证券名称','股票名称','name'],shares:['股数','持仓股数','数量','持仓数量','shares','quantity'],cost:['成本','成本价','持仓成本','买入均价','cost','price'],recordDate:['记录日期','日期','持仓日期','date','recorddate'],reason:['关注原因','原因','reason']};
const key=value=>String(value??'').trim().toLocaleLowerCase().replace(/[\s_\-]/g,'');
const columns=row=>Object.fromEntries(Object.entries(headers).map(([field,names])=>[field,row.findIndex(v=>names.some(name=>key(name)===key(v)))]));

export function decodeCsvBytes(bytes){
 const data=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
 try{return new TextDecoder('utf-8',{fatal:true}).decode(data);}catch{return new TextDecoder('gb18030',{fatal:true}).decode(data);}
}
export function parseCsv(input){
 const source=String(input??'').replace(/^\uFEFF/,'');
 const delimiter=(source.split(/\r?\n/,1)[0].match(/\t/g)||[]).length>(source.split(/\r?\n/,1)[0].match(/,/g)||[]).length?'\t':',';
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<source.length;i++){
  const c=source[i];
  if(quoted){if(c==='"'&&source[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;continue;}
  if(c==='"'&&field===''){quoted=true;continue;}
  if(c===delimiter){row.push(field);field='';continue;}
  if(c==='\r'&&source[i+1]==='\n'){row.push(field);rows.push(row);row=[];field='';i++;continue;}
  if(c==='\n'||c==='\r'){row.push(field);rows.push(row);row=[];field='';continue;}
  field+=c;
 }
 if(quoted)throw Error('CSV 引号未闭合，请检查文件内容');
 if(row.length||field){row.push(field);rows.push(row);}
 return rows.filter(row=>row.some(value=>String(value).trim()));
}
function exactCatalogItem(found,code){
 const items=Array.isArray(found)?found:[];
 return items.find(item=>String(item?.code||'')===code&&item.kind==='stock'&&String(item.name||'').trim());
}
export async function parsePortfolioMatrix(matrix,{kind='holdings',existing=[],findAssets}={}){
 if(!['holdings','watchlist'].includes(kind))throw Error('不支持的导入类型');
 if(typeof findAssets!=='function')throw Error('缺少证券目录校验服务');
 if(!Array.isArray(matrix)||!matrix.length)throw Error('文件为空，或没有可解析的表格');
 const fields=columns(matrix[0]);
 if(fields.code<0||kind==='holdings'&&(fields.shares<0||fields.cost<0))throw Error(kind==='holdings'?'缺少代码、股数或成本列':'缺少代码列');
 if(matrix.length>501)throw Error('一次最多预览 500 行，请拆分文件');
 const saved=(Array.isArray(existing)?existing:[]).filter(item=>!item.archived);
 const active=new Set(saved.filter(item=>kind==='holdings'||item.kind==='stock').map(item=>String(item.code)));
 const rows=[];
 for(let i=1;i<matrix.length;i++){
  const cells=matrix[i];if(!Array.isArray(cells)||!cells.some(value=>String(value??'').trim()))continue;
  const get=field=>fields[field]<0?'':String(cells[fields[field]]??'').trim();
  let code=get('code');if(/^\d{6}\.(?:SH|SZ)$/i.test(code))code=code.slice(0,6);
  const errors=[],warnings=[],fileName=get('name'),shares=kind==='holdings'?number(get('shares')):null,cost=kind==='holdings'?number(get('cost')):null,date=get('recordDate');
  if(!/^\d{6}$/.test(code))errors.push('代码必须是六位 A 股代码');
  if(kind==='holdings'){
   if(!Number.isInteger(shares)||shares<100||shares>1e9)errors.push('股数须为 100 至 10 亿的整数（当前账户接口约束）');
   if(!Number.isFinite(cost)||cost<=0||cost>1e7)errors.push('成本须大于 0 且不超过 1000 万（当前账户接口约束）');
   if(date&&!isDate(date))errors.push('日期必须是有效的 YYYY-MM-DD');
  }else if(get('reason').length>600)errors.push('关注原因不能超过 600 字');
  let asset;
  if(/^\d{6}$/.test(code)){
   try{asset=exactCatalogItem(await findAssets(code,'stock'),code);}catch{errors.push('证券目录校验失败，请稍后重试');}
   if(!asset&&!errors.some(x=>x.includes('目录')))errors.push('证券目录无此代码，不能导入');
  }
  if(asset&&fileName&&fileName!==asset.name)warnings.push(`文件名称“${fileName}”与目录“${asset.name}”不一致，采用目录名称`);
  const inAccount=active.has(code);
  rows.push({sourceRow:i+1,code,name:asset?.name||'',kind:'stock',shares,cost,recordDate:date,reason:get('reason'),catalogSource:asset?.source||'',conflict:inAccount?'account':null,duplicate:false,errors,warnings});
 }
 const counts=new Map();for(const row of rows)counts.set(row.code,(counts.get(row.code)||0)+1);
 for(const row of rows)if(counts.get(row.code)>1){row.duplicate=true;row.conflict=row.conflict?'account-and-file':'file';}
 return {kind,rows,existingCount:saved.length,validCount:rows.filter(row=>!row.errors.length).length,errorCount:rows.filter(row=>row.errors.length).length,sourceRowCount:rows.length};
}
/** @param {any} preview @param {Record<string,string>} decisions @param {{baseVersion?:number|null,sourceName?:string}} options */
export function buildImportPlan(preview,decisions={}, {baseVersion=null,sourceName=''}={}){
 const operations=[];
 const duplicateCodes=new Set((preview?.rows||[]).filter(row=>row.duplicate).map(row=>row.code));
 for(const code of duplicateCodes){
  const choice=decisions[`file:${code}`];
  if(choice===undefined||choice==='')throw Error(`文件内重复代码 ${code}，请明确选用一行或全部跳过`);
  if(choice!=='skip'&&!preview.rows.some(row=>row.code===code&&row.sourceRow===Number(choice)&&!row.errors.length))throw Error(`文件内重复代码 ${code} 的选用行无效`);
 }
 for(const row of preview?.rows||[]){
  if(row.duplicate&&(decisions[`file:${row.code}`]==='skip'||row.sourceRow!==Number(decisions[`file:${row.code}`])))continue;
  if(row.errors.length)continue;
  let action='add';
  if(row.conflict){
   action=row.conflict==='file'?'add':decisions[row.code];
   if(!action)throw Error(`代码 ${row.code} 与当前账户重复，请逐项选择跳过或覆盖`);
   if(action==='merge')throw Error('不支持合并：成本价摊薄需要明确会计口径');
   if(!(row.conflict==='file'?action==='add':['skip','replace'].includes(action)))throw Error(`代码 ${row.code} 的冲突处理方式无效`);
   if(preview.kind==='watchlist'&&action==='replace')throw Error('观察池已有对象不能覆盖其研究备注，请选择跳过');
   if(action==='skip')continue;
  }
  operations.push(Object.freeze({action,kind:'stock',code:row.code,name:row.name,...(preview.kind==='holdings'?{shares:row.shares,cost:row.cost,...(row.recordDate?{recordDate:row.recordDate}:{})}:{reason:row.reason||''}),sourceRow:row.sourceRow}));
 }
 const max=preview.kind==='holdings'?20:30;
 if(preview.existingCount+operations.filter(row=>row.action==='add').length>max)throw Error(`${preview.kind==='holdings'?'持仓':'观察池'}最多 ${max} 项，请减少导入行数`);
 return Object.freeze({kind:preview.kind,source:Object.freeze({name:String(sourceName),format:/\.xlsx$/i.test(sourceName)?'xlsx':'csv',rowCount:preview.sourceRowCount}),baseVersion,operations:Object.freeze(operations)});
}
let xlsxPending;
async function browserXlsx(){
 if(globalThis.XLSX)return globalThis.XLSX;
 if(typeof document==='undefined')throw Error('XLSX 解析器尚未载入');
 xlsxPending??=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/v2/vendor/xlsx.mini.min.js';script.onload=()=>globalThis.XLSX?resolve(globalThis.XLSX):reject(Error('XLSX 解析器加载失败'));script.onerror=()=>reject(Error('XLSX 解析器加载失败'));document.head.append(script);});
 return xlsxPending;
}
export async function parsePortfolioFile(file,options={}){
 if(!file||!file.name)throw Error('请选择 CSV 或 XLSX 文件');
 if(file.size>MAX_FILE_BYTES)throw Error('文件超过 5 MB 上限');
 const suffix=file.name.toLowerCase().match(/\.(csv|tsv|xlsx)$/)?.[1];
 if(!suffix)throw Error('仅支持 CSV、TSV 或 XLSX 文件');
 const bytes=new Uint8Array(await file.arrayBuffer());
 let matrix;
 if(suffix==='xlsx'){
  const XLSX=options.xlsx||await browserXlsx();
  const book=XLSX.read(bytes,{type:'array',cellDates:false,cellFormula:false,cellHTML:false,sheetRows:502});
  if(!book.SheetNames.length)throw Error('工作簿没有工作表');
  matrix=XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]],{header:1,raw:false,defval:'',blankrows:false});
 }else matrix=parseCsv(decodeCsvBytes(bytes));
 return {...await parsePortfolioMatrix(matrix,options),sourceName:file.name};
}

export function mountPortfolioImport(host,{kind='holdings',existing=[],findAssets,onApply,onCancel,baseVersion=null}={}){
 if(!host||typeof onApply!=='function')throw Error('导入组件需要容器和提交回调');
 let preview=null,decisions={};
 host.innerHTML=`<div class="pi-shade"><section class="pi-dialog" role="dialog" aria-modal="true" aria-labelledby="pi-title"><header><div><h2 id="pi-title">导入${kind==='holdings'?'持仓':'观察池'}文件</h2><p>先解析与预览，不自动覆盖当前账户${kind==='holdings'?'持仓':'关注'}。</p></div><button type="button" data-pi-close aria-label="关闭">×</button></header><label class="pi-file">选择 CSV / XLSX 文件<input type="file" accept=".csv,.tsv,.xlsx" data-pi-file><small>仅在本地解析${kind==='holdings'?'代码、名称、股数、成本、记录日期':'代码、名称、关注原因'}；不上传账户凭证。</small></label><section class="pi-preview"><h3>导入预览 <span data-pi-count>· 解析成功后显示真实行数</span></h3><div class="pi-table-wrap"><table><thead><tr><th>代码 / 类型 / 名称</th>${kind==='holdings'?'<th>股数</th><th>成本</th><th>日期</th>':'<th>关注原因</th>'}<th>状态</th></tr></thead><tbody data-pi-rows><tr><td colspan="5" class="pi-empty">尚未选择文件。这里不预填任何持仓或资金数据。</td></tr></tbody></table></div></section><p class="pi-note">六位代码与证券目录匹配${kind==='holdings'?'、股数/成本符合当前账户接口、日期有效':''}；重复项需逐项确认。</p><div class="pi-errors" data-pi-errors role="status"></div><footer><button type="button" data-pi-cancel>取消</button><button type="button" data-pi-submit disabled>确认导入</button></footer></section></div>`;
 const input=host.querySelector('[data-pi-file]'),body=host.querySelector('[data-pi-rows]'),errors=host.querySelector('[data-pi-errors]'),submit=host.querySelector('[data-pi-submit]');
 const close=()=>{host.innerHTML='';onCancel?.();};
 host.querySelector('[data-pi-close]').addEventListener('click',close);host.querySelector('[data-pi-cancel]').addEventListener('click',close);
 function render(){
  if(!preview)return;
  host.querySelector('[data-pi-count]').textContent=`· ${preview.sourceRowCount} 行，${preview.validCount} 行可校验，${preview.errorCount} 行错误`;
  const statusCell=row=>{
   const issues=row.errors.length?`<span class="pi-error">${esc(row.errors.join('；'))}</span>`:'';
   const candidates=preview.rows.filter(item=>item.code===row.code&&!item.errors.length);
   const fileChoice=row.duplicate?`<select data-pi-filedecision="${esc(row.code)}" aria-label="${esc(row.code)} 文件内重复行选择"><option value="">选用文件中的哪一行</option><option value="skip" ${decisions[`file:${row.code}`]==='skip'?'selected':''}>全部跳过</option>${candidates.map(item=>`<option value="${item.sourceRow}" ${Number(decisions[`file:${row.code}`])===item.sourceRow?'selected':''}>选用第 ${item.sourceRow} 行</option>`).join('')}</select>`:'';
   const selected=!row.duplicate||Number(decisions[`file:${row.code}`])===row.sourceRow;
   const accountChoice=!row.errors.length&&selected&&row.conflict?.includes('account')?`<select data-pi-decision="${esc(row.code)}" aria-label="${esc(row.code)} 当前账户冲突处理"><option value="">当前账户：请选择</option><option value="skip" ${decisions[row.code]==='skip'?'selected':''}>跳过</option>${kind==='holdings'?`<option value="replace" ${decisions[row.code]==='replace'?'selected':''}>覆盖当前持仓</option>`:''}</select>`:'';
   return `${issues}${fileChoice}${accountChoice}${!issues&&!fileChoice&&!accountChoice?'<span class="pi-ok">可导入</span>':''}`;
  };
  body.innerHTML=preview.rows.map(row=>`<tr><td><strong>${esc(row.code)}</strong><small>证券 · ${esc(row.name||'未匹配')}</small>${row.warnings.map(w=>`<small class="pi-warning">${esc(w)}</small>`).join('')}</td>${kind==='holdings'?`<td>${Number.isFinite(row.shares)?esc(row.shares):'—'}</td><td>${Number.isFinite(row.cost)?esc(row.cost):'—'}</td><td>${esc(row.recordDate||'—')}</td>`:`<td>${esc(row.reason||'—')}</td>`}<td>${statusCell(row)}</td></tr>`).join('')||`<tr><td colspan="${kind==='holdings'?5:3}" class="pi-empty">文件中没有数据行。</td></tr>`;
  const groups=[...new Set(preview.rows.filter(row=>row.duplicate).map(row=>row.code))];
  const unresolved=groups.some(code=>!decisions[`file:${code}`])||preview.rows.some(row=>!row.errors.length&&row.conflict?.includes('account')&&(!row.duplicate||row.sourceRow===Number(decisions[`file:${row.code}`]))&&!decisions[row.code]);
  const selected=preview.rows.some(row=>!row.errors.length&&(!row.duplicate||row.sourceRow===Number(decisions[`file:${row.code}`]))&&decisions[row.code]!=='skip');
  submit.disabled=unresolved||!selected;
  errors.innerHTML=preview.errorCount?`<strong>${preview.errorCount} 行不可导入</strong><p>请修改原文件后重新选择；错误行不会进入导入计划。</p>`:'重复项由你逐项选择跳过或覆盖，不会隐式替换。';
 }
 input.addEventListener('change',async()=>{preview=null;decisions={};submit.disabled=true;errors.textContent='正在本地解析与校验证券目录…';try{preview=await parsePortfolioFile(input.files?.[0],{kind,existing,findAssets});render();}catch(error){body.innerHTML='<tr><td colspan="5" class="pi-empty">无法解析该文件。</td></tr>';errors.textContent=error.message;}});
 body.addEventListener('change',event=>{const code=event.target?.dataset?.piDecision,fileCode=event.target?.dataset?.piFiledecision;if(code){decisions[code]=event.target.value;render();}else if(fileCode){decisions[`file:${fileCode}`]=event.target.value;render();}});
 submit.addEventListener('click',async()=>{try{const plan=buildImportPlan(preview,decisions,{baseVersion,sourceName:preview.sourceName});submit.disabled=true;errors.textContent='正在一次性保存导入计划…';await onApply(plan);close();}catch(error){errors.textContent=error.message;submit.disabled=false;}});
 return {close,getPreview:()=>preview};
}
