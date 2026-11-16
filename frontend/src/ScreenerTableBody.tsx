import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {useWindowVirtualizer} from '@tanstack/react-virtual';
// Natural page scrolling, bounded DOM after 50 rows, no nested vertical scrollport.
export default function ScreenerTableBody({rows,mobile,columns,renderCells}:{rows:any[];mobile:boolean;columns:number;renderCells:(row:any)=>ReactNode}){
 const host=useRef<HTMLTableSectionElement>(null),heights=useRef(new Map<string,number>()),[margin,setMargin]=useState(0),windowed=mobile&&rows.length>50;
 const virtual=useWindowVirtualizer({count:rows.length,enabled:windowed,estimateSize:i=>heights.current.get(rows[i].code)||64,getItemKey:i=>rows[i].code,scrollMargin:margin,overscan:5,useFlushSync:false});
 useLayoutEffect(()=>{
  const measure=()=>{if(host.current)setMargin(host.current.getBoundingClientRect().top+window.scrollY);if(!windowed)host.current?.querySelectorAll<HTMLElement>('tr[data-code]').forEach(e=>{const h=e.getBoundingClientRect().height;if(h>0)heights.current.set(e.dataset.code!,h);});};measure();window.addEventListener('resize',measure);
  if(typeof ResizeObserver==='undefined')return()=>window.removeEventListener('resize',measure);const observer=new ResizeObserver(measure);if(host.current?.closest('.widget'))observer.observe(host.current.closest('.widget')!);return()=>{observer.disconnect();window.removeEventListener('resize',measure);};
 },[rows,windowed]);
 const items=virtual.getVirtualItems(),top=windowed?Math.max(0,(items[0]?.start??margin)-margin):0,bottom=windowed?Math.max(0,virtual.getTotalSize()-((items.at(-1)?.end??margin)-margin)):0;
 const spacer=(height:number,key:string)=>height>0&&<tr key={key} aria-hidden="true"><td colSpan={columns} style={{height,padding:0,border:0}}/></tr>;
 return <tbody ref={host}>{spacer(top,'top')}{windowed?items.map(v=><tr key={v.key} data-code={rows[v.index].code} data-index={v.index} ref={virtual.measureElement}>{renderCells(rows[v.index])}</tr>):rows.map(r=><tr key={r.code} data-code={r.code}>{renderCells(r)}</tr>)}{spacer(bottom,'bottom')}</tbody>;
}
