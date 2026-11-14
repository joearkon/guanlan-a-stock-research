import {marketReadInterval,useMarketClock} from './market-polling';
import {useQueries,useQueryClient,type QueryClient} from '@tanstack/react-query';
import {publicQuery} from './api';
const canonical=(codes:string)=>[...new Set(codes.split(',').filter(c=>/^\d{6}$/.test(c)))].sort();
export function accountQuoteCodes(profile:any){
 return canonical([...(profile?.pool||[]).filter((r:any)=>!r.archived),...(profile?.positions||[])].filter((r:any)=>['stock','etf'].includes(r.kind||'stock')).map((r:any)=>r.code).join(',')).join(',');
}
function recentSubset(client:QueryClient,codes:string[]){
 const quotes:Record<string,any>={},times:number[]=[];let calendar:any;
 for(const query of client.getQueryCache().findAll({queryKey:['resource']})){
  if(typeof query.queryKey[1]!=='string'||!query.queryKey[1].startsWith('/api/v2/quotes?codes=')||Date.now()-query.state.dataUpdatedAt>=60000)continue;
  const data:any=query.state.data;if(!data?.quotes)continue;
  for(const code of codes)if(data.quotes[code]&&!quotes[code]){quotes[code]=data.quotes[code];times.push(query.state.dataUpdatedAt);calendar??=data.calendar;}
 }
 return codes.every(code=>quotes[code])?{data:{quotes,calendar},at:Math.min(...times)}:undefined;
}
// Bounded quote batches share public prices across home, portfolio and drawers.
// They never download the full universe or wait for account-independent modules.
export function useQuoteBatch(input:string){
 const client=useQueryClient(),codes=canonical(input),now=useMarketClock();
 const batches=Array.from({length:Math.ceil(codes.length/80)},(_,i)=>codes.slice(i*80,(i+1)*80));
const queries=useQueries({queries:batches.map(batch=>{const url='/api/v2/quotes?codes='+batch.join(','),seed=recentSubset(client,batch);return {...publicQuery(url,60000),initialData:seed?.data,initialDataUpdatedAt:seed?.at,refetchInterval:(q:any)=>marketReadInterval(60000,q.state.data?.calendar,now,'',document.hidden,navigator.onLine!==false)};})});
 const values=queries.map(q=>q.data).filter(Boolean);
 return {data:values.length?{quotes:Object.assign({},...values.map((d:any)=>d.quotes)),calendar:(values[0] as any)?.calendar}:undefined,error:queries.find(q=>q.error)?.error,isPending:queries.some(q=>q.isPending),isFetching:queries.some(q=>q.isFetching),refetch:()=>Promise.all(queries.map(q=>q.refetch({cancelRefetch:false})))};
}
