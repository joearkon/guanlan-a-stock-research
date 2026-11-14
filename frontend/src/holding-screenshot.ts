import {parsePortfolioMatrix,buildImportPlan} from '../../web/v2/portfolio-import.mjs';
export type OcrWord={text:string;confidence:number;bbox:{x0:number;y0:number;x1:number;y1:number}};
export type HoldingDraft={id:string;code:string;name?:string;shares:string;cost:string;action:string;confirmed:boolean;warnings:string[]};
const clean=(s:string)=>s.replace(/\s/g,'').replaceAll('／','/');
const quantity=['持仓数量','持仓股数','股票余额','持仓/可用','数量/可用','持仓','数量','股数'];
const costLabels=['成本价','摊薄成本','成本/现价','成本/市价','成本'];
export function extractHoldingRows(input:OcrWord[],directory:readonly {code:string;name:string}[]=[]):HoldingDraft[]{
 const words=input.filter(w=>typeof w.text==='string'&&w.text.length<80&&Object.values(w.bbox||{}).length===4&&Object.values(w.bbox).every(Number.isFinite)).map(w=>({...w,text:clean(w.text)}));
 const candidates=[...words];
 for(const w of words){let text=w.text,right=w.bbox.x1;for(const n of words.filter(n=>n.bbox.x0>w.bbox.x0&&Math.abs(n.bbox.y0-w.bbox.y0)<8).sort((a,b)=>a.bbox.x0-b.bbox.x0).slice(0,7)){
  if(n.bbox.x0-right>Math.max(18,(w.bbox.y1-w.bbox.y0)*.65))break;text+=n.text;right=Math.max(right,n.bbox.x1);candidates.push({...w,text,bbox:{...w.bbox,x1:right},confidence:Math.min(w.confidence,n.confidence)});
 }}
 const nameIndex=new Map<string,string[]>();for(const item of directory){if(!/^\d{6}$/.test(item.code)||!item.name)continue;const key=clean(item.name);nameIndex.set(key,[...new Set([...(nameIndex.get(key)||[]),item.code])]);}
 const costHeader=candidates.filter(w=>costLabels.includes(w.text)).sort((a,b)=>b.text.length-a.text.length||a.bbox.y0-b.bbox.y0)[0];
 const sharesHeader=candidates.filter(w=>quantity.includes(w.text)&&(!costHeader||Math.abs(w.bbox.y0-costHeader.bbox.y0)<Math.max(12,costHeader.bbox.y1-costHeader.bbox.y0))).sort((a,b)=>b.text.length-a.text.length||a.bbox.y0-b.bbox.y0)[0];
 const headerBottom=Math.max(sharesHeader?.bbox.y1??0,costHeader?.bbox.y1??0),columnLeft=Math.min(sharesHeader?.bbox.x0??Infinity,costHeader?.bbox.x0??Infinity);
 const nameHeader=candidates.filter(w=>['名称','证券名称','股票名称','名称/代码','市值'].includes(w.text)&&w.bbox.y1<=headerBottom).sort((a,b)=>b.bbox.y0-a.bbox.y0)[0];
 const codes=words.filter(w=>/^\d{6}$/.test(w.text)&&w.bbox.y0>=headerBottom&&w.bbox.x0<columnLeft);
 const left=nameHeader?.bbox.x0??(codes.length?Math.min(...codes.map(w=>w.bbox.x0)):0);
 const names=candidates.filter(w=>w.bbox.y0>=headerBottom&&w.bbox.x0<columnLeft&&/^[*＊A-Za-z\u4e00-\u9fff]{2,16}$/.test(w.text)&&/[\u4e00-\u9fff]/.test(w.text)&&
  (nameIndex.has(w.text)||(nameHeader&&Math.abs(w.bbox.x0-left)<45&&words.some(n=>n.bbox.x0>=columnLeft&&Math.abs(n.bbox.y0-w.bbox.y0)<12&&/^\d/.test(n.text)))))
  .sort((a,b)=>a.bbox.y0-b.bbox.y0||b.text.length-a.text.length).filter((w,i,all)=>!all.slice(0,i).some(n=>Math.abs(n.bbox.y0-w.bbox.y0)<10&&n.bbox.x0<=w.bbox.x0&&n.bbox.x1>=w.bbox.x1));
 const used=new Set<OcrWord>(),anchors:{word:OcrWord;codeWord?:OcrWord;name?:string}[]=names.map(word=>{
  const match=codes.filter(c=>Math.abs(c.bbox.x0-word.bbox.x0)<60&&c.bbox.y0>=word.bbox.y0-8&&c.bbox.y0-word.bbox.y1<30).sort((a,b)=>Math.abs(a.bbox.y0-word.bbox.y0)-Math.abs(b.bbox.y0-word.bbox.y0))[0];
  if(match)used.add(match);return {word,codeWord:match,name:word.text};
 });
 for(const word of codes)if(!used.has(word))anchors.push({word,codeWord:word});anchors.sort((a,b)=>a.word.bbox.y0-b.word.bbox.y0);
 if(anchors.length>20)throw Error('一次最多识别20行持仓，请分开截图');
 const number=(w:OcrWord)=>/^\d[\d,]*(?:\.\d+)?$/.test(w.text)?w.text.replaceAll(',',''):'';
 return anchors.map(({word:a,codeWord,name},i)=>{
  const y0=i?(anchors[i-1].word.bbox.y1+a.bbox.y0)/2:headerBottom,y1=anchors[i+1]?(a.bbox.y1+anchors[i+1].word.bbox.y0)/2:Infinity;
  const fields:OcrWord[]=[];
  const field=(h:OcrWord|undefined)=>{if(!h)return '';const center=(w:OcrWord)=>(w.bbox.x0+w.bbox.x1)/2;const nearest=words.filter(w=>w!==a&&w!==codeWord&&w.bbox.y0>=y0&&w.bbox.y0<y1&&Math.abs(center(w)-center(h))<Math.max(35,(h.bbox.x1-h.bbox.x0)*.65)).sort((a,b)=>a.bbox.y0-b.bbox.y0||Math.abs(center(a)-center(h))-Math.abs(center(b)-center(h)))[0];if(nearest)fields.push(nearest);return nearest?number(nearest):'';};
  const shares=field(sharesHeader),cost=field(costHeader),warnings:string[]=[];
  const matches=name?nameIndex.get(name)||[]:[];let code=codeWord?.text||'';
  if(name&&code&&matches.length&&!matches.includes(code)){code='';warnings.push('名称与截图代码不一致，请手动确认证券');}
  else if(!code&&matches.length===1){code=matches[0];warnings.push('按证券名称匹配目录，请核对代码');}
  else if(!code)warnings.push(matches.length>1?'名称匹配多个证券，请选择正确代码':'名称未精确匹配目录，请搜索并确认证券');
  if(!shares)warnings.push('未识别持仓股数，请手动填写（不使用可用股数）');if(!cost)warnings.push('未识别成本价，请手动填写（不使用现价或市值）');
  if([a,...(codeWord?[codeWord]:[]),...fields].some(w=>w.confidence<80))warnings.push('低清晰度字段，请对照原图核对');
  return {id:'ocr-'+i,code,name,shares,cost,action:'',confirmed:false,warnings};
 });
}
export async function holdingImportPreview(rows:HoldingDraft[],options:{date:string;existing:any[];findAssets:(q:string,k:string)=>any;baseVersion:number}){
 const active=rows.filter(r=>r.action!=='skip');if(!active.length)throw Error('没有待导入的持仓');if(active.some(r=>!r.confirmed))throw Error('请逐行核对代码、股数和成本后勾选确认');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(options.date)||!Number.isFinite(Date.parse(options.date))||new Date(options.date).toISOString().slice(0,10)!==options.date)throw Error('请明确填写持仓记录日期，不从截图推断成交日期');
 if(new Set(active.map(r=>r.code)).size!==active.length)throw Error('截图内证券重复，请保留一行或跳过，不自动合并成本');
 const matrix=[['代码','股数','成本','记录日期'],...active.map(r=>[r.code,r.shares,r.cost,options.date])],preview=await parsePortfolioMatrix(matrix,{kind:'holdings',existing:options.existing,findAssets:options.findAssets} as any);
 if(preview.errorCount)throw Error(preview.rows.flatMap(r=>r.errors).join('；'));
 for(const r of active){const exists=options.existing.some(p=>p.code===r.code);if(exists&&r.action!=='replace')throw Error(r.code+' 已存在，请明确选择覆盖或跳过');if(!exists&&r.action!=='add')throw Error(r.code+' 尚未持有，请选择新增或跳过');}
 const plan=buildImportPlan(preview,Object.fromEntries(active.map(r=>[r.code,r.action])),{baseVersion:options.baseVersion,sourceName:'持仓截图（本地识别）'});
 return {...plan,source:{...plan.source,format:'image',recognition:'local_ocr_reviewed'}};
}
