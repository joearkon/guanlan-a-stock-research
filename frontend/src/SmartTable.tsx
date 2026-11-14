import {useRef,type ReactNode} from 'react';
import {useVirtualizer} from '@tanstack/react-virtual';
import {ObservationTable} from './observation-shared';
import './observations.css';
type Props={headers:string[],rows:ReactNode[][],columnTemplate?:string,minWidth?:number,columnWidths?:number[]};
function VirtualTable({headers,rows,columnTemplate,minWidth,columnWidths}:Props){
 const host=useRef<HTMLDivElement>(null),virtual=useVirtualizer({count:rows.length,getScrollElement:()=>host.current,estimateSize:()=>72,overscan:5,initialRect:{width:900,height:440},useFlushSync:false}),grid={gridTemplateColumns:columnWidths?.map(n=>n+'px').join(' ')||columnTemplate||`repeat(${headers.length},minmax(140px,1fr))`,minWidth:columnWidths?.reduce((a,b)=>a+b,0)??minWidth??Math.max(560,headers.length*150)};
 return <div ref={host} className="virtual-table" role="table" aria-label="观测记录（虚拟滚动）" aria-rowcount={rows.length+1} aria-colcount={headers.length} tabIndex={0}><div role="row" className="virtual-table-head" style={grid}>{headers.map((h,i)=><div role="columnheader" key={i}>{h}</div>)}</div><div role="rowgroup" style={{height:virtual.getTotalSize(),position:'relative',minWidth:grid.minWidth}}>{virtual.getVirtualItems().map(item=><div role="row" aria-rowindex={item.index+2} key={item.key} data-index={item.index} ref={virtual.measureElement} className="virtual-table-row" style={{...grid,position:'absolute',top:0,left:0,width:'100%',transform:`translateY(${item.start}px)`}}>{rows[item.index].map((cell,i)=><div role="cell" key={i}>{cell??'—'}</div>)}</div>)}</div></div>;
}
export default function SmartTable(props:Props){return props.rows.length>50?<VirtualTable {...props}/>:<ObservationTable {...props}/>;}
