import {useState,useLayoutEffect,type ReactNode} from 'react';
import {Link,useLocation,useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {motion} from 'motion/react';
import {ArrowLeft,ArrowUpRight,ChevronRight,Cpu,Factory,FlaskConical,Layers3,Settings2,FileCheck2,BookOpen,Package,Workflow} from 'lucide-react';
import {Drawer,Segmented,Skeleton} from './components';
import {publicQuery,pct} from './api';
import {bomBranches,type BomBranch,SEMI_BOM_VERSION} from './semiconductor-bom';
import {useUiReducedMotion} from './personal-preferences';
import {uiMotion} from './motion-tokens';
import {safeSource} from './urls';
import StockLink from './StockLink';
import './semiconductor-workspace.css';
import {childKpis,semiconductorChildPath} from './semiconductor-directory';
import IndustryReports from './IndustryReports';
import {semiconductorCompanies,semiconductorLayerPath} from './semiconductor-companies';
import SemiconductorNavigation from './SemiconductorNavigation';
import {useSemiconductorBoard,ProcessResearchFacts,BoardChanges} from './SemiconductorBoard';
import CompanyInsights from './CompanyInsights';
import './semiconductor-company-heading.css';

const root='/industry/semiconductors';
const checked='2026-10-30';
const companies=semiconductorCompanies.filter(c=>c.layer==='equipment');
const layers=[
 {id:'eda',name:'EDA / IP',icon:Cpu,description:'设计工具与可复用知识产权，支持芯片设计。'},
 {id:'design',name:'芯片设计',icon:Cpu,description:'把功能需求转为电路与版图，交由制造和封测。'},
 {id:'equipment',name:'半导体设备',icon:Settings2,description:'为制造与封测提供工艺、检测和量测装备。'},
 {id:'materials',name:'半导体材料',icon:FlaskConical,description:'硅片、电子气体、光刻胶等，随工艺与产线使用。'},
 {id:'manufacturing',name:'晶圆制造',icon:Factory,description:'在晶圆上形成电路结构，关注稼动率、良率与折旧。'},
 {id:'packaging',name:'封装测试',icon:Package,description:'完成芯片连接、保护与测试，区分具体封装路线。'},
 {id:'discrete',name:'功率与分立器件',icon:Layers3,description:'面向电源转换、控制等应用，按器件和材料分别研究。'},
 {id:'applications',name:'下游应用',icon:Workflow,description:'计算、通信、汽车、工业与消费需求形成不同周期。'},
];
const processInfo={
 etch:{title:'刻蚀设备',short:'刻蚀',summary:'有选择地移除材料，将图形转移到晶圆结构中。',kpi:'选择性、均匀性与深宽比',routes:'导体、介质与深硅等刻蚀应用分别核验；CCP、ICP 是不同等离子体路线，不代表相同工艺能力。',demand:'新增产线和结构复杂度变化可能增加特定刻蚀工序需求；须核对实际工艺步骤与设备配置。',counter:'工艺验证未完成、设备验收延后，或服务与回款没有随交付改善。',source:'https://www.naura.com/product/details_82_1588.html'},
 deposition:{title:'薄膜沉积设备',short:'薄膜沉积',summary:'在晶圆上形成导电或介电薄膜，为后续结构与连接提供基础。',kpi:'膜厚、均匀性与台阶覆盖',routes:'CVD、ALD、PVD 等路线分别对应材料和结构需求；不同工艺与应用不能共用一张成本表。',demand:'扩产、材料变化与新增薄膜工序可能带来需求；须区分产线计划、机型验证和实际采购。',counter:'材料或机型验证推迟、产线投入延后，或出货增加但验收与回款未兑现。',source:'https://www.naura.com/product/details_82_1586.html'},
};
const pillars=[['需求与订单','终端需求、客户采购与订单变化','需要行业序列及订单披露'],['资本开支','规划、实际投入与设备搬入','需要同口径资本开支序列'],['产能与库存','稼动率、库存及产线爬坡','需要同期产能利用率与库存'],['技术与替代','工艺适用范围与客户验证','需要分产品验证及替代口径']];
function Source({url,children}:{url:string;children:ReactNode}){const href=safeSource(url);return href?<a className="sw-source" href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={14}/></a>:null;}
function Fundamentals(){return <section className="sw-section" aria-labelledby="sw-fundamentals"><header><h2 id="sw-fundamentals">产业基本面全景</h2><span>产业投入不等于股票资金流</span></header><div className="sw-kpis">{pillars.map(([name,description,missing])=><article key={name}><h3>{name}</h3><strong>待核验</strong><p>{description}</p><small>{missing}</small></article>)}</div><p className="sw-footnote">当前未接入连续同口径行业指标，不判定景气阶段。公司财报与行业总量分开，不用股价涨跌替代产业判断。</p></section>;}
function CompanyLinks({branch}:{branch:BomBranch}){return <section className="sw-section" aria-label="关联公司"><header><h2>A股关联公司</h2><span>按产品业务关联纳入，非推荐排序</span></header><div className="sw-companies">{companies.filter(c=>c.processes.includes(branch)).map(c=><article key={c.code}><div><StockLink code={c.code} name={c.name}/><small>{c.code} · {c.role}</small></div><p>{c.basis}</p><span className="sw-tag">业务有依据 · 本轮受益待验证</span><Link aria-label={'研究'+c.name} to={`${root}/companies/${c.code}?from=${branch}`}>公司经营详情<ChevronRight size={16}/></Link></article>)}</div></section>;}

export default function SemiconductorWorkspace({renderFinancials}:{renderFinancials:(codes:string[])=>ReactNode}){
 const {board}=useSemiconductorBoard(),equipmentLayer=board.layers.find(l=>l.id==='equipment')!;
 const location=useLocation(),[params,setParams]=useSearchParams(),[research,setResearch]=useState(false),[part,setPart]=useState(''),[layer,setLayer]=useState(''),reduced=useUiReducedMotion();
 useLayoutEffect(()=>{if(window.scrollY>0)window.scrollTo(0,0);},[location.pathname]);
 const suffix=location.pathname.slice(root.length).replace(/\/$/,'');
 const companyMatch=suffix.match(/^\/companies\/([^/]+)$/),processMatch=suffix.match(/^\/equipment\/([^/]+)$/);
 const legacy=suffix==='/advanced-process';
 const branch:BomBranch=(processMatch?.[1]==='deposition'||legacy&&params.get('bom')==='deposition')?'deposition':'etch';
 const sourceLayer=board.layers.find(l=>l.id===params.get('fromLayer')&&l.companies.some(c=>c.code===companyMatch?.[1]))||board.layers.find(l=>l.companies.some(c=>c.code===companyMatch?.[1]));
 const process=!!processMatch||legacy,company=companyMatch?(sourceLayer?.processes.find(p=>p.id===params.get('from'))?.companies.find(c=>c.code===companyMatch[1])||sourceLayer?.companies.find(c=>c.code===companyMatch[1])):undefined;
 const equipment=suffix==='/equipment'||!suffix&&params.get('node')==='equipment';
 const invalid=!!companyMatch&&!company||!!processMatch&&!['etch','deposition'].includes(processMatch[1]);
 const from=sourceLayer?.processes.some(p=>p.id===params.get('from')&&p.companies.some(c=>c.code===company?.code))?params.get('from')!:company?.processes[0]||'etch';
 const fromInfo=sourceLayer?.processes.find(p=>p.id===from),contextLayer=sourceLayer||equipmentLayer;
 const info=processInfo[branch],data=bomBranches[branch],equipmentProcess=equipmentLayer.processes.find(p=>p.id===branch)!;
 const tab=params.get('tab')==='bom'?'bom':params.get('tab')==='evidence'?'evidence':'logic';
 const query=useQuery({...publicQuery('/api/research/industry/financials?industry=semiconductors',60000),enabled:!!company,refetchInterval:company?300000:false});
 const row=query.data?.companies?.find((r:any)=>r.code===company?.code),summary=row?.summary;
 const changeTab=(value:string)=>{const next=new URLSearchParams(params);next.set('tab',value);setPart('');setParams(next,{preventScrollReset:true});};
 const title=invalid?(companyMatch?'该公司尚未纳入研究':'该设备环节尚未开放'):company?company.name:process?info.title:equipment?'半导体设备层':'半导体研究看板';
 const studyNode=company?'equipment':process?'etch-film':equipment?'equipment':'manufacturing';
 const studyHref=`${root}${process?'/advanced-process':''}?view=study&node=${studyNode}&step=sources${process?'&bom='+branch:''}`;
 return <div className="sw-workspace">
  <nav className="sw-breadcrumb" aria-label="产业研究路径"><Link to="/industry">产业总览</Link><ChevronRight size={12}/><Link to={root}>半导体</Link>{(equipment||process||company)&&<><ChevronRight size={12}/><Link to={semiconductorLayerPath(contextLayer.id)}>{contextLayer.id==='equipment'?'设备层':contextLayer.name}</Link></>}{(process||company)&&<><ChevronRight size={12}/><span>{company?'公司研究':info.short}</span></>}</nav>
  <header className="sw-heading"><div><div className="sw-company-heading"><h1>{title}</h1>{company&&<StockLink code={company.code} name={company.name}>{company.code}</StockLink>}{company&&<Link className="outline-button" to={'/stock?code='+company.code+'&returnTo='+encodeURIComponent(location.pathname+location.search)}>个股档案</Link>}</div><p>{invalid?'保留研究范围，不把未知对象映射为其他公司或环节。':company?'沿产品业务关联，核对订单、经营兑现与价格预期。':process?info.summary:equipment?'从晶圆厂投入到工艺装备，再验证企业交付。':'先看产业组成与变化，再追踪环节和公司兑现。'}</p></div><button className="outline-button" onClick={()=>setResearch(true)}><BookOpen size={16}/>分步研究</button></header>
  <SemiconductorNavigation layerId={company?contextLayer.id:"equipment"} childId={process?branch:company?from:undefined}/>
  {process&&!invalid&&<div className="sw-back"><span className="muted">同层工艺</span><Link to={root+'/equipment/'+(branch==='etch'?'deposition':'etch')}>{branch==='etch'?'薄膜沉积':'刻蚀'}<ChevronRight size={14}/></Link></div>}
  {invalid?<section className="sw-section"><p>该地址不对应本轮已纳入的研究对象，不以其他公司或设备替代。</p><Link to={root+'/equipment'}>返回设备层</Link></section>:company?<>
   <Link className="sw-back" to={fromInfo?semiconductorChildPath(contextLayer.id,from):semiconductorLayerPath(contextLayer.id)}><ArrowLeft size={14}/>{'返回'+(fromInfo?.name||contextLayer.name)}</Link>
   <section className="sw-section"><header><h2>业务关联与受益条件</h2><span>{company.code} · 非投资建议</span></header><div className="sw-company-context"><article><h3>已取得的业务依据</h3><p>{company.basis}</p><Source url={company.source}>{company.sourceLabel}</Source><small>资料核对 {checked}；旧版资料不代表当前订单进度。</small></article><article><h3>从关联到受益，还缺什么</h3><p>{company.limit||fromInfo?.evidence?.risk||contextLayer.evidence?.risk||'需分别核对具体产品、客户验证和财务兑现。'}</p><p>后续核对：相应产品订单 → 交付与验收 → 分产品收入 → 利润与回款。</p></article></div></section>
   <CompanyInsights company={{...company,limit:company.limit||fromInfo?.evidence?.risk||contextLayer.evidence?.risk}} summary={summary}/>
  </>:process?<>
   <div className="sw-process-brief"><div><span className="sw-tag">工艺知识 · 非当前订单结论</span><h2>{info.kpi}</h2><p>{info.routes}</p></div><Source url={data.source}>Lam Research 工艺说明</Source></div>
   <Segmented label="设备详情视图" value={tab} options={[["logic","传导与公司"],["bom","BOM 拆解"],["evidence","证据与反证"]]} onChange={changeTab}/>
   {tab==='logic'&&<><BoardChanges layer={equipmentLayer} board={board}/><ProcessResearchFacts layer={equipmentLayer} process={equipmentProcess}/><IndustryReports layer="equipment"/></>}
   {tab==='bom'&&<section className="sw-section"><header><h2>{info.short} · 工艺与设备拆解</h2><span>{SEMI_BOM_VERSION}</span></header><p>先拆功能与需求，再验证配置、价值量和供应商。不是工程采购清单，不把功能拆解自动绑定到上市公司。</p><div className="sw-bom-parts">{data.parts.map(p=><article key={branch+p.id}><button aria-expanded={part===p.id} aria-controls={'part-'+p.id} onClick={()=>setPart(part===p.id?'':p.id)}><Settings2 size={20}/><span><strong>{p.name}</strong><small>{p.role}</small></span><ChevronRight size={16}/></button>{part===p.id&&<motion.div id={'part-'+p.id} role="region" aria-label={p.name+'拆解证据'} initial={reduced?false:{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:uiMotion.normal}}><dl>{[['需求来源',p.demand],['用量与价值量',p.quantity],['竞争与约束',p.constraint],['受益验证',p.validation]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><Source url={data.source}>工艺功能来源 · Lam Research</Source><p className="sw-footnote">该来源支持工艺用途，不逐项证明机型配置、零部件供应商或客户订单。相关企业暂不映射，避免把猜测当供应关系。</p></motion.div>}</article>)}</div></section>}
   {tab==='evidence'&&<section className="sw-section"><header><h2>证据与反证</h2><span>来源核对 {checked}</span></header><div className="sw-evidence"><article><span className="sw-tag">工艺事实</span><h3>工艺用途与路线</h3><p>{data.description}工艺说明不支持当前市场规模和国产化比例。</p><Source url={data.source}>Lam Research · {info.short}</Source></article><article><span className="sw-tag">公司业务事实</span><h3>产品目录与业务关联</h3><p>企业公开产品资料支持业务范围，不确认本轮扩产订单。</p><Source url={info.source}>北方华创 · 对应产品</Source><Source url={companies[0].source}>中微公司 · 产品介绍</Source></article><article><span className="sw-tag">受益推断 · 尚未确认</span><h3>需求增长到收入兑现</h3><p>需要客户采购、验证、交付与验收证据，当前不判定本轮受益强弱。</p></article><article><span className="sw-tag">待查反证</span><h3>传导失效条件</h3><p>{info.counter}</p><small>这是核验条件，不是已经发生的事实。</small></article></div></section>}
   <section className="sw-section"><header><h2>外围影响</h2><span>只提供核验路径，不以海外行情代替订单</span></header><p>跟踪海外晶圆厂实际投入、工艺演进、设备及关键配套的供应限制。限制措施按生效日期、地区、产品范围核验，不能推导为国内企业必然取得订单。</p><p className="sw-footnote">当前尚未绑定已核验政策和海外资本开支序列，不展示政策利好评分。</p></section>
  </>:equipment?<>
   <section className="sw-intro"><Settings2 size={32}/><div><h2>工艺装备，连接扩产与制造</h2><p>设备层不是一个统一周期：光刻、刻蚀、沉积、清洗和量测分别受工艺、产线与验证进度影响。</p></div></section><Fundamentals/>
   <section className="sw-section"><header><h2>按设备工艺下钻</h2><span>本轮先完成两个详情样板</span></header><div className="sw-process-cards">{(['etch','deposition'] as const).map(b=><Link key={b} to={root+'/equipment/'+b} aria-label={'研究'+processInfo[b].title}><Settings2 size={26}/><h3>{processInfo[b].title}</h3><p>{processInfo[b].summary}</p><span>{processInfo[b].kpi}</span><strong>查看传导、BOM 与公司<ChevronRight size={16}/></strong></Link>)}</div><div className="sw-next-processes">{['光刻与涂胶显影','清洗与热处理','检测与量测','离子注入'].map(name=><span key={name}>{name}<small>后续扩展 · 未开放详情</small></span>)}</div></section><CompanyLinks branch="etch"/>
  </>:<>
   <section className="sw-section sw-map"><header><h2>先看懂产业组成</h2><span>知识框架，不确认采购关系</span></header><div className="sw-chain">{['EDA / IP','芯片设计','晶圆制造','封装测试','下游应用'].map((name,index)=><div key={name}><Cpu size={22}/><strong>{name}</strong><small>{['工具与知识产权','功能与电路实现','前道工艺','后道连接与测试','终端需求'][index]}</small></div>)}</div><div className="sw-map-support"><Link aria-label="进入半导体设备层" to={root+'/equipment'}><Settings2 size={18}/>半导体设备<ChevronRight size={14}/></Link><button onClick={()=>setLayer('materials')}><FlaskConical size={18}/>半导体材料<ChevronRight size={14}/></button><p>设备与材料支撑制造和封测；下游需求逐级传导。</p></div></section><Fundamentals/>
   <section className="sw-section sw-directory"><header><h2>产业环节总览</h2><span>目录不是景气排名</span></header><div className="sw-layer-grid">{layers.map(l=><article key={l.id}><l.icon size={24}/><h3>{l.name}</h3><p>{l.description}</p>{l.id==='equipment'?<Link aria-label="打开设备层研究" to={root+'/equipment'}>刻蚀 / 沉积等工艺<ChevronRight size={16}/></Link>:<button onClick={()=>setLayer(l.id)}>了解环节<ChevronRight size={16}/></button>}<small>{l.id==='equipment'?'两个详情样板已接通':'知识介绍 · 经营指标尚未覆盖'}</small></article>)}</div></section>
   <section className="sw-section"><header><h2>最近披露与验证</h2><FileCheck2 size={18}/></header><p>尚未接入产业级增量披露时间线。公司三表可从设备层进入查看，不能由抓取时间伪装为公告发布日期。</p><Link to={root+'/equipment'}>进入设备层核对公司证据<ChevronRight size={14}/></Link></section>
  </>}
  <Drawer open={research} onOpenChange={setResearch} title="分步研究"><p>{company?'公司研究继续进入当前个股档案，保留证券身份，不切换成整个设备环节。':'保留资料与口径、产业总览、技术路线、价值量与卡口、全球格局、持续验证六步。先预览再发送，不自动调用模型。'}</p><Link className="outline-button" to={company?'/stock?code='+company.code:studyHref} onClick={()=>setResearch(false)}>{company?'打开当前公司个股档案':'打开当前环节研究工作台'}<ArrowUpRight size={15}/></Link><p className="sw-footnote">公司财报、产业结构和模型判断分开；资料不足时保留缺口。</p></Drawer>
  <Drawer open={!!layer} onOpenChange={open=>{if(!open)setLayer('');}} title={layers.find(l=>l.id===layer)?.name||'产业环节'}><p>{layers.find(l=>l.id===layer)?.description}</p><h3>当前覆盖</h3><p>本轮只提供产业组成介绍；此环节的动态指标、受益公司与财报关联尚未补齐，不以设备层数据替代。</p><Link to={root+'/equipment'} onClick={()=>setLayer('')}>查看已开放的设备层研究</Link></Drawer>
 </div>;
}
