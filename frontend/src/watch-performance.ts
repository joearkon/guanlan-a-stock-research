import type {QueryClient} from '@tanstack/react-query';
import {publicQuery} from './api';
import {validDate} from './portfolio-data';
const positive=(n:any)=>typeof n==='number'&&Number.isFinite(n)&&n>0;
export function quoteDay(quote:any){
 const time=String(quote?.time||'');
 const date=/^\d{14}$/.test(time)?`${time.slice(0,4)}-${time.slice(4,6)}-${time.slice(6,8)}`:String(quote?.asof||'').slice(0,10);
 return validDate(date)?date:'';
}
export function watchBaseline(quote:any,now=new Date()):any{
 const date=quoteDay(quote),today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(now);
 if(!positive(quote?.price)||date!==today)return {};
 const time=String(quote?.time||'');
 if(/^\d{14}$/.test(time)&&Date.parse(`${date}T${time.slice(8,10)}:${time.slice(10,12)}:${time.slice(12,14)}+08:00`)>+now)return {};
 if(/^\d{2}:\d{2}:\d{2}$/.test(time)&&Date.parse(`${date}T${time}+08:00`)>+now)return {};
 return {base:quote.price,baseDate:date,baseSource:String(quote.source||'共享证券报价').slice(0,120),baseTime:time.slice(0,40)};
}
// Only user-confirmed adds read this bounded batch endpoint. Ordinary table
// switches are local calculations and never fetch historical prices.
export async function readWatchQuotes(client:QueryClient,codes:string[]){
 const joined=[...new Set(codes.filter(c=>/^\d{6}$/.test(c)))].sort().join(',');if(!joined)return {};
 try{return (await client.fetchQuery({...publicQuery('/api/v2/quotes?codes='+joined,60000),retry:false,queryFn:async({signal})=>{
  const r=await fetch('/api/v2/quotes?codes='+joined,{credentials:'same-origin',signal:AbortSignal.any([signal,AbortSignal.timeout(2500)])});if(!r.ok)throw Error('基准报价未取得');return r.json();
 }})).quotes||{};}catch{return {};}
}
export function watchPerformance(row:any,quote:any):{change:number|null;date:string;reason:string}{
 const date=String(row.added||row.addedAt||'').slice(0,10),current=quoteDay(quote);
 if(!positive(row.base))return {change:null,date,reason:'缺少加入基准价'};
 if(!positive(quote?.price)||!current)return {change:null,date,reason:'报价或报价日期未取得'};
 if(!validDate(date)||current<date)return {change:null,date,reason:'报价早于加入日或加入日期缺失'};
 return {change:Math.round((quote.price/row.base-1)*1000000)/10000,date,reason:'相对加入时保存基准价的价格变化，不含分红与复权，不是持仓收益'};
}
