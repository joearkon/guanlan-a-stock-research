import {useState} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {getJSON,retryRead} from './api';
import LiveEventStream from './LiveEventStream';
import {Skeleton,LocalRefresh} from './components';
import {useMarketReadInterval} from './market-polling';
export default function DayEventStream({day,fallback=[],onSelect,code='',direction='all'}:{day:string,fallback?:any[],onSelect:(e:any)=>void,code?:string,direction?:string}){
 const [chosenDate,setDate]=useState<string|null>(null),date=chosenDate??day,[kind,setKind]=useState('');
 const interval=useMarketReadInterval(60000,undefined,date);
const q=useInfiniteQuery({queryKey:['resource','/api/data/events?'+new URLSearchParams({date,code,kind,direction})],initialPageParam:'',enabled:!!date,queryFn:({pageParam,signal})=>getJSON('/api/data/events?'+new URLSearchParams({date,limit:'50',...(code?{code}:{}),...(kind?{kind}:{}),...(direction!=='all'?{direction}:{}),...(pageParam?{before:pageParam}:{})}),signal),getNextPageParam:(p:any)=>p.nextCursor||undefined,refetchInterval:interval,retry:retryRead(1)});
 const first=q.data?.pages[0],archive=!!first?.coverage,rows=archive?q.data!.pages.flatMap((p:any)=>p.events||[]):fallback.filter(e=>date===day&&(!code||e.code===code)&&(!kind||e.kind===kind)&&(direction==='all'||(direction==='rise'?['急拉','封板']:['急跌','开板']).includes(e.kind))),stamp=(s:string)=>s?new Date(s).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未记录';
 return <><div className="monitor-filters"><label>异动日期<input type="date" aria-label="异动记录日期" value={date} max={day} onChange={e=>setDate(e.target.value)}/></label><label>事件类型<select aria-label="异动事件类型" value={kind} onChange={e=>setKind(e.target.value)}><option value="">全部事件</option>{['急拉','急跌','封板','开板'].map(k=><option key={k}>{k}</option>)}</select></label><button onClick={()=>q.refetch()} disabled={!date||q.isFetching}>检查新事件</button></div>
 {q.error&&<p role="alert" className="local-error">异动档案读取失败，已加载内容保留。<button onClick={()=>q.refetch()}>重试档案</button></p>}
 {first?.coverage?<p className="provenance">该日已存 {first.total} 条匹配记录 · 采样开始 {stamp(first.coverage.startedAt)} · 最近 {stamp(first.coverage.lastAt)} · 检测到 {first.coverage.gaps} 处采样间隔。{first.coverage.fullDay?'已覆盖连续竞价首尾，仍为分钟采样而非逐笔。':'该日留存不完整，不补造上线前或缺失时段。'}{first.coverage.legacyImport?'已补入上线时仍存留的旧窗口事件。':''}</p>:<p className="provenance">{!date?'业务日期尚未取得，请先重试市场资料。':q.isFetching&&q.isPending?'正在核对该日档案；下方如有内容仅为最近快照。':q.error?'档案状态暂不可核验，不判断是否发生异动。':'该日尚无可核验的持续采样档案；不代表没有异动。'}{fallback.length?'暂显示最近快照窗口，非全日记录。':''}</p>}
 <LocalRefresh label="全日异动档案" busy={q.isFetching&&!q.isFetchingNextPage&&rows.length>0}>{q.isPending&&q.isFetching&&!rows.length?<Skeleton label="全日异动档案"/>:(!!date&&!q.error||rows.length>0)&&<LiveEventStream key={date+'|'+code+'|'+kind+'|'+direction+'|'+archive} events={rows} onSelect={onSelect} historical={date!==new Date(Date.now()+8*3600000).toISOString().slice(0,10)} remote={archive} hasMore={!!q.hasNextPage} fetching={q.isFetchingNextPage} onLoadMore={()=>q.fetchNextPage()}/>}</LocalRefresh>
 </>;
}
