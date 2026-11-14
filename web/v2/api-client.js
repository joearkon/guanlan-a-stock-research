import {applyIndustries} from './live-industries.mjs';
import Prices from './price-policy.mjs';
import {updateReviewCheck} from './review-account.mjs';
// Same-origin data adapter for the new presentation. Existing authentication and
// profile API remain authoritative; no alternate user or Agent store is created.
let industryMembers;
let bundle,bundleAt=0,currentFree,liveData,liveAt=0,livePending,liveWarning='',refreshMs=60000,preferencesAt=0;
export function invalidateMarket(){bundleAt=0;liveAt=0;}
export function startMarketUpdates(load,{intervalMs,beforeLoad}={}){
 let busy=false,last=Date.now();
 const update=async(force=false)=>{if(busy||document.hidden||(!force&&Date.now()-last<(intervalMs||refreshMs)))return;busy=true;last=Date.now();try{beforeLoad?.();await load();}finally{busy=false;}};
 const timer=setInterval(()=>update(),1000);
 const onVisibility=()=>{if(!document.hidden)update(true);};
 document.addEventListener('visibilitychange',onVisibility);
 return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',onVisibility);};
}
async function liveSnapshot(f){
 if(Date.now()-preferencesAt>=300000||!preferencesAt){preferencesAt=Date.now();try{const p=await read('/api/preferences');if([60,120,300].includes(p.preferences?.refresh))refreshMs=p.preferences.refresh*1000;}catch{}}
 if(livePending)return livePending;
 if(liveAt&&Date.now()-liveAt<refreshMs)return liveData;
 if(liveAt&&!Prices.shouldPoll(liveData,f.trading_calendar))return liveData;
 liveAt=Date.now();livePending=(async()=>{try{liveData=await read('/api/data/live');liveWarning=liveData.note||'';}catch{liveWarning=liveData?'行情读取失败，保留上次有效报价，报价时间不变。':'行情读取失败，回退至标明日期的收盘数据。';}finally{livePending=null;}return liveData;})();
 return livePending;
}
const stamp=q=>({asof:`${q.time.slice(0,4)}-${q.time.slice(4,6)}-${q.time.slice(6,8)}`,time:`${q.time.slice(8,10)}:${q.time.slice(10,12)}:${q.time.slice(12,14)}`});
function stockModel(code,r,f){const v=Prices.stock(liveData,code,{price:r[1],chg:r[2]},f.asof),q=liveData?.quotes?.[code];return{code,name:r[0],...v,amount:v.live?(Number.isFinite(q.amount)?q.amount/1e8:null):r[3]/10000,turnover:v.live?q.turn:r[4],...(v.live?stamp(q):{asof:f.asof,time:'收盘'}),source:v.live?liveData.source:f.meta?.universe?.source};}
export function marketState(f,live=liveData,now=new Date()){const historical=live?.status==='historical',day=historical?String(live.snapshot_day||'').replaceAll('-',''):new Date(now.getTime()+8*3600000).toISOString().slice(0,10).replaceAll('-',''),market=Prices.market(live,now),times=[...Object.values(live?.quotes||{}),...Object.values(live?.indices||{})].filter(q=>(q.fresh||historical&&q.closingSnapshot)&&q.time?.slice(0,8)===day).map(q=>q.time).sort(),last=times.at(-1),at=last?stamp({time:last}):{asof:f.asof,time:'收盘'},session=historical?'历史收盘 · 非实时':live?.session?.label||'行情待更新';return{live:!!last&&!historical,asof:at.asof,session,quoteTime:at.time,status:live?.status||'pending',warning:liveWarning,summary:`${session} · ${at.asof} ${at.time}`,market,amountYi:market?.amountYi??f.ustats?.amount_yi,amountAsOf:market?.amountYi!=null?at.asof:f.asof};}

async function read(url){const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});if(r.status===401){location.href='/v2/login?returnTo='+encodeURIComponent(location.pathname+location.search+location.hash);throw Error('请先登录');}if(!r.ok)throw Error('HTTP '+r.status);return r.json();}
export async function marketSnapshot(){const {free}=await bundles();await liveSnapshot(free);return liveData;}
export async function bundles(){if(!bundle||Date.now()-bundleAt>=300000){bundleAt=Date.now();bundle=Promise.all([read('/api/data/free'),read('/api/data/member').catch(()=>({})),read('./samples.json').catch(()=>({}))]).then(([free,member,samples])=>{currentFree=free;return{free,member,samples};}).catch(e=>{bundle=null;throw e;});}return bundle;}
export async function openAccount(){
 const me=await read('/api/me');
 if(!me.user){location.href='/v2/login?returnTo='+encodeURIComponent(location.pathname+location.search+location.hash);throw Error('请先登录');}
 const store=window.GLAccountStore.create(localStorage,async(method,body)=>{
  const r=await fetch('/api/profile',{method,credentials:'same-origin',headers:{'content-type':'application/json','x-gl':'1'},body:body?JSON.stringify(body):undefined});
  const v=await r.json();if(!r.ok)throw Error(v.error||'资料同步失败');return v;
 });
 await store.open(me.user.id);
 const {free}=await bundles();
 const stocks=()=>store.profile.pool.filter(x=>!x.archived&&x.kind==='stock').map(s=>{const f=currentFree||free,r=f.uni?.[s.code];return r?stockModel(s.code,r,f):{...s,price:null,pct:null,asof:f.asof,label:'暂无报价'};});
 const findStocks=query=>{
  const term=String(query||'').trim().toLocaleLowerCase();
  if(!term)return [];
  return Object.entries(free.uni||{}).filter(([code,row])=>/^\d{6}$/.test(code)&&(code.includes(term)||String(row?.[0]||'').toLocaleLowerCase().includes(term)))
   .slice(0,12).map(([code,row])=>({code,name:row[0],asof:free.asof||null,source:free.meta?.universe?.source||'站内证券目录'}));
 };
 const findAssets=(query,kind='stock')=>{
  const term=String(query||'').trim().toLocaleLowerCase();
  if(!term)return [];
  if(kind==='stock')return findStocks(term).map(x=>({...x,kind:'stock'}));
  let catalog=[];
  if(kind==='etf')catalog=(free.etfs||[]).map(x=>({kind,code:String(x.code||''),name:String(x.name||''),source:free.meta?.etfs?.source||'站内ETF目录'}));
  if(kind==='industry')catalog=(free.sw?.boards||[]).map(x=>({kind,code:String(x.code||''),name:String(x.name||''),source:free.meta?.sw?.source||'站内行业目录'}));
  if(kind==='concept')catalog=(free.sector_flow?.groups?.concept||[]).map(x=>({kind,code:`${free.sector_flow?.sources?.concept||'concept'}:${x.code}`,name:String(x.name||''),source:free.sector_flow?.sources?.concept||'站内概念目录'}));
  return catalog.filter(x=>x.code&&x.name&&(x.code.toLocaleLowerCase().includes(term)||x.name.toLocaleLowerCase().includes(term)))
   .slice(0,12).map(x=>({...x,asof:free.asof||null}));
 };
 const joinDate=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
 const addWatch=async(code,{reason='',category='',focus=''}={})=>{
  const key=String(code||'').trim(),row=free.uni?.[key];
  if(!/^\d{6}$/.test(key)||!row||typeof row[0]!=='string')throw Error('当前证券目录没有此股票，请核对六位代码');
  const p=store.profile;
  p.pool=p.pool.filter(x=>!x.archived);
  if(p.pool.some(x=>x.kind==='stock'&&x.code===key))throw Error('该股票已在观察池');
  if(p.pool.length>=30)throw Error('观察池最多 30 项');
  const item={kind:'stock',code:key,name:row[0],added:joinDate(),addedAt:new Date().toISOString(),
   reason:String(reason).trim().slice(0,600),category:String(category).trim().slice(0,40),focus:String(focus).trim().slice(0,120)};
  p.pool.push(item);
  const next=await store.save(p);
  return next.pool.find(x=>x.kind==='stock'&&x.code===key);
 };
 const addAsset=async(kind,code,{reason='',category='',focus=''}={})=>{
  if(kind==='stock')return addWatch(code,{reason,category,focus});
  const item=findAssets(code,kind).find(x=>x.code===code);
  if(!item)throw Error('当前目录没有此关注对象，请核对代码或名称');
  const p=store.profile;
  p.pool=p.pool.filter(x=>!x.archived);
  if(p.pool.some(x=>x.kind===kind&&x.code===code))throw Error('该对象已在观察池');
  if(p.pool.length>=30)throw Error('观察池最多 30 项');
  p.pool.push({kind,code,name:item.name,added:joinDate(),addedAt:new Date().toISOString(),
   reason:String(reason).trim().slice(0,600),category:String(category).trim().slice(0,40),focus:String(focus).trim().slice(0,120)});
  const next=await store.save(p);
  return next.pool.find(x=>x.kind===kind&&x.code===code);
 };
 const savePosition=async(code,{shares,cost,recordDate,basket}={})=>{
  const key=String(code||'').trim(),row=free.uni?.[key];
  if(!/^\d{6}$/.test(key)||!row||typeof row[0]!=='string')throw Error('当前证券目录没有此股票，请核对六位代码');
  if(!Number.isInteger(shares)||shares<100||shares>1e9||!Number.isFinite(cost)||cost<=0||cost>1e7)throw Error('请输入有效的持仓股数和成本价');
  const p=store.profile,index=p.positions.findIndex(x=>x.code===key);
  if(recordDate&&!/^\d{4}-\d{2}-\d{2}$/.test(recordDate))throw Error('持仓记录日期格式不对');
  const position={code:key,name:row[0],shares,cost,...(recordDate?{recordDate}:{}),...(basket?{basket:String(basket).trim().slice(0,40)}:{})};
  if(index>=0)p.positions[index]=position;
  else{if(p.positions.length>=20)throw Error('持仓最多 20 项');p.positions.push(position);}
  const next=await store.save(p);
  return next.positions.find(x=>x.code===key);
 };
 const updateWatch=async(code,patch={},kind='stock')=>{
  const p=store.profile,item=p.pool.find(x=>!x.archived&&x.kind===kind&&x.code===code);
  if(!item)throw Error('该股票尚未加入观察池');
  for(const key of ['reason','category','focus','status'])if(Object.hasOwn(patch,key))item[key]=String(patch[key]??'').trim();
  if(Object.hasOwn(patch,'tasks'))item.tasks=patch.tasks;
  const next=await store.save(p);
  return next.pool.find(x=>!x.archived&&x.kind===kind&&x.code===code);
 };
 const removeWatch=async(code,kind='stock')=>{
  const p=store.profile;
  p.pool=p.pool.filter(x=>!x.archived);
  const index=p.pool.findIndex(x=>x.kind===kind&&x.code===code);
  if(index<0)throw Error('该股票不在观察池');
  const removed={...p.pool[index],restoreIndex:index};
  p.pool[index]={...p.pool[index],archived:true};
  await store.save(p);
  return removed;
 };
 const restoreWatch=async removed=>{
  const p=store.profile,index=p.pool.findIndex(x=>x.archived&&x.kind===removed?.kind&&x.code===removed?.code);
  if(index<0)throw Error('已无法撤销该次移出，请重新添加');
  const [item]=p.pool.splice(index,1);delete item.archived;
  p.pool.splice(Math.max(0,Math.min(removed.restoreIndex??index,p.pool.length)),0,item);
  const next=await store.save(p);
  return next.pool.find(x=>!x.archived&&x.kind===item.kind&&x.code===item.code);
 };
 const applyImport=async plan=>{
  if(!plan||!['holdings','watchlist'].includes(plan.kind)||!Array.isArray(plan.operations)||!plan.operations.length||plan.operations.length>500)throw Error('导入计划为空或超出行数限制');
  if(plan.baseVersion!==store.version)throw Error('账户资料已变化，请重新预览导入文件');
  const p=store.profile,seen=new Set();
  for(const op of plan.operations){
   const code=String(op?.code||''),row=free.uni?.[code];
   if(!/^\d{6}$/.test(code)||!row||op.kind!=='stock')throw Error(`证券目录未找到 ${code}，导入未保存`);
   if(seen.has(code))throw Error(`文件中存在重复代码 ${code}，导入未保存`);
   seen.add(code);
   if(!['add','replace'].includes(op.action))throw Error(`代码 ${code} 的处理方式无效`);
   if(plan.kind==='holdings'){
    if(!Number.isInteger(op.shares)||op.shares<100||op.shares>1e9||!Number.isFinite(op.cost)||op.cost<=0||op.cost>1e7)throw Error(`代码 ${code} 的股数或成本无效`);
    if(op.recordDate&&!/^\d{4}-\d{2}-\d{2}$/.test(op.recordDate))throw Error(`代码 ${code} 的日期格式无效`);
    const index=p.positions.findIndex(x=>x.code===code);
    if(op.action==='add'&&index>=0)throw Error(`代码 ${code} 已存在，请重新预览`);
    if(op.action==='replace'&&index<0)throw Error(`代码 ${code} 的原持仓已变化，请重新预览`);
    const item={code,name:row[0],shares:op.shares,cost:op.cost,...(op.recordDate?{recordDate:op.recordDate}:{})};
    if(index<0)p.positions.push(item);else p.positions[index]=item;
   }else{
    if(op.action!=='add')throw Error('观察池不允许覆盖已有研究资料');
    if(p.pool.some(x=>!x.archived&&x.kind==='stock'&&x.code===code))throw Error(`代码 ${code} 已在观察池，请重新预览`);
    p.pool=p.pool.filter(x=>!x.archived);
    p.pool.push({kind:'stock',code,name:row[0],added:joinDate(),addedAt:new Date().toISOString(),reason:String(op.reason||'').trim().slice(0,600)});
   }
  }
  if(p.positions.length>20||p.pool.filter(x=>!x.archived).length>30)throw Error('导入后超出账户容量，未保存任何行');
  return store.save(p,plan.baseVersion);
 };
 return{pool:()=>store.profile.pool.filter(x=>!x.archived),verification:()=>store.profile.verify,findStocks,findAssets,addWatch,addAsset,updateWatch,removeWatch,restoreWatch,applyImport,version:()=>store.version,
  savePosition,
  async saveReviewCheck(day,check,on){await store.save(updateReviewCheck(store.profile,day,check,on));},
  stocks,themes:()=>store.profile.pool.filter(x=>!x.archived&&x.kind==='theme'),
  async toggleTheme(t){const p=store.profile;window.GLFollow.toggle(p.pool,{kind:'theme',code:'relay:'+t.id,name:t.name},joinDate());await store.save(p);},
  positions:()=>store.profile.positions,
  async toggle(s){const p=store.profile;window.GLFollow.toggle(p.pool,{kind:'stock',code:s.code,name:s.name,base:s.price},joinDate());await store.save(p);return stocks();}
 };
}
function homeModel(f,m){const asof=f.asof,ev=m.ev||{},names={'000001':'上证指数','399001':'深证成指','399006':'创业板指'},indices=f.indices.filter(i=>names[i.code]).map(i=>({...i,name:names[i.code],asof,history:(f.idx?.[i.code==='000001'?'sh':i.code==='399001'?'sz':'cyb']||[]).slice(-60)})),sectors=[...(f.sw?.boards||[])].sort((a,b)=>(b.chg||0)-(a.chg||0)),top=sectors[0],stats=f.ustats||{},earn=[...(ev.earn||[])].filter(e=>!e.notice_date||e.notice_date<=new Date(Date.now()+8*3600000).toISOString().slice(0,10)).sort((a,b)=>(b.notice_date||'').localeCompare(a.notice_date||''));
 const signals=[];if(top)signals.push({title:top.name+'领涨行业，关注内部强弱分化',summary:`行业涨跌幅 ${top.chg}%，上涨 ${top.agg?.up??'—'} 家，下跌 ${top.agg?.down??'—'} 家。`,evidence:`原站行业快照 ${asof}`,tag:'数据',kind:'sector',payload:top});signals.push({title:'市场上涨与下跌家数，观察整体参与度',summary:`上涨 ${stats.up??'—'} 家，下跌 ${stats.down??'—'} 家，平盘 ${stats.flat??'—'} 家。`,evidence:`原站全市场快照 ${asof}`,tag:'数据',kind:'breadth',payload:stats});if(earn[0])signals.push({title:earn[0].name+'披露业绩预告',summary:earn[0].reason||'请查阅公告',evidence:earn[0].notice_date,tag:'事件',kind:'earnings',payload:earn[0]});
 return{asof,live:false,indices,sectors,signals,notices:earn.slice(0,4).map(e=>({code:e.code,name:e.name,date:e.notice_date,title:e.name+'：'+e.forecast_type+'预告',detail:e.reason,source:'原站公告快照'})),sources:{indices:f.meta?.indices||f.meta?.universe,sectors:f.meta?.sw,universe:f.meta?.universe,events:m.meta?.events},coverage:Object.keys(f.uni||{}).length,historyLabel:'近60个交易日 · 收盘走势'};}
export async function apiFetch(url,options){const u=new URL(url,location.origin);if(!['/api/home','/api/monitor','/api/search'].includes(u.pathname)){return fetch(url.replace('/api/chart','/api/v2/chart').replace('/api/quotes','/api/v2/quotes'),options);}
 try{const {free:f,member:m,samples}=await bundles();await liveSnapshot(f);const state=marketState(f);let value;
 if(u.pathname==='/api/home'){value=homeModel(f,m);industryMembers??=read('./industry-members.json').catch(()=>({}));applyIndustries(value,f,liveData,await industryMembers);Object.assign(value,state);value.indices=value.indices.map(i=>{const v=Prices.index(liveData,i,f.asof),q=liveData?.indices?.[(i.code.startsWith('399')?'sz':'sh')+i.code];return{...i,...v,chg_pct:v.pct,chg:v.live?v.price-q.lastClose:i.chg,...(v.live?stamp(q):{asof:f.asof,time:'收盘'})};});if(state.market){const b=value.signals.find(s=>s.kind==='breadth');if(b){b.summary=`上涨 ${state.market.up} 家，下跌 ${state.market.down} 家，平盘 ${state.market.flat} 家。`;b.evidence=state.market.label;b.payload=state.market;}}const histories=await read('./index-history.json').catch(()=>[]);for(const i of value.indices){if(!i.history.length)i.history=(histories.find(x=>x.code===i.code)?.history||[]).filter(x=>x.date<=f.asof);}}
 else if(u.pathname==='/api/search'){const q=(u.searchParams.get('q')||'').toLowerCase();value=Object.entries(f.uni||{}).filter(([c,r])=>q&&(c.startsWith(q)||r[0].toLowerCase().includes(q))).slice(0,12).map(([code,r])=>stockModel(code,r,f));}
 else{const preferred=['600487','603986','301132','000001','002594','688981'];const stocks=Object.entries(f.uni||{}).map(([code,r])=>stockModel(code,r,f));stocks.sort((a,b)=>(preferred.includes(a.code)?preferred.indexOf(a.code):99)-(preferred.includes(b.code)?preferred.indexOf(b.code):99)||a.code.localeCompare(b.code));const by=Object.fromEntries(stocks.map(s=>[s.code,s]));const themes=(samples.themes||[]).map(t=>{const rows=t.stocks.filter(s=>by[s.code]).map(s=>({...s,...by[s.code]})).sort((a,b)=>b.pct-a.pct),v=rows.map(s=>s.pct).sort((a,b)=>a-b),n=v.length;return{...t,stocks:rows,asof:f.asof,covered:rows.length,median:n?(v[Math.floor(n/2)]+v[Math.floor((n-1)/2)])/2:null,description:`原有标签样本 ${rows.length} 家；标签日期 ${samples.asof}，报价日期 ${f.asof}。`,source:'原站数据网关报价 + 已有标签样本',score:null};});const ev=m.ev||{};value={...state,stocks,themes,news:ev.news||[],newsAsOf:m.meta?.events?.asof,anomalies:samples.asof===f.asof?samples.anomalies||[]:[],relay:samples.asof===f.asof?samples.relay||[]:[],previousDate:samples.previousDate,sampleAsOf:samples.asof,source:f.meta?.universe||{},amountYi:state.amountYi};}
 return new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}});
 }catch(e){return new Response(JSON.stringify({error:e.message}),{status:503});}}
