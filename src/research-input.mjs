import {cleanVerificationPacket} from '../web/shared/candidate-verification.mjs';
const clean=(value,max=160)=>typeof value==='string'?value.replace(/[\u0000-\u001f]/g,' ').slice(0,max):null;
const pick=(object,keys)=>Object.fromEntries(keys.filter(k=>Object.hasOwn(object||{},k)&&['string','number','boolean'].includes(typeof object[k])).map(k=>[k,typeof object[k]==='string'?clean(object[k],500):object[k]]));
const quoteKeys=['code','name','kind','price','close','prev','open','high','low','chg','pct','change','changePct','amount','amountYi','turnover','volume','volumeRatio','pe','pb','source','asof','time','lastClose'];
const identity=value=>value&&/^\d{6}$/.test(value.code)?{code:value.code,...(clean(value.name,80)?{name:clean(value.name,80)}:{})}:null;
export function researchInput(request){
 const c=request.context||{},context=pick(c,['page','section','asof','industry','focus','snapshotId']);
 if(typeof c.focus==='string')context.focus=clean(c.focus,1000);
 const stock=identity(c.stock);if(stock)context.stock=stock;
 const subject=c.subject;if(subject&&['company','industry','topic'].includes(subject.kind))context.subject={kind:subject.kind,name:clean(subject.name,80),...(identity(subject)||{})};
 if(c.funds&&['industry','concept'].includes(c.funds.kind))context.funds={...pick(c.funds,['mode','kind','period']),boards:Array.isArray(c.funds.boards)?c.funds.boards.filter(x=>typeof x==='string').slice(0,5).map(x=>clean(x,80)):[]};
 const evidence=[];
 for(const e of (Array.isArray(request.evidence)?request.evidence:[]).slice(0,32)){
  if(e.scope!=='public_market')continue;
  const dataDate=/^\d{4}-\d{2}-\d{2}$/.test(e.dataDate||'')?e.dataDate:null;
  if(/^shared:verification:[a-f0-9]{64}$/.test(e.id)){const p=cleanVerificationPacket(e.data);if(e.id!=='shared:verification:'+p.id)throw Error('证据身份不一致');evidence.push({id:e.id,source:'观澜固定多源证据',dataDate:p.analysisDay,data:p});}
  else if(e.id==='shared:market')evidence.push({id:e.id,source:'观澜公开收盘共享资料（非实时）',dataDate,data:{...pick(e.data,['asof']),market:pick(e.data?.market,['up','down','flat','amount_yi','amountYi','total']),indices:(Array.isArray(e.data?.indices)?e.data.indices:[]).slice(0,20).map(q=>pick(q,quoteKeys)),limits:pick(e.data?.limits,['date','zt','dt','height'])}});
  else if(/^shared:stock:\d{6}$/.test(e.id)){
   const code=e.id.split(':').at(-1),raw=e.data?.quotes?.[code];
   evidence.push({id:e.id,source:'观澜公开个股共享报价',dataDate,data:{...pick(e.data,['asof','source']),quotes:raw?{[code]:pick(raw,quoteKeys)}:{}}});
  }
 }
 return {question:clean(request.question,500)||'',context,evidence,deepThinking:request.deepThinking===true,preferences:{style:request.agentRole==='legacy'?'通俗解读':'专业投研',detail:['concise','standard','detailed'].includes(request.responseDetail)?request.responseDetail:'standard'}};
}
