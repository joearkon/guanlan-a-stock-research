import type {ReactNode} from 'react';
import {BookOpen} from 'lucide-react';
import SectionNav from './SectionNav';

type Chapter={id:string,title:string,label:string,answer:string,counter?:string,evidenceIds:string[]};
export default function IndustryReportReader({summary,chapters,renderEvidence}:{summary:string,chapters:Chapter[],renderEvidence:(ids:string[])=>ReactNode}){
 const items:[string,string][]=[['cleanroom-report-summary','研究摘要'],...chapters.map(c=>[c.id,c.label] as [string,string])];
 return <div className="cr-report-reader">
  <div className="cr-report-paper">
   <article id="cleanroom-report-summary" aria-labelledby="cleanroom-report-summary-title" className="cr-report-summary cr-gradient">
    <span className="cr-tag"><BookOpen size={14}/>保存的产业研究</span>
    <h2 id="cleanroom-report-summary-title">研究摘要</h2><p>{summary}</p>
   </article>
   {chapters.map(c=><article key={c.id} id={c.id} aria-labelledby={c.id+'-title'} className="cr-reader-chapter">
    <h2 id={c.id+'-title'}>{c.title}</h2><p className="cr-reader-answer">{c.answer}</p>
    <div className="cr-reader-sources"><span>证据来源</span>{renderEvidence(c.evidenceIds)}</div>
    {c.counter&&<details className="cr-reader-boundary"><summary>反证与研究边界</summary><p>{c.counter}</p></details>}
   </article>)}
  </div>
  <aside className="cr-report-contents"><SectionNav items={items} label="产业报告章节" variant="rail"/></aside>
 </div>;
}
