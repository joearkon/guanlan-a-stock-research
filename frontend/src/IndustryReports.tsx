import {useQuery} from '@tanstack/react-query';
import {ArrowUpRight,RefreshCw} from 'lucide-react';
import {publicQuery} from './api';
import {Skeleton} from './components';
import {safeSource} from './urls';
import IndustryAccessNotice from './IndustryAccessNotice';
export default function IndustryReports({layer}:{layer?:string}){
 const query=useQuery({...publicQuery('/api/research/industry/reports?industry=semiconductors',60000),refetchInterval:300000});
 const rows=(query.data?.rows||[]).filter((r:any)=>!layer||r.layers?.includes(layer)).slice(0,20);
 return <section className="sw-section" aria-label="研报证据更新"><header><div><h2>研报证据更新</h2><small>目录、正文与分析状态分开；本页不会调用模型</small></div><button className="outline-button" disabled={query.isFetching||[401,403].includes((query.error as any)?.status)} onClick={()=>void query.refetch()}><RefreshCw size={14}/>重新读取</button></header>
 {query.isError&&<IndustryAccessNotice error={query.error} kind="reports"><p role="alert">共享研报目录读取失败，已有条目保持原日期。重新读取仅查缓存，不重新抓取全市场。</p></IndustryAccessNotice>}
 {query.isPending&&query.isFetching?<Skeleton label="共享研报目录"/>:rows.length?<div className="sw-report-list">{rows.map((r:any)=><article key={r.id}><div><span className="sw-tag">仅目录，正文未提取</span><small>{r.org||'机构未提供'} · 发布 {r.date}</small></div>{safeSource(r.url)?<a href={safeSource(r.url)!} target="_blank" rel="noopener noreferrer">{r.title}<ArrowUpRight size={14}/></a>:<p>{r.title}</p>}<small>标题关键词关联，仅供检索；不作为受益、景气或KPI数值证据。</small></article>)}</div>:!query.isError?<p>{query.data?.status==='pending'?'后台尚未完成首次目录同步。':'当前采集范围内没有匹配此环节的条目，不代表没有相关研报。'}</p>:null}
 <details className="sw-data-gap"><summary>同步范围与证据边界</summary><p>此处是旧版共享目录，设计窗口为北京时间10:00和18:00，每轮至多两次来源请求；不是全量研报库。按来源ID去重，失败保留旧条目。</p><p>正文取证、引用页码和版本化研判在上方“研报增量研究”独立展示；这里的目录条目未取得正文就不作为事实证据。增量研判不改写原底稿、原KPI及个人研究。</p></details>
 </section>;
}
