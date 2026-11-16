import StockLink from './StockLink';
import './relay-events.css';
import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {useVirtualizer} from '@tanstack/react-virtual';
import {number,pct,tone} from './api';
import EventBoardContext,{EventBoardContextFeed} from './EventBoardContext';
const key=(a:any)=>[a.code,a.time,a.kind].join('|');
function unique(events:any[],remote=false){const seen=new Set<string>(),rows=events.filter(a=>{const id=key(a);if(seen.has(id))return false;seen.add(id);return true;});if(!remote)rows.sort((a,b)=>String(b.time||'').localeCompare(String(a.time||'')));return rows.slice(0,remote?Infinity:300);}
export default function LiveEventStream({events,onSelect,historical=false,remote=false,hasMore=false,fetching=false,onLoadMore,boardContextDay}:{events:any[],onSelect:(event:any)=>void,historical?:boolean,remote?:boolean,hasMore?:boolean,fetching?:boolean,onLoadMore?:()=>unknown,boardContextDay?:string}){
 const incoming=useMemo(()=>unique(events,remote),[events,remote]),[rows,setRows]=useState(incoming),[limit,setLimit]=useState(18),[loading,setLoading]=useState(false),[selected,setSelected]=useState('');
 const host=useRef<HTMLDivElement>(null),atTop=useRef(true),timer=useRef<ReturnType<typeof setTimeout>|null>(null),busy=useRef(false),heights=useRef(new Map<string,number>());
 const count=Math.min(limit,rows.length),virtualized=count>50;
 const virtual=useVirtualizer({count,getScrollElement:()=>host.current,estimateSize:i=>heights.current.get(key(rows[i]))||108,getItemKey:i=>key(rows[i]),overscan:4,enabled:virtualized,initialRect:{width:320,height:620},initialOffset:()=>host.current?.scrollTop||0,useFlushSync:false});
 useLayoutEffect(()=>{if(virtualized)return;const elements=host.current?.querySelectorAll<HTMLElement>('[data-event-id]');const measure=(el:HTMLElement)=>{const h=el.getBoundingClientRect().height;if(h>0)heights.current.set(el.dataset.eventId!,h);};elements?.forEach(measure);if(typeof ResizeObserver==='undefined')return;const observer=new ResizeObserver(entries=>entries.forEach(e=>measure(e.target as HTMLElement)));elements?.forEach(el=>observer.observe(el));return()=>observer.disconnect();},[rows,count,virtualized]);
 useEffect(()=>{if(!rows.length||atTop.current)setRows(incoming);else if(remote){const known=new Set(rows.map(key)),last=rows.at(-1)?.time,older=incoming.filter(e=>!known.has(key(e))&&e.time<=last);if(older.length)setRows(old=>[...old,...older]);}},[incoming]);
 useEffect(()=>()=>{if(timer.current!==null)clearTimeout(timer.current);},[]);
 const existing=new Set(rows.map(key)),pending=incoming.filter(a=>!existing.has(key(a))).length;
 function more(){if(busy.current||fetching)return;if(count>=rows.length){if(hasMore){setLimit(n=>n+18);onLoadMore?.();}return;}busy.current=true;setLoading(true);timer.current=setTimeout(()=>{setLimit(n=>Math.min(n+18,rows.length));setLoading(false);busy.current=false;timer.current=null;},0);}
 function latest(){if(timer.current!==null){clearTimeout(timer.current);timer.current=null;busy.current=false;setLoading(false);}setRows(incoming);setLimit(18);atTop.current=true;if(host.current)host.current.scrollTop=0;}
 const article=(a:any,index:number,style?:React.CSSProperties)=><article className="relay-event" role="listitem" data-selected={selected===key(a)} data-event-id={key(a)} data-index={index} ref={virtualized?virtual.measureElement:undefined} style={style} data-direction={tone(a.change_pct)} key={key(a)}><time>{/^\d{14}$/.test(a.time)?a.time.slice(8,10)+':'+a.time.slice(10,12)+':'+a.time.slice(12,14):a.time}</time><div className="relay-event-content"><h3><StockLink code={a.code} name={a.name}>{a.name||a.code} · {a.kind}</StockLink></h3><p>{Number.isFinite(a.span_sec)?a.span_sec+'秒':'采样窗口'}变动 <span className={'relay-event-change '+tone(a.change_pct)}>{pct(a.change_pct)}</span> · 触发价 {number(a.price)}</p><button className="text-button" aria-label={'查看'+(a.name||a.code)+a.kind+'触发依据'} onClick={()=>{setSelected(key(a));onSelect(a);}}>查看触发依据 ›</button></div>{boardContextDay&&<EventBoardContext code={a.code}/>}</article>;
 const items=virtual.getVirtualItems(),display=<>
  {pending>0&&<button className="relay-new-events" onClick={latest}>{pending}条新事件 · 点击查看最新</button>}
  <div ref={host} className="relay-event-list" role="region" aria-label="采样事件滚动区" tabIndex={0} onScroll={e=>{const el=e.currentTarget;atTop.current=el.scrollTop<24;if(el.scrollHeight-el.scrollTop-el.clientHeight<160)more();}}>
   <div role="list" aria-label="盘中采样事件" className="relay-event-items" style={virtualized?{height:virtual.getTotalSize(),position:'relative'}:undefined}>{virtualized?items.map(v=>article(rows[v.index],v.index,{position:'absolute',top:0,left:0,width:'100%',transform:`translateY(${v.start}px)`})):rows.slice(0,count).map((a,i)=>article(a,i))}</div>
   {rows.length>0?<div className="relay-event-more">{count<rows.length||hasMore?<button disabled={loading||fetching} onClick={more}>{loading||fetching?'正在读取更早记录…':'加载更早事件'}</button>:<p>{remote?'已到该日已存档记录末尾；是否完整请查看采样覆盖。':'已展示当前可用采样记录，不代表全日完整历史。'}</p>}<small aria-live="polite">已展开 {count} / {rows.length} 条{hasMore?'，还有历史分页':''}</small></div>:<p className="empty">{remote?'该日已存档范围暂无匹配事件；是否完整请查看采样覆盖。':historical?'历史收盘快照无法还原盘中事件。':'当前采样窗口暂无盘中事件。'}</p>}
  </div>
 </>;
 return boardContextDay?<EventBoardContextFeed key={boardContextDay} day={boardContextDay} codes={(virtualized?items.map(v=>rows[v.index]):rows.slice(0,count)).map(r=>r.code)}>{display}</EventBoardContextFeed>:display;
}
