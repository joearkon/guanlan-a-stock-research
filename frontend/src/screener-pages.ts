import {useMemo} from 'react';
import {keepPreviousData,useInfiniteQuery} from '@tanstack/react-query';
import {getJSON} from './api';
type Next={offset:number;model:string;footprint?:string;day?:string;groupsVersion?:string;total:number};
const expired=()=>Object.assign(new Error('分页快照已失效或不一致，请读取最新共享快照。'),{status:409});
// Both editions use the existing read-only 20-row endpoint. Only mobile appends.
export function useScreenerPages({url,queryKey,enabled,mobile}:{url:string;queryKey:any[];enabled:boolean;mobile:boolean}){
 const q=useInfiniteQuery({queryKey:[...queryKey,mobile?'mobile-feed':'desktop-page'],enabled,initialPageParam:null as Next|null,
  queryFn:async({pageParam,signal})=>{
   let target=url;if(pageParam){const [path,raw]=url.split('?'),p=new URLSearchParams(raw);p.set('offset',String(pageParam.offset));p.set('model',pageParam.model);if(pageParam.footprint)p.set('footprint',pageParam.footprint);target=path+'?'+p;}
   const d=await getJSON(target,signal);
   if(pageParam&&(!Array.isArray(d.rows)||d.offset!==pageParam.offset||d.model!==pageParam.model||d.footprint!==pageParam.footprint||d.day!==pageParam.day||d.groupsVersion!==pageParam.groupsVersion||d.total!==pageParam.total))throw expired();
   if(d.next!=null&&(!Number.isSafeInteger(d.next)||d.next<=(d.offset||0)||d.next>=d.total))throw expired();
   return d;
  },getNextPageParam:last=>mobile&&last.next!=null?{offset:last.next,model:last.model,footprint:last.footprint,day:last.day,groupsVersion:last.groupsVersion,total:last.total}:undefined,
  placeholderData:keepPreviousData,retry:false,staleTime:Infinity,refetchOnWindowFocus:false,refetchOnReconnect:false});
 const data=useMemo(()=>{const pages=q.data?.pages;if(!pages?.length)return undefined;if(!mobile)return pages[0];const seen=new Set<string>(),rows=pages.flatMap(p=>p.rows||[]).filter(r=>{if(seen.has(r.code))return false;seen.add(r.code);return true;});return {...pages[0],offset:0,rows,next:pages.at(-1)!.next};},[q.data,mobile]);
 return {...q,data,error:q.isFetchNextPageError?null:q.error,appendError:q.isFetchNextPageError?q.error:null,loadMore:()=>q.fetchNextPage({cancelRefetch:false})};
}
