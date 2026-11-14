const numeric=(v:any)=>typeof v==='number'&&Number.isFinite(v)?v:-Infinity;
export const eventCountFor=(r:any,direction='all')=>Number(r[direction==='rise'?'riseEventCount':direction==='fall'?'fallEventCount':'eventCount'])||0;
export const eventTimeFor=(r:any,direction='all')=>String(r[direction==='rise'?'latestRiseTime':direction==='fall'?'latestFallTime':'latestEventTime']||'');
export const hotTier=(r:any)=>r.covered>0&&r.covered>=r.memberCount*.8&&r.strong>=2?(r.signal==='多股走强'?2:1):0;
export function rankConcepts<T extends Record<string,any>>(rows:T[],sort:string,view:string,direction='all'):T[]{
 const count=(r:any)=>eventCountFor(r,direction),time=(r:any)=>eventTimeFor(r,direction),share=(r:any)=>r.memberCount>0?count(r)/r.memberCount:0;
 return [...rows].sort((a,b)=>{
  if(sort==='hot')return (b.support?.tier||0)-(a.support?.tier||0)||hotTier(b)-hotTier(a)||(hotTier(a)>0?(b.strong/b.covered-a.strong/a.covered)||(b.strong-a.strong):0)||numeric(b.median)-numeric(a.median)||String(a.code).localeCompare(String(b.code));
  if(sort==='latest')return time(b).localeCompare(time(a))||share(b)-share(a)||count(b)-count(a)||String(a.code).localeCompare(String(b.code));
  if(sort==='ratio')return share(b)-share(a)||count(b)-count(a)||time(b).localeCompare(time(a))||String(a.code).localeCompare(String(b.code));
  const key=sort==='events'||sort==='original'&&view==='anomaly'?'eventCount':sort==='amount'?'amountYi':sort==='average'?'average':sort==='original'?'strong':'median';
  return numeric(b[key])-numeric(a[key])||numeric(b.median)-numeric(a.median)||String(a.code).localeCompare(String(b.code));
 });
}
