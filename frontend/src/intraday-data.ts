export type IntradaySession={date:string,from:number,to:number};
export function intradayData(payload:any):{prices:any[],volume:any[],sessions:IntradaySession[]}{
 let previous=-Infinity,lastClose:number|null=null;const volume:any[]=[],sessions:IntradaySession[]=[];
 const prices=(payload.bars||[]).map((b,index)=>{const t=b.time,ms=typeof t==='string'&&/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(t)?Date.parse(t.replace(' ','T')+':00+08:00'):NaN;
  if(!Number.isFinite(ms)||new Date(ms+8*3600000).toISOString().slice(0,16).replace('T',' ')!==t||ms<=previous||!(typeof b.close==='number'&&Number.isFinite(b.close)&&b.close>0))throw Error('分时日期或价格无效、重复或未排序');
  if(b.volume!=null&&!(typeof b.volume==='number'&&Number.isFinite(b.volume)&&b.volume>=0))throw Error('分时成交量无效');
  const date=t.slice(0,10),session=sessions.at(-1);if(session&&session.date===date)session.to=index;else sessions.push({date,from:index,to:index});
  const time=ms/1000;volume.push(b.volume==null?{time}:{time,value:b.volume,color:b.close>=(lastClose??b.close)?'var(--up)':'var(--down)'});previous=ms;lastClose=b.close;return {time,value:b.close};
 });return {prices,volume,sessions};
}
