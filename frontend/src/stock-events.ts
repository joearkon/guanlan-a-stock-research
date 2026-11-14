import {validDate} from './portfolio-data';
const kinds=new Set(['announcement','news','earn','holder','buyback','survey']);
export function stockEvents(rows:any[],kind:string,search:string){
 const query=search.trim().toLocaleLowerCase();
 return rows.filter(e=>kinds.has(e.kind)&&validDate(e.dataDate)&&(kind==='all'||e.kind===kind)&&(query===''||[e.title,e.summary,e.source].join(' ').toLocaleLowerCase().includes(query))).slice().sort((a,b)=>b.dataDate.localeCompare(a.dataDate)||String(b.publishedAt||'').localeCompare(String(a.publishedAt||'')));
}
