import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {getJSON,pct,tone} from './api';
import BoardDetailsDrawer,{boardSourceNames,type BoardTarget} from './BoardDetailsDrawer';

const BoardContext=createContext<{data:any;pending:boolean;open:(board:any)=>void}|null>(null);
const shortStamp=(value:any)=>{const n=Date.parse(value);return Number.isFinite(n)?new Date(n+28800000).toISOString().slice(5,16).replace('T',' '):'采集时间未提供';};
export function EventBoardContextFeed({day,codes,children}:{day:string;codes:string[];children:ReactNode}){
 const client=useQueryClient(),[model,setModel]=useState(''),[revision,setRevision]=useState(0),[selected,setSelected]=useState<BoardTarget|null>(null),[drawerMounted,setDrawerMounted]=useState(false),last=useRef<any>(null),closeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const codeText=[...new Set(codes.filter(c=>/^\d{6}$/.test(c)))].sort().slice(0,50).join(','),key=(m:string,r=revision)=>['resource','event-board-context',day,codeText,m,r];
 const url='/api/data/event-context?'+new URLSearchParams({day,codes:codeText,...(model?{model}:{})});
 const q=useQuery({queryKey:key(model),queryFn:({signal})=>getJSON(url,signal),enabled:!!day&&!!codeText,staleTime:300000,retry:false,refetchOnWindowFocus:false,refetchOnReconnect:false});
 useEffect(()=>{if(!model&&q.data?.model){client.setQueryData(key(q.data.model),q.data);setModel(q.data.model);}},[q.data,model,client,day,codeText,revision]);
 useEffect(()=>()=>{if(closeTimer.current!==null)clearTimeout(closeTimer.current);},[]);
 if(q.data){const previous=last.current?.model===q.data.model?last.current.rows:{};const entries=Object.entries({...previous,...q.data.rows});last.current={...q.data,rows:Object.fromEntries(entries.slice(-400))};}
 const data=last.current;
 function open(board:any){if(!data)return;if(closeTimer.current!==null){clearTimeout(closeTimer.current);closeTimer.current=null;}setDrawerMounted(true);setSelected({provider:board.provider,code:board.code,name:board.name,mode:data.mode,model:data.model});}
 function close(){setSelected(null);if(closeTimer.current!==null)clearTimeout(closeTimer.current);closeTimer.current=setTimeout(()=>{setDrawerMounted(false);closeTimer.current=null;},250);}
 return <BoardContext.Provider value={{data,pending:q.isPending&&q.isFetching,open}}>
  <div className="event-context-toolbar"><span>当前目录归属 · 成分股中位涨幅（非板块指数）</span><button type="button" disabled={q.isFetching||!codeText} onClick={()=>{setModel('');setRevision(r=>r+1);}}>更新板块快照</button></div>
  {data&&<small className="event-board-time event-context-snapshot" role="note" aria-label="板块快照时间口径">{shortStamp(data.collectedAt)}{data.mode==='close'?' 收盘资料':' 采集'}{data.stale?' · 旧快照':''} · 非事件时点 · 适用于下方行业与板块</small>}
  {q.isFetching&&<p className="event-context-status" role="status">正在读取共享板块快照，原异动记录不变。</p>}
  {q.error&&<p className="event-context-error" role="status">{data?'更新失败，保留上次板块快照和原日期。':'板块资料读取失败，原异动记录保留。'}{(q.error as any).status===409?' 原快照已失效，请更新板块快照。':''}</p>}
  {children}
  {drawerMounted&&<BoardDetailsDrawer board={selected} onClose={close}/>}
 </BoardContext.Provider>;
}
export default function EventBoardContext({code}:{code:string}){
 const context=useContext(BoardContext);if(!context)return null;
 const {data,pending,open}=context,row=data?.rows?.[code];
 const missing=(board:any)=>board.quoteStatus==='date_mismatch'?'缺该日快照':board.quoteStatus==='time_missing'?'时间缺失':'覆盖不足';
 const boardLine=(board:any,label:string)=><div className="event-board-line" key={board.provider+':'+board.code}><span className="event-board-kind">{label}</span><button type="button" aria-label={'查看'+board.name+'板块详情'} onClick={()=>open(board)} title={(boardSourceNames[board.provider]||board.provider)+' · '+board.code+'；有效覆盖 '+(board.covered??'—')+'/'+board.memberCount+'；目录日期 '+(board.classificationDate||'未提供')}>{board.name}</button><span className={'event-board-pct '+tone(board.pct)}>{typeof board.pct==='number'&&Number.isFinite(board.pct)?pct(board.pct):'— '+missing(board)}</span></div>;
 return <aside className="event-board-context" aria-label="行业与板块上下文">
  {row?.industry?boardLine(row.industry,'行业'):<div className="event-board-missing">{pending&&!row?'正在核对行业／板块…':row?.industryStatus==='conflict'?'行业归属冲突':'行业归属未核验'}</div>}
  {row?.boards?.[0]?boardLine(row.boards[0],'板块'):!pending&&<div className="event-board-missing">板块归属未核验</div>}
  {row?.boards?.length>1&&<details className="event-board-more"><summary title={row.additionalBoards?`除以下已返回关联外，另有${row.additionalBoards}项未展开`:undefined}>更多关联{row.additionalBoards?` · 另${row.additionalBoards}项`:''}</summary>{row.boards.slice(1).map((b:any)=>boardLine(b,'板块'))}</details>}
 </aside>;
}
