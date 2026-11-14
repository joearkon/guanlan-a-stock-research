import {lazy,Suspense,useLayoutEffect,useState} from 'react';
import {Link,useLocation,useSearchParams} from 'react-router-dom';
import {ArrowLeft,ArrowUpRight,ChevronRight,BookOpen,Workflow} from 'lucide-react';
import {semiconductorLayers,taxonomySource,processSource} from './semiconductor-directory';
import {semiconductorLayerPath} from './semiconductor-companies';
import SemiconductorNavigation from './SemiconductorNavigation';
import {useSemiconductorBoard,MetricCards,BoardChanges,CompanyResults,LayerResearchFacts,ProcessResearchFacts,layerIcons} from './SemiconductorBoard';
import IndustryReports from './IndustryReports';
import IndustryAccessNotice from './IndustryAccessNotice';
import './semiconductor-workspace.css';
const SemiconductorMap=lazy(()=>import('./SemiconductorMap'));
const root='/industry/semiconductors';
export default function SemiconductorDirectory(){
 const location=useLocation(),[params]=useSearchParams(),[filter,setFilter]=useState('');
 const {board,financials,reports}=useSemiconductorBoard();
 useLayoutEffect(()=>{if(window.scrollY>0)window.scrollTo(0,0);},[location.pathname]);
 const parts=location.pathname.slice(root.length).split('/').filter(Boolean),layer=board.layers.find(l=>l.id===(parts[0]==='equipment'?'equipment':parts[1])),child=layer?.processes.find(c=>c.id===parts[2]);
 const unknown=parts.length>0&&(!layer||parts.length>2&&!child),fundamentals=!layer&&params.get('section')==='fundamentals';
 const title=unknown?'该产业节点尚未收录':child?child.name:layer?layer.name+'层':fundamentals?'半导体产业基本面':'半导体研究看板';
 return <div className="sw-workspace"><nav className="sw-breadcrumb" aria-label="产业研究路径"><Link to="/industry">产业总览</Link><ChevronRight size={12}/><Link to={root}>半导体</Link>{layer&&<><ChevronRight size={12}/><Link to={semiconductorLayerPath(layer.id)}>{layer.name}</Link></>}{child&&<><ChevronRight size={12}/><span>{child.name}</span></>}</nav><header className="sw-heading"><div><h1>{title}</h1><p>{child?child.description:layer?.description||'看产业组成，跟踪真实披露，再核对公司经营。'}</p></div><Link className="outline-button" to={root+'?view=study&node='+(layer?.id==='manufacturing'?'manufacturing':layer?.id||'equipment')+'&step=sources'}><BookOpen size={16}/>分步研究</Link></header>
 <SemiconductorNavigation layerId={layer?.id} childId={child?.id}/>
 {layer&&<Link className="sw-back" to={child?semiconductorLayerPath(layer.id):root}><ArrowLeft size={15}/>{child?'返回'+layer.name:'返回半导体总览'}</Link>}
 {unknown?<section className="sw-section"><p>不把未知节点映射成其他环节。请从产业目录重新进入。</p></section>:<>
 <BoardChanges layer={layer} board={board}/>
 {(financials.isError||reports.isError)&&<IndustryAccessNotice error={financials.error||reports.error}><p role="alert" className="local-error">部分共享资料读取失败，保留已取得披露和原日期。<button onClick={()=>{void financials.refetch();void reports.refetch();}}>重新读取共享资料</button></p></IndustryAccessNotice>}
 {child?<><ProcessResearchFacts layer={layer} process={child}/><a className="sw-source" href={layer?.id==='equipment'?processSource:taxonomySource} target="_blank" rel="noopener noreferrer">资料来源 · {layer?.id==='equipment'?'ASML制造流程':'OECD产业价值链'}<ArrowUpRight size={14}/></a></>:layer?<LayerResearchFacts layer={layer}/>:fundamentals?<>
 <section className="sw-section"><header><h2>行业已披露数据</h2><span>历史统计、预测与公司经营分开</span></header><MetricCards items={board.industryFacts}/><p className="sw-footnote">公开统计快照，不是当前景气裁决；不能据此推断国内各工艺或公司同步增长。</p></section>
 <section className="sw-section"><header><h2>产业链投研总览</h2><span>分层查看关键指标、传导证据与关联公司</span></header><div className="sb-overview-grid">{board.layers.map(l=>{const Icon=layerIcons[l.id];return <article key={l.id}><Link className="sb-layer-title" to={semiconductorLayerPath(l.id)}><Icon size={22}/><h3>{l.name}</h3><ChevronRight size={15}/></Link><p>{l.evidence?.headline||l.description}</p><small>需求及实际投入 → 机型或产品认证 → 交付与验收 → 利润现金</small><div className="sb-layer-note">{l.kpis.length} 条有源指标 · {l.companies.filter(c=>c.income).length} 家经营快照</div><Link className="sw-source" to={semiconductorLayerPath(l.id)}>看本层证据<ChevronRight size={14}/></Link></article>;})}</div><details className="sw-data-gap"><summary>景气与传导结论的缺口</summary><p>尚未建立需求、价格、订单、库存、产能利用率的连续同口径序列；不自动判“景气中段”“逻辑有效”或“受益确定”。科技约束与国产替代需分工艺举证，不用一个国产化率概括全行业。</p></details></section>
 <CompanyResults companies={board.layers.flatMap(l=>l.companies)}/>
 </>:<>
 <section className="sw-section"><header><h2>行业公开披露</h2><span>有来源的统计，不是景气分数</span></header><MetricCards items={board.industryFacts}/><p className="sw-footnote">以上是各自报告期的行业数据；自动同步与研究裁决分别管理。</p></section>
 <section className="sw-section"><header><div><h2>半导体产业组成 · 八层研究</h2><small>8个研究层级 · {semiconductorLayers.reduce((n,l)=>n+l.children.length,0)}个主要细分 · {board.reportCount}条已收研报目录（非已分析篇数）</small></div><label className="sw-directory-filter">筛选<input aria-label="查找产业子项" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="如清洗、SiC、存储"/></label></header><div className="sb-overview-grid">{board.layers.filter(l=>[l.name,...l.children.flat()].join(' ').toLowerCase().includes(filter.trim().toLowerCase())).map(l=>{const Icon=layerIcons[l.id];return <article key={l.id}><Link className="sb-layer-title" aria-label={'打开'+l.name+'目录'} to={semiconductorLayerPath(l.id)}><Icon size={22}/><h3>{l.name}</h3><ChevronRight size={15}/></Link><p>{l.evidence?.headline||l.description}</p><small>{l.children.map(c=>c[1]).join(' / ')}</small><div className="sb-layer-note">{l.reports.length}条研报目录 · {l.companies.filter(c=>c.income).length}/{l.companies.length}家已有经营快照</div><Link className="sw-source" aria-label={'进入'+l.name+'层'} to={semiconductorLayerPath(l.id)}>看指标、传导与公司<ChevronRight size={15}/></Link></article>;})}</div></section>
 <Suspense fallback={<section className="sw-section" role="status">正在准备产业地图…</section>}><SemiconductorMap layers={board.layers}/></Suspense>
 </>}
 <IndustryReports layer={layer?.id}/>
 </>}
 </div>;
}
