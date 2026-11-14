import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Widget,RefreshButton} from './components';
import {getJSON,pct,tone} from './api';
import BoardDetailsDrawer,{boardSourceNames,type BoardTarget} from './BoardDetailsDrawer';
import './board-details.css';
export default function StockRelatedBoards({code,mode='live'}:{code:string;mode?:'close'|'live'}){
 const [board,setBoard]=useState<BoardTarget|null>(null),url='/api/data/stock-observation?'+new URLSearchParams({related:code,mode});
 const q=useQuery({queryKey:['resource',url],queryFn:({signal})=>getJSON(url,signal),retry:false,staleTime:60000,refetchOnWindowFocus:false}),d=q.data;
 return <><Widget title="相关板块" loading={q.isPending} refreshing={q.isFetching&&!q.isPending} error={q.error?'共享板块资料暂不可读，不影响个股报价与K线':undefined} retry={()=>q.refetch()} actions={<RefreshButton busy={q.isFetching} onClick={()=>q.refetch()} label="刷新板块"/>}>
  {d&&<><p className="provenance">{d.day} · {d.mode==='live'?'盘中快照':'盘后收盘'} · 板块统计与上方独立个股报价分别标时</p>{d.stale&&<p className="board-warning">板块快照已过期，仅表示原时点。</p>}<div className="stock-related-boards">{(d.related||[]).map((g:any)=><button type="button" key={g.provider+g.code} onClick={()=>setBoard({...g,mode:d.mode,model:d.model})} aria-label={'查看'+g.name+'板块详情'}><span><strong>{g.name}</strong><small>{boardSourceNames[g.provider]} · 覆盖 {g.covered??'—'} / {g.total??g.memberCount}</small></span><span><strong className={tone(g.median)}>{g.median==null?'涨幅未取得':pct(g.median)}</strong><small>成分股中位涨幅</small></span></button>)}</div>{!d.related?.length&&<p className="empty">本批共享目录未取得可核验关联，不代表该股没有行业或概念。</p>}<details><summary>关联与统计口径</summary><p>{d.note||'行业归属与概念关联分开。成分股中位涨幅不是板块指数，不证明业务受益。'}</p></details></>}
 </Widget><BoardDetailsDrawer board={board} onClose={()=>setBoard(null)}/></>;
}
