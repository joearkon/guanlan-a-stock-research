import {useState} from 'react';
import {useLocation,useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {Bot,History,ChevronRight,FileText,RefreshCw,LoaderCircle,ArrowLeft} from 'lucide-react';
import {Drawer,Skeleton} from './components';
import {publicQuery} from './api';
import {safeSource} from './urls';
import IndustryAccessNotice from './IndustryAccessNotice';
import './industry-automation.css';
const stamp=(v:any)=>v?new Date(v).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'尚无记录';
const labels:Record<string,string>={published:'已发布',unchanged:'正文未变',failed:'本轮更新失败',uncertain:'模型回执待核对',needs_body:'正文尚未完整取得',budget_wait:'等待平台预算',no_new_reports:'本轮未检出相关新研报',interrupted:'待断点恢复'};
const endpoint=(industry:string,node:string,tail='')=>'/api/research/industry/automation?industry='+encodeURIComponent(industry)+'&node='+encodeURIComponent(node)+tail;
export default function IndustryAutomation({industryId,nodeId='all'}:{industryId:string;nodeId?:string}){
 const query=useQuery({...publicQuery(endpoint(industryId,nodeId),300000),retry:false,refetchOnWindowFocus:false}),q={...query,isError:query.isError&&!query.data},[updatesOpen,setUpdatesOpen]=useState(false),[selected,setSelected]=useState<any>(null),[history,setHistory]=useState(false),[oldVersion,setOldVersion]=useState('');
 const h=useQuery({...publicQuery(endpoint(industryId,selected?.topic.nodeId||nodeId,'&history=1'),300000),enabled:!!selected&&history,retry:false});
 const prior=useQuery({...publicQuery(endpoint(industryId,selected?.topic.nodeId||nodeId,'&version='+encodeURIComponent(oldVersion)),300000),enabled:!!selected&&!!oldVersion,retry:false});
 const items=q.data?.items||[],current=oldVersion?prior.data?.items?.[0]?.version:selected?.version;
 const choose=(item:any)=>{setSelected(item);setHistory(false);setOldVersion('');};
 const published=items.filter((item:any)=>item.version),attention=query.isError||items.some((item:any)=>['failed','uncertain','needs_body','interrupted'].includes(item.status?.status)||item.status?.bodyFailures?.length);
 return <section className="industry-auto-compact" aria-label="后台研报增量更新"><button type="button" className="industry-auto-trigger" aria-label="查看研报更新" aria-haspopup="dialog" onClick={()=>setUpdatesOpen(true)}><Bot size={16}/><span>研报更新</span>{query.isFetching?<LoaderCircle size={14} className="spin" aria-label="读取更新中"/>:<small>{q.isError?'暂不可用':published.length?published.length+' 份已发布':'暂无新研判'}</small>}{attention&&<i className="industry-auto-attention" title="有更新状态或证据范围需要核对" aria-label="更新状态待核对"/>}<ChevronRight size={14}/></button>
 <Drawer open={updatesOpen} onOpenChange={v=>{setUpdatesOpen(v);if(!v){setSelected(null);setHistory(false);setOldVersion('');}}} title={selected?selected.topic.name+' · 研报增量研究':'研报更新'} className="industry-auto-drawer">
 {!selected&&<><header className="industry-auto-overview"><div><span className="industry-auto-label"><Bot size={16}/>研报增量研究</span><p>后台取证与研判，校验通过后发布；这里重新读取不会抓取研报或调用模型。</p></div><button type="button" className="outline-button" aria-label="重新读取已发布研判" disabled={q.isFetching} onClick={()=>q.refetch()}><RefreshCw size={14}/>读取更新</button></header>
 {q.isPending?<Skeleton label="已发布研报更新"/>:q.isError?<IndustryAccessNotice error={q.error} kind="updates"><p role="alert">更新状态读取失败，已显示底稿及原日期保留。</p></IndustryAccessNotice>:<details className="industry-auto-topics" open><summary>已发布 {items.filter((item:any)=>item.version).length} / {items.length} 个环节 · 展开版本与更新摘要</summary><div className="industry-auto-items">{items.map((item:any)=><article key={item.topic.id}><div><strong>{item.topic.name}</strong><span>{labels[item.status?.status]||'等待首次后台检查'}</span></div>{item.version?<><p>{item.version.result.summary}</p><small>{item.version.versionId} · 发布 {stamp(item.version.updatedAt)} · 来源截止 {item.version.sourceAsOf}</small>{['failed','uncertain','needs_body','interrupted','budget_wait'].includes(item.status?.status)&&<p className="industry-auto-warning">更新未完成，保留上一份已发布报告与原日期。</p>}<button className="outline-button" aria-label={'阅读'+item.topic.name+'增量报告'} onClick={()=>choose(item)}>阅读增量报告<ChevronRight size={15}/></button></>:<p>尚无可发布的正文研判；原研究底稿保持不变，不根据标题补造结论。</p>}<small>最近检查 {stamp(item.status?.checkedAt)}</small></article>)}</div></details>}
 {query.isError&&query.data&&<p role="alert" className="industry-auto-warning">重新读取失败，保留上次已加载报告与原日期。</p>}
 {items.filter((item:any)=>item.version&&item.status?.bodyFailures?.length).map((item:any)=><p className="industry-auto-warning" key={item.topic.id}>{item.topic.name}：本轮部分研报解析未通过，仅发布独立核验成功的来源；未通过资料不参与研判。</p>)}
 {items.filter((item:any)=>item.status?.companyCoverage).map((item:any)=><p className="cr-caption" key={'coverage-'+item.topic.id}>{item.topic.name} · 本轮轮转公司 {item.status.companyCoverage.code} · 目录池 {item.status.companyCoverage.total} 家 · {item.status.companyCoverage.status==='ok'?'目录已取得':'目录未成功，本次不推进公司轮转'}。目录取得不等于该公司已有新研报或完成价值报告。</p>)}
 <details><summary>更新频率与研究范围</summary><p>{q.data?.policy?.schedule||'低频后台分批取证。'} 每日模型调用有平台总额与本管道独立上限；相同正文复用原结果。未知模型回执不会自动重跑。平台任务使用普通研判，个人追问仍按发送页深度思考选择。</p><p>仅解析本轮有界研报的前至多四页节选，不是全研报库；券商预测与公司已实现财报分开。增量报告有独立版本，不无声改写旧底稿、旧KPI或个人研究。</p></details>
 </>}
  {selected&&<div className="industry-auto-report"><div className="industry-auto-actions"><button type="button" className="outline-button" onClick={()=>{setSelected(null);setHistory(false);setOldVersion('');}}><ArrowLeft size={15}/>返回更新列表</button><button className="outline-button" onClick={()=>{setHistory(!history);setOldVersion('');}}><History size={15}/>版本历史</button>{oldVersion&&<button className="outline-button" onClick={()=>setOldVersion('')}>返回当前版本</button>}</div>
  {history&&<section aria-label="研判版本历史">{h.isPending?<Skeleton label="研判版本历史"/>:h.isError?<p role="alert">历史读取失败，当前报告保留。</p>:(h.data?.items?.[0]?.versions||[]).map((v:any)=><button className="outline-button" key={v.versionId} onClick={()=>setOldVersion(v.versionId)}>{v.versionId} · {stamp(v.updatedAt)}</button>)}</section>}
  {!!oldVersion&&prior.isFetching&&<Skeleton label="历史研判"/>}{prior.isError&&oldVersion&&<p role="alert">该历史版本读取失败，未以当前版本代替。</p>}
  {current&&<><p className="provenance">{current.versionId} · 发布 {stamp(current.updatedAt)} · 资料截止 {current.sourceAsOf} · {current.deepThinking?'深度思考':'普通研判'}</p><h3>本轮研究摘要</h3><p>{current.result.summary}</p><h3>原文事实与机构观点</h3>{current.result.facts.map((f:any,i:number)=><article className="industry-auto-fact" key={i}><span>{f.kind==='forecast'?'机构预测':f.kind==='company'?'公司相关研报':'行业相关研报'}{f.companyCode?' · '+f.companyCode:''}</span><blockquote>{f.quote}</blockquote><small>依据 {f.evidenceId}</small></article>)}{current.result.analysis.map((a:any,i:number)=><section className="industry-auto-analysis" key={i}><h3>{a.title}</h3><p>{a.text}</p><small>研究解释 · 依据 {a.evidenceIds.join('、')}</small></section>)}<details open><summary>来源与证据范围</summary>{current.sources.map((s:any)=><article className="industry-auto-source" key={s.id}><strong><FileText size={14}/>{s.title}</strong><p>{s.org} · <time>{s.date}</time> · PDF第 {s.pages.join('、')} 页节选</p><small>{s.id}</small>{safeSource(s.pdfUrl||s.url)&&<a className="outline-button" href={safeSource(s.pdfUrl||s.url)!} target="_blank" rel="noopener noreferrer">核对研报原文</a>}</article>)}</details></>}
  </div>}
 </Drawer></section>;
}
export function IndustryAutomationRoute(){
 const {pathname}=useLocation(),[params]=useSearchParams();let industryId='',nodeId='all';
 if(pathname.startsWith('/industry/ai-compute')){industryId='ai-compute';nodeId=pathname.includes('/liquid-cooling')?'liquid-cooling':params.get('stage')||'all';}
 else if(pathname.startsWith('/industry/semiconductors')){industryId='semiconductors';nodeId=pathname.match(/\/layers\/([^/]+)/)?.[1]||(/equipment|advanced-process/.test(pathname)?'equipment':'all');}
 else if(pathname.startsWith('/industry/media')){industryId='media';nodeId='film-ai';}
 else if(pathname.startsWith('/industry/gaming')){industryId='gaming';nodeId='games';}
 else if(pathname.startsWith('/industry/robotics')){industryId='robotics';nodeId='overview';}
 else if(pathname.startsWith('/industry/ai-applications')){industryId='ai-applications';nodeId='overview';}
 return industryId?<IndustryAutomation key={industryId+nodeId} industryId={industryId} nodeId={nodeId}/>:null;
}
