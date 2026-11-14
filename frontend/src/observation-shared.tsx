import {AiIcon} from './AiAction';
import {sessionStore} from './session-store';
import {useEffect,useRef,type ReactNode} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useSearchParams,Link} from 'react-router-dom';
import {publicQuery,number} from './api';
import {RefreshButton} from './components';
import {useMarketReadInterval} from './market-polling';
import {useAsk} from './AskContext';
export function useObservation(view=''){
 const [params,setParams]=useSearchParams(),client=useQueryClient(),date=params.get('date')||'',resource='/api/v2/review'+(view?'?view='+view:'')+(date?(view?'&':'?')+'date='+encodeURIComponent(date):''),lastKey=useRef(resource),publication=useRef('');
 const query=useQuery({...publicQuery(resource,300000),placeholderData:p=>p});if(query.data&&!query.isPlaceholderData)lastKey.current=resource;
 const data=query.data||client.getQueryData<any>(['resource',lastKey.current]);
 const manifestInterval=useMarketReadInterval(90000,undefined,date),manifest=useQuery({...publicQuery('/api/data/manifest',60000),enabled:!date,refetchInterval:manifestInterval});
 useEffect(()=>{if(date||!data||!manifest.data)return;const key=[manifest.data.asof,manifest.data.generated_at||''].join('|'),old=publication.current;publication.current=key;if(key!==old&&(manifest.data.asof>data.latest||old))void query.refetch();},[date,manifest.data,data?.latest]);
 const change=(key:string,value:string)=>setParams(old=>{const p=new URLSearchParams(old);if(value)p.set(key,value);else p.delete(key);return p;});
 return {query,data,params,change};
}
export function ObservationHeading({title,state,embedded=false}:{title:string,state:ReturnType<typeof useObservation>,embedded?:boolean}){
 const {data,query,change,params}=state,selected=params.get('date')||data?.asof||'',dates=[...new Set<string>([...(data?.available||[]),...(selected?[selected]:[])])].sort(),index=dates.indexOf(selected);
 return <><div className="page-heading">{embedded?<h2>{title}</h2>:<h1>{title}</h1>}<div className="observation-date"><button aria-label="上一存档日" className="outline-button" disabled={index<=0||query.isFetching} onClick={()=>change('date',dates[index-1])}>‹</button><select aria-label="业务日期" value={selected} disabled={!data} onChange={e=>change('date',e.target.value)}>{dates.map(d=><option key={d} value={d}>{d}</option>)}</select><button aria-label="下一存档日" className="outline-button" disabled={index<0||index>=dates.length-1||query.isFetching} onClick={()=>change('date',dates[index+1])}>›</button></div><span className="muted">历史资料 · 各项保留来源日期</span><RefreshButton busy={query.isFetching} onClick={()=>query.refetch()}/></div>{query.error&&<p className="local-error" role="status">{query.error.message} {data?'仍展示 '+data.asof+' 的资料，不冒充新日期。':''}<button onClick={()=>query.refetch()}>重试{title}</button></p>}</>;
}
export function ObservationTable({headers,rows,columnWidths}:{headers:string[],rows:ReactNode[][],columnWidths?:number[]}){return <div className="quote-scroll"><table className="data-table" style={columnWidths?{minWidth:columnWidths.reduce((a,b)=>a+b,0),tableLayout:'fixed'}:undefined}>{columnWidths&&<colgroup>{columnWidths.map((w,i)=><col key={i} style={{width:w}}/>)}</colgroup>}<thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c??'—'}</td>)}</tr>)}</tbody></table>{!rows.length&&<p className="empty">此范围没有已收录记录，不代表市场没有相关事件。</p>}</div>;}
export const covered=(value:any,unit='')=>value==null?'未覆盖':number(value,Number.isInteger(value)?0:2)+unit;
export function beijingStamp(value:any){if(!value)return '未提供抓取时间';if(!/(Z|[+-]\d{2}:\d{2})$/i.test(value))return '抓取时间时区未核验';const ms=Date.parse(value);return Number.isFinite(ms)?new Date(ms+8*3600000).toISOString().slice(0,16).replace('T',' ')+' 北京时间':'时间格式待核验';}
export function HandoffLink({question,page,section,asof,returnTo,children,stock}:{question:string,page:string,section?:string,asof:string,returnTo:string,children:ReactNode,stock?:{code:string,name:string}}){const ask=useAsk(),payload={question,context:{page,section:section||page,asof,...(stock?{stock}:{})},returnTo};return <Link className="outline-button ai-action ai-action-prepare" title="打开带上下文的问观澜草稿，确认发送后才调用模型。" to="/agent" onClick={e=>{sessionStore.setItem('guanlan.agent.handoff',JSON.stringify(payload));if(ask){e.preventDefault();ask(payload);}}}><AiIcon/>{children}</Link>;}
