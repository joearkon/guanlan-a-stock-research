import type{ReactNode}from'react';
import SmartTable from'./SmartTable';
import{useMobileLayout}from'./personal-preferences';
import'./stock-list-table.css';
function useWidths(tailWidths:number[]){const mobile=useMobileLayout();return[mobile?112:160,mobile?68:88,mobile?72:88,...tailWidths];}
export default function StockListTable({headers,rows,tailWidths}:{headers:string[];rows:ReactNode[][];tailWidths?:number[]}){const widths=useWidths(tailWidths||headers.slice(3).map(()=>136));return<div className="stock-list-table"><SmartTable headers={headers} rows={rows} columnWidths={widths}/></div>;}
export function StockDataTable({children,tailWidths,columnWidths,className='',scrollClassName=''}:{children:ReactNode;tailWidths:number[];columnWidths?:number[];className?:string;scrollClassName?:string}){const defaults=useWidths(tailWidths),widths=columnWidths||defaults;return<div className="stock-list-table"><div className={'quote-scroll '+scrollClassName}><table className={'data-table '+className} style={{minWidth:widths.reduce((a,b)=>a+b,0),tableLayout:'fixed'}}><colgroup>{widths.map((w,i)=><col key={i} style={{width:w}}/>)}</colgroup>{children}</table></div></div>;}
