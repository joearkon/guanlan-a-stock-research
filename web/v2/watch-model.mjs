const digits=v=>String(v||'').replace(/\D/g,'');
export {monitorRows,monitorPortfolio,createMonitorState,monitorHandoff,enrichMonitorRow} from './monitor-model.mjs';
export function validQuote(feed,q){
 const day=digits(feed?.snapshot_day||feed?.session?.day||feed?.asof);
 if(!q||!Number.isFinite(q.pct)||!(q.price>0))return null;
 if(feed.status==='historical')return (q.fresh||q.closingSnapshot)&&digits(q.time).slice(0,8)===day?q:null;
 const usable=['ok','partial'].includes(feed.status)||feed.status==='paused'&&feed.session?.label==='午间休市'||feed.session?.label==='已收盘'&&digits(q.time).slice(8,12)>='1459';
 return usable&&q.fresh&&digits(q.time).slice(0,8)===day?q:null;
}
export function watchModel(f={},feed={}){
 const day=feed.snapshot_day||feed.session?.day||feed.asof||'', b=f.relay_baseline;
 // The published server baseline is authoritative, including an unavailable baseline.
 const previous=b?b.date:f.lu?.date;
 const prior=previous&&previous<day&&(!b?.feedbackDate||b.feedbackDate===day);
 const source=prior?(b?b.ladder:f.lu?.ladder)||[]:[];
 const ladder=source.map(s=>({...s,quote:validQuote(feed,feed.quotes?.[s.code])})).sort((a,b)=>(b.n||0)-(a.n||0));
 const events=feed.status==='historical'&&!feed.snapshot_day?[]:(feed.alerts||[]).filter(a=>digits(a.time).slice(0,8)===digits(day)).slice().reverse().map(a=>feed.status==='historical'?{...a,historical:true}:a);
 return {day,previous:prior?previous:null,ladder,events,baseline:b,feed};
}
export function filterEvents(events,threshold=1.5){return events.filter(a=>Math.abs(a.change_pct??100)>=threshold).slice(0,30);}
export function eventEvidence(a={},feed={}){const number=v=>Number.isFinite(v)?v:null;return {trigger:number(a.price),base:number(a.base_price),windowPct:number(a.change_pct),span:number(a.span_sec),limit:number(a.limit_up),latest:validQuote(feed,feed.quotes?.[a.code]),history:(feed.alerts||[]).filter(x=>x.code===a.code&&digits(x.time).slice(0,8)===digits(feed.snapshot_day||feed.session?.day||feed.asof)).slice().reverse()};}
export const SLOTS=['09:25','09:35','10:00','11:30','14:00','15:00'];
export function auctionModel(raw={}){
 const slots=SLOTS.map(slot=>{const s=raw.slots?.find(x=>x.slot===slot);const snapshot=raw.date&&s?.snapshot?.date===raw.date?s.snapshot:null;return {slot,state:snapshot?'saved':s?.state==='saved'?'missing':s?.state||'missing',snapshot};});
 const saved=slots.filter(s=>s.snapshot),auction=slots[0].snapshot;
 return {...raw,slots,saved,auction,latest:saved.at(-1)?.snapshot,highOpen:Number.isFinite(auction?.up_rate)?auction.up_rate*100:null};
}
