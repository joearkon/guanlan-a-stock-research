import {useIndustryUpdates} from './IndustryUpdates';
import {useResearchVersionNotice} from './ResearchVersionNotice';
import {useState,lazy,Suspense} from 'react';
import {Link,useParams,useLocation,useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {motion} from 'motion/react';
import {ArrowLeft,ArrowUpRight,Cpu,Layers3,Search,RefreshCw,FileText,Landmark,ShoppingBag,Clapperboard,Gamepad2} from 'lucide-react';
import catalog from '../../shared/industry-catalog.json';
import {industryEntries} from './industry-entries';
import {publicQuery,number,pct} from './api';
import {Widget,Drawer,Skeleton} from './components';
import PageLoading from './PageLoading';
import StockLink from './StockLink';
import {safeSource} from './urls';
import {useUiReducedMotion} from './personal-preferences';
import {uiMotion} from './motion-tokens';
import './industry-hub.css';
const ComputeResearch=lazy(()=>import('./ComputeResearch'));
const ComputeCase=lazy(()=>import('./IndustryResearch'));
const SemiconductorResearch=lazy(()=>import('./SemiconductorResearch'));
const SemiconductorWorkspace=lazy(()=>import('./SemiconductorWorkspace'));
const SemiconductorDirectory=lazy(()=>import('./SemiconductorDirectory'));
const CleanroomDesk=lazy(()=>import('./CleanroomDesk'));
const fourQuestions=['产业利润池是否扩大？','公司能否持续获得更多利润？','当前价格是否包含过高预期？','如何持续验证或推翻判断？'];
const stamp=(v:any)=>v?new Date(v).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未取得';
const statusText=(s:string)=>({ok:'来源已同步',partial:'部分来源不可用 · 保留已取得资料',stale:'快照待更新',pending:'等待后台同步',unavailable:'共享资料暂不可用'}[s]||'等待后台同步');
export default function IndustryHub(){
 const [search,setSearch]=useState(''),reduced=useUiReducedMotion(),updates=useIndustryUpdates(),versions=useResearchVersionNotice();
 const shown=industryEntries.filter(i=>[i.name,i.summary,...i.stages,...i.companies.map(c=>c.name+' '+c.code)].join(' ').toLowerCase().includes(search.trim().toLowerCase()));
 return <div className="industry-hub"><div className="page-heading"><h1>产业价值研究</h1><span className="muted">从产业逻辑到公司兑现</span></div>
  <section className="industry-hub-intro"><div><span className="industry-kicker">产业与公司研究</span><h2>看懂一条产业链，再验证一家公司。</h2><p>需求是否增长，利润由谁获得，价格要求什么，下一步如何验证。比较科技成长、现金分配与品牌经营，不把题材热度当作经营结论。</p></div><div className="industry-coverage"><span>已开放研究方向</span><strong>{industryEntries.filter(i=>!i.planned).length.toString().padStart(2,'0')}</strong><small>另有 {industryEntries.filter(i=>i.planned).length} 个建设中目录 · 非全行业覆盖</small></div></section>
  <div className="industry-hub-toolbar"><div><h2>选择研究方向</h2><Link className="outline-button" to="/industry/compare">产业对比 · 选择两个方向</Link><p className="muted">目录按研究结构展示，不按股价、热度或推荐程度排名。</p></div><label className="industry-search"><Search size={16}/><input aria-label="搜索产业或公司" value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索产业 / 公司 / 代码"/></label></div>
  <div className="industry-directory">{shown.map(i=><motion.article key={i.id} className={"industry-directory-card"+(i.planned?" industry-planned-card":"")} whileHover={reduced?undefined:{y:-2}} transition={{duration:reduced?0:uiMotion.normal,ease:uiMotion.ease}}><div className="industry-card-top"><span className="industry-card-icon">{i.id==='ai-compute'?<Cpu size={24}/>:i.id==='dividend'?<Landmark size={24}/>:i.id==='consumer'?<ShoppingBag size={24}/>:i.id==='media'?<Clapperboard size={24}/>:i.id==='gaming'?<Gamepad2 size={24}/>:<Layers3 size={24}/>}</span><span>{i.eyebrow}</span><small>{i.coverage}</small></div><h2>{i.name}{i.id==='semiconductors'?updates.dot(i.id,i.name):versions.dot(i.id,i.name)}</h2><p>{i.summary}</p><ol className="industry-stage-trail">{i.stages.map(s=><li key={s}>{s}</li>)}</ol><div className="industry-company-preview">{i.companies.map(c=><span key={c.code}>{c.name}</span>)}</div><div className="industry-card-bottom"><small>{i.planned?'目录建设中 · 非研究完成':i.snapshot?'行业指标 + 公司案例 · 非自动同步':'共享资料与版本研究'}</small><Link to={'/industry/'+i.id} aria-label={'进入 '+i.name+' 研究'}>{i.planned?'查看建设进度':'进入研究'} <ArrowUpRight size={16}/></Link></div></motion.article>)}</div>
  {updates.status}{updates.panel}{versions.panel}
  {!shown.length&&<div className="industry-empty"><Search size={24}/><h2>未找到对应研究方向</h2><p>可按产业、公司名或代码搜索已开放研究；未研究的方向不借用其他公司的数据。</p><button className="outline-button" onClick={()=>setSearch('')}>清除搜索</button></div>}
  <section className="industry-method"><h2>每个方向，都回答同样的四个问题</h2><div>{fourQuestions.map((q,i)=><article key={q}><small>0{i+1}</small><h3>{q}</h3></article>)}</div><p className="provenance">产业环节为研究组织框架，不是已确认的客户或供应商关系。财报自动同步与人工研究结论分开管理；同步不会改写已保存的研究，也不会自动调用模型。</p></section>
 </div>;
}
export function IndustryPage({industryId,advanced=false}:{industryId?:string;advanced?:boolean}){
 const location=useLocation(),[searchParams]=useSearchParams();
 const params=useParams(),id=industryId||params.industryId,industry=catalog.find(i=>i.id===id);
 if(!industry)return <div className="industry-hub"><h1>研究方向未开放</h1><Link to="/industry">返回产业总览</Link></div>;
 if(id==='ai-compute'&&searchParams.get('view')!=='legacy')return <Suspense fallback={<PageLoading label="正在打开算力产业研究"/>}><ComputeResearch live/></Suspense>;
 if(id==='semiconductors'){
  const cleanroom=location.pathname.includes('/layers/cleanroom')||location.pathname.includes('/companies/')&&searchParams.get('fromLayer')==='cleanroom';
  if(cleanroom)return <Suspense fallback={<PageLoading label="正在打开洁净室研究工作台"/>}><CleanroomDesk/></Suspense>;
  const renderFinancials=(codes:string[])=>{const selected=industry.companies.filter(c=>codes.includes(c.code));return selected.length?<FinancialPanel key={codes.join(',')} industry={{...industry,companies:selected}}/>:null;};
  const isStudy=searchParams.get('view')==='study';
  const directory=location.pathname==='/industry/semiconductors'||location.pathname==='/industry/semiconductors/equipment'||location.pathname.includes('/semiconductors/layers/');
  return <Suspense fallback={<PageLoading label="正在打开半导体研究工作台"/>}>{isStudy?<SemiconductorResearch key={advanced?'advanced':'overview'} advanced={advanced||location.pathname.endsWith('/advanced-process')} renderFinancials={renderFinancials}/>:directory?<SemiconductorDirectory key={location.pathname}/>:<SemiconductorWorkspace key={location.pathname} renderFinancials={renderFinancials}/>}</Suspense>;
 }
 return <div className="industry-hub"><Link className="industry-back" to="/industry"><ArrowLeft size={15}/>返回产业总览</Link><div className="page-heading"><h1>{industry.name}</h1><span className="muted">{industry.eyebrow} · 四问研究工作台</span></div><section className="industry-detail-brief"><p>{industry.summary}</p><ol className="industry-stage-trail">{industry.stages.map(s=><li key={s}>{s}</li>)}</ol><small>研究分类，不代表已核验订单关系；没有纳入的环节不视为已覆盖。</small></section><FinancialPanel industry={industry}/>
 {id==='ai-compute'?<Suspense fallback={<p role="status">正在打开已核验披露案例…</p>}><ComputeCase embedded/></Suspense>:<section className="industry-framework"><div className="page-heading"><h2>研究框架与待核验问题</h2><span className="muted">财报同步不等于已完成产业结论</span></div>{fourQuestions.map((q,i)=><Widget key={q} title={q} subtitle={'0'+(i+1)+' · '+industry.name}><p>{industry.questions[i]}</p><p className="provenance">{i===2?'使用有日期的价格和年度盈利假设，不将季报直接年化，也不输出未经核验的目标价。':i===3?'结合下一次财报、订单及现金回款复核；本页未创建自动提醒。':'公司三表可在上方逐一查看；行业总量、订单结构及竞争价格仍需补充原始披露，暂不下确定性结论。'}</p></Widget>)}</section>}
 </div>;
}
function FinancialPanel({industry}:{industry:typeof catalog[number]}){
 const [code,setCode]=useState(industry.companies[0].code),[evidence,setEvidence]=useState(false);
 const company=industry.companies.find(c=>c.code===code)||industry.companies[0];
 const query=useQuery({...publicQuery('/api/research/industry/financials?industry='+industry.id,60000),refetchInterval:300000});
 const row=query.data?.companies?.find((c:any)=>c.code===company.code),summary=row?.summary,income=summary?.income,cash=summary?.cashflow,balance=summary?.balance;
 return <section className="industry-financial"><Widget title="公司财报 · 自动同步" subtitle="后台分批检查，页面只读共享结果；不随访问人数重复抓取。" actions={<button className="outline-button" onClick={()=>void query.refetch()} disabled={query.isFetching}><RefreshCw size={14} className={query.isFetching?'spin':''}/>{query.isFetching?'正在读取':'重新读取'}</button>}>
  <div className="industry-company-tabs" role="group" aria-label="财报跟踪公司">{industry.companies.map(c=><button key={c.code} aria-pressed={company.code===c.code} onClick={()=>setCode(c.code)}><span>{c.name}</span><small>{c.code} · {c.stage}</small></button>)}</div>
  <div className="industry-financial-heading"><div><h3><StockLink code={company.code} name={company.name}/><small>{company.code}</small></h3><p>{company.stage} · {statusText(row?.status||'pending')}</p></div><Link className="outline-button" aria-label={'进入'+company.name+'个股档案'} to={'/stock?code='+company.code}>个股档案 <ArrowUpRight size={14}/></Link></div>
  {query.isError&&<div role="alert" className="fact-note">共享财报读取失败，已显示内容仍保留。<button className="industry-source-button" onClick={()=>void query.refetch()}>重试读取共享财报</button></div>}
  {query.isPending?<Skeleton label="共享财报" kind="table"/>:!query.data?null:!income?.period&&!cash?.period&&!balance?.period?<div className="industry-empty"><FileText size={24}/><h3>尚无共享财报快照</h3><p>等待后台分批同步，或进入个股档案核对已有披露。当前不以示例数字填充。</p></div>:<>
   <div className="industry-financial-status"><span>后台检查 {stamp(row?.checkedAt)}</span><button className="industry-source-button" onClick={()=>setEvidence(true)}><FileText size={14}/>来源与同步详情</button></div>
   <div className="industry-statement-grid"><article><div className="industry-statement-title"><h3>利润表</h3><span>{income?.period||'报告期未取得'}</span></div><dl><div><dt>营业收入 · 来源原值</dt><dd>{number(income?.revenue,0)}</dd></div><div><dt>归母净利润 · 来源原值</dt><dd>{number(income?.profit,0)}</dd></div><div><dt>收入同比</dt><dd>{pct(income?.revenueYoy)}</dd></div><div><dt>归母净利润同比</dt><dd>{pct(income?.profitYoy)}</dd></div></dl><small>同比比较期 {income?.priorPeriod||'未取得，不计算'}</small></article><article><div className="industry-statement-title"><h3>现金流量表</h3><span>{cash?.period||'报告期未取得'}</span></div><dl><div><dt>经营现金流净额 · 来源原值</dt><dd>{number(cash?.operatingCash,0)}</dd></div></dl><p>与利润表分别显示报告期；不混用不同累计期间，也不在单位未确认时计算现金利润比。</p></article><article><div className="industry-statement-title"><h3>资产负债表</h3><span>{balance?.period||'报告期未取得'}</span></div><dl><div><dt>应收账款 · 来源原值</dt><dd>{number(balance?.receivables,0)}</dd></div><div><dt>存货 · 来源原值</dt><dd>{number(balance?.inventory,0)}</dd></div></dl><p>期末余额不是期间流量；缺少上期同口径数据时，不判断周转好坏。</p></article></div>
   <p className="provenance">金额为来源原值，单位待核验，不标作元或亿元；同比仅按同源同字段上年同期计算。自动抓取不是审计核验，三表报告期可能不同，不覆盖全部经营数据。</p>
  </>}
  <p className="industry-sync-policy">同步策略：每 5 分钟最多处理 1 家公司，来源缓存 6 小时；当前 {catalog.reduce((n,i)=>n+i.companies.length,0)} 家按批轮转，失败后退避并保留可用旧资料。不是公告发布后即时推送，也不自动生成研究。</p>
 </Widget><Drawer open={evidence} onOpenChange={setEvidence} title={company.name+' · 财报来源与同步'}>{(['income','cashflow','balance'] as const).map((key,i)=>{const s=summary?.[key];return <div className="industry-receipt" key={key}><h3>{['利润表','现金流量表','资产负债表'][i]}</h3><dl><div><dt>报告期</dt><dd>{s?.period||'未取得'}</dd></div><div><dt>来源</dt><dd>{s?.provider||'未取得'}</dd></div><div><dt>来源取得时间</dt><dd>{stamp(s?.fetchedAt)}</dd></div><div><dt>状态</dt><dd>{statusText(s?.status||'pending')}</dd></div><div><dt>计量单位</dt><dd>来源未归一，单位待核验</dd></div></dl>{safeSource(s?.url)&&<a target="_blank" rel="noopener noreferrer" href={safeSource(s.url)!}>打开来源数据 <ArrowUpRight size={14}/></a>}</div>;})}<p className="provenance">报告期不是发布日期；后台检查时间也不是财报披露时间。旧快照不会因为重新读取而被标为最新财报。</p></Drawer></section>;
}
