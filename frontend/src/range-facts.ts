import {financialData} from './financial-data';
export function benchmarkFacts(stock:any,index:any,through:string):any[]{
 const missing=[3,10,30].map(days=>({days,covered:false}));
 if(stock?.period!=='day'||index?.period!=='day'||stock?.adjustment!=='none'||index?.adjustment!=='none'||index?.asset!=='index'||index?.code!=='000300')return missing;
 financialData(stock);financialData(index);
 const sb=(stock.bars||[]).filter(b=>b.time<=through),ib=(index.bars||[]).filter(b=>b.time<=through),byDate=new Map(sb.map(b=>[b.time,b]));
 if(sb.at(-1)?.time!==through||ib.at(-1)?.time!==through)return missing;
 return [3,10,30].map(days=>{
  const rows=ib.slice(-days-1);
  if(rows.length!==days+1||rows.some(b=>!byDate.has(b.time)))return {days,covered:false};
  const first:any=byDate.get(rows[0].time),last:any=byDate.get(through),stockPct=(last.close/first.close-1)*100,indexPct=(rows.at(-1).close/rows[0].close-1)*100,rounded=(x:number)=>Math.round(x*1e8)/1e8;
  return {days,covered:true,from:rows[0].time,through,stockPct:rounded(stockPct),indexPct:rounded(indexPct),difference:rounded(stockPct-indexPct)};
 });
}
export function rangeFacts(payload:any):any[]{
 const bars=payload?.period==='day'?payload.bars||[]:[];
 financialData({bars});
 return [3,10,30].map(days=>{
  const rows=bars.slice(-days),base=bars.at(-days-1);
  if(rows.length<days||!base)return {days,covered:false};
  let up=0,down=0,volumeUp=0,volumeDown=0;
  const volumeCovered=[base,...rows].every(b=>typeof b.volume==='number'&&Number.isFinite(b.volume));
  rows.forEach((b,i)=>{const prior=i?rows[i-1]:base;up+=Number(b.close>prior.close);down+=Number(b.close<prior.close);if(volumeCovered){volumeUp+=Number(b.volume>prior.volume);volumeDown+=Number(b.volume<prior.volume);}});
  return {days,covered:true,from:base.time,through:rows.at(-1).time,returnPct:Math.round((rows.at(-1).close/base.close-1)*1e10)/1e8,amplitude:(Math.max(...rows.map(b=>b.high))/Math.min(...rows.map(b=>b.low))-1)*100,up,down,volumeUp:volumeCovered?volumeUp:null,volumeDown:volumeCovered?volumeDown:null};
 });
}
