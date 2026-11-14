export const MA_WINDOWS=[5,10,20,60];
export function average(values:(number|null)[],n:number):(number|null)[]{return values.map((_,i)=>{const slice=values.slice(i+1-n,i+1);return i+1<n||slice.some(v=>typeof v!=='number'||!Number.isFinite(v))?null:(slice as number[]).reduce((a,b)=>a+b,0)/n;});}
export function financialData(payload:any){
 const bars=payload.bars||[];let previous='';
 const candles=bars.map(b=>{const t=b.time;if(typeof t!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(t)||new Date(t+'T00:00:00Z').toISOString().slice(0,10)!==t||t<=previous)throw Error('K线日期无效、重复或未按顺序排列');previous=t;
  if(![b.open,b.high,b.low,b.close].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>0)||b.high<Math.max(b.open,b.close)||b.low>Math.min(b.open,b.close))throw Error('K线价格数据不完整');
  if(b.volume!=null&&!(typeof b.volume==='number'&&Number.isFinite(b.volume)&&b.volume>=0))throw Error('成交量数据无效');return {time:t,open:b.open,high:b.high,low:b.low,close:b.close};});
 const volume=bars.map(b=>b.volume==null?{time:b.time}:{time:b.time,value:b.volume,color:b.close>=b.open?'var(--up)':'var(--down)'});
 const ma=Object.fromEntries(MA_WINDOWS.map(n=>[n,average(bars.map(b=>b.close),n).map((v,i)=>v==null?{time:bars[i].time}:{time:bars[i].time,value:v})]));
 return {candles,volume,ma};
}
