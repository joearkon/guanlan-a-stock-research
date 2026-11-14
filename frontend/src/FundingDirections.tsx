import {useInfiniteQuery} from '@tanstack/react-query';
import {getJSON,number,retryRead} from './api';
import {Widget} from './components';
function Direction({model,direction,onPick,archive}:{model:any;direction:string;archive:string;onPick:(direction:string,code:string)=>void}){
 const url='/api/data/theme-observation?'+new URLSearchParams({provider:model.provider,view:'hot',direction,search:'',archive,limit:'20',model:model.id});
 const q=useInfiniteQuery({queryKey:['resource',url],initialPageParam:'',queryFn:({pageParam,signal})=>getJSON(pageParam?url.replace('limit=20','limit=10')+'&cursor='+encodeURIComponent(pageParam):url,signal),getNextPageParam:(p:any)=>p.nextCursor||undefined,staleTime:Infinity,refetchOnWindowFocus:false,retry:retryRead(1)}),first=q.data?.pages[0],valid=first?.id===model.id,rows=valid?first.boards||[]:[];
 return <Widget title={direction==='rise'?'集体向上':'集体向下'} subtitle="同批量价支撑前三" loading={q.isPending} error={q.error?.message} retry={()=>q.refetch()}>
 {rows.slice(0,3).map(b=><button type="button" className="funding-direction-item" key={b.code} onClick={()=>onPick(direction,b.code)}><strong>{b.name}</strong><span className={direction==='rise'?'up':'down'}>{number((b.collective?.[direction]?.daily?.memberRatio??0)*100,1)}% 同向支撑</span></button>)}
 {!q.isPending&&!q.error&&valid&&!rows.length&&<p className="empty">没有达到同向支撑条件的方向，不用孤立上涨或下跌凑榜。</p>}
 {!q.isPending&&q.data&&!valid&&<p role="alert">快照版本不匹配，请更新榜单。</p>}
 </Widget>;
}
export default function FundingDirections({model,onPick,archive=''}:{model:any;archive?:string;onPick:(direction:string,code:string)=>void}){
 return <section aria-label="量价方向"><h2>量价支撑</h2><p className="provenance">观察多股同向支撑，与资金净额分开；量价迹象不代表真实资金流入流出。</p><div className="funding-directions">{['rise','fall'].map(direction=><Direction key={direction+model.id} model={model} direction={direction} archive={archive} onPick={onPick}/>)}</div></section>;
}
