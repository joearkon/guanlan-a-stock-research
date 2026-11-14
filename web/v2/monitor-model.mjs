// Account membership and market evidence stay separate. No sample tickers or prices.
const num=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
const day=v=>{const s=String(v||'').replace(/\D/g,'');return s.length>=8?`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`:'';};
export function enrichMonitorRow(row,detail){
 if(row.price===null&&detail&&num(detail.price)>0){
  const asof=day(detail.asof),price=num(detail.price),lastClose=num(detail.prev),shares=num(row.shares),cost=num(row.cost);
  const stale=asof!==row.feedDay,value=price>0&&shares>0?price*shares:null;
  const dayPnl=!stale&&lastClose>0&&shares>0&&day(row.recordDate)!==row.feedDay?(price-lastClose)*shares:null;
  return {...row,price,lastClose,pct:lastClose>0?Math.round((price/lastClose-1)*10000)/100:null,
   open:num(detail.open),high:num(detail.high),low:num(detail.low),volumeRatio:num(detail.volumeRatio),
   asof,time:detail.time,source:detail.source||'腾讯行情',stale,reason:stale?'历史报价，未取得本交易日有效行情':(row.kind==='etf'?'ETF':'个股')+'独立报价，采样时点与共享股票行情分别核验',
   value,floating:value!==null&&cost!==null?(price-cost)*shares:null,dayPnl,
   dayReason:dayPnl===null?'缺同日有效报价、昨收或持仓数量':'按当前股数估算，不含日内交易与费用'};
 }
 if(!detail||detail.asof!==row.asof)return {...row,detailReason:'附加报价未取得或日期不一致'};
 const own=String(row.time||'').replace(/\D/g,'').slice(8),other=String(detail.time||'').replace(/\D/g,'');
 const seconds=s=>+s.slice(0,2)*3600 + +s.slice(2,4)*60 + +s.slice(4,6);
 const sameClose=row.closeSnapshot&&own>='150000'&&other>='150000'&&other<='235959'&&num(detail.price)===row.price;
 if(own.length!==6||other.length!==6||(!sameClose&&Math.abs(seconds(own)-seconds(other))>300))return {...row,detailReason:'附加报价与共享报价相差超过5分钟，未混用'};
 return {...row,volumeRatio:num(detail.volumeRatio),open:row.open??num(detail.open),high:row.high??num(detail.high),low:row.low??num(detail.low),detailTime:detail.time,detailSource:detail.source||'腾讯行情',detailReason:''};
}
export function monitorRows({scope,pool=[],positions=[],feed={},free={}}){
 const members=scope==='watch'?pool.filter(s=>!s.archived&&['stock','etf'].includes(s.kind)):scope==='positions'?positions.filter(s=>!s.archived):[];
 const seen=new Set(),target=day(feed.snapshot_day||feed.session?.day||feed.asof);
 return members.filter(s=>s.code&&!seen.has(s.code)&&seen.add(s.code)).map(s=>{
  const raw=feed.quotes?.[s.code],f=free.uni?.[s.code],q=raw&&num(raw.price)>0?raw:null;
  const asof=day(q?.time||(!q&&f?free.asof:'')),historical=feed.status==='historical';
  const price=num(q?.price??f?.[1]),lastClose=num(q?.lastClose??q?.prev),shares=num(s.shares),cost=num(s.cost);
  const closeSnapshot=!!q&&asof===target&&feed.session?.label==='已收盘'&&/^\d{14}$/.test(q.time||'')&&q.time.slice(8)>='150000'&&q.time.slice(8)<='235959';
  const stale=!q||asof!==target||(historical?!(q.fresh||q.closingSnapshot):!closeSnapshot&&(!q.fresh||!['ok','partial','paused'].includes(feed.status)));
  const value=price>0&&shares>0?price*shares:null;
  const changed=day(s.recordDate)===target;
  const dayPnl=!stale&&!changed&&lastClose>0&&shares>0?(price-lastClose)*shares:null;
  return {...s,feedDay:target,name:q?.name||s.name||f?.[0]||s.code,price,lastClose,pct:num(q?.pct??f?.[2]),
   amount:num(q?.amount??(f&&num(f[3])!==null?f[3]*10000:null)),turn:num(q?.turn??f?.[4]),
   open:num(q?.open),high:num(q?.high),low:num(q?.low),volumeRatio:num(q?.volumeRatio),
   time:q?.time||asof,asof,stale,historical,closeSnapshot,source:q?(feed.source||'共享行情'):'已发布收盘资料',
   reason:price===null?'尚未取得报价':stale?'历史报价，未取得本交易日有效行情':closeSnapshot?'当日收盘快照，非实时':historical?'历史收盘报价':'',
   value,floating:value!==null&&cost!==null?(price-cost)*shares:null,dayPnl,
   dayReason:changed?'日内持仓有变更，需成交记录核对':dayPnl===null?'缺同日有效报价、昨收或持仓数量':'按当前股数估算，不含日内交易与费用'};
 });
}
export function monitorQuoteCodes(rows,free){return [...new Set(rows.filter(r=>r.kind==='etf'?/^(?:159\d{3}|5(?:1\d|6[0-3]|8[89])\d{3})$/.test(r.code):!!free?.uni?.[r.code]).map(r=>r.code).filter(c=>/^\d{6}$/.test(c)))].sort().slice(0,80);}
export function monitorPortfolio(rows){
 const complete=rows.length>0&&rows.every(r=>r.value!==null&&!r.stale)&&new Set(rows.map(r=>r.asof)).size===1;
 const total=complete?rows.reduce((a,r)=>a+r.value,0):null;
 const weights=total>0?Object.fromEntries(rows.map(r=>[r.code,r.value/total*100])):{};
 return {complete,total,weights,missing:rows.filter(r=>r.stale||r.value===null).length,dayPnl:complete&&rows.every(r=>r.dayPnl!==null)?rows.reduce((a,r)=>a+r.dayPnl,0):null,
  maxWeight:total>0?Math.max(...Object.values(weights)):null,
  reason:!rows.length?'尚未录入持仓':!complete?'报价缺失或跨日，暂不汇总组合':rows.some(r=>r.dayPnl===null)?'持仓变更待核对，暂不汇总当日估算盈亏':''};
}
export function createMonitorState(search=''){
 const p=new URLSearchParams(search),scopes=['all','watch','positions'],initial=scopes.includes(p.get('scope'))?p.get('scope'):'all';
 const state={scope:initial,selections:{[initial]:p.get('selected')||''},scroll:{},sort:{},filter:{},
  get selected(){return this.selections[this.scope]||'';},
  select(code){this.selections[this.scope]=code;},
  switch(next){this.scope=scopes.includes(next)?next:'all';},
  reconcile(rows){if(!rows.some(r=>r.code===this.selected))this.select(rows[0]?.code||'');},
  query(){const q=new URLSearchParams({scope:this.scope});if(this.selected)q.set('selected',this.selected);return q.toString();}};
 return state;
}
export function monitorHandoff(row){return {stock:{code:row.code,name:row.name},asof:row.asof,quoteTime:row.time,section:'实时动态'};}
