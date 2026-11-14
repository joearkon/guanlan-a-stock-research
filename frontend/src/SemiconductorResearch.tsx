import {AiAction} from './AiAction';
import {useId,useState,type ReactNode} from 'react';
import {Link,useLocation,useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {motion} from 'motion/react';
import {ArrowLeft,ArrowUpRight,ChevronRight,Copy,FileText,SearchCheck} from 'lucide-react';
import {Drawer,Segmented,Skeleton,Widget} from './components';
import {publicQuery} from './api';
import {useAsk} from './AskContext';
import StockLink from './StockLink';
import {useUiReducedMotion} from './personal-preferences';
import {uiMotion} from './motion-tokens';
import {safeSource} from './urls';
import catalog from '../../shared/industry-catalog.json';
import {semiconductorNodes,advancedProcessNodes,semiconductorNode,researchSteps,semiconductorPrompt} from './semiconductor-research-model';
import {OperatingDashboard,ResearchBom} from './SemiconductorOperating';
import {fourQuestionPrompt,type BomBranch} from './semiconductor-bom';
import {IndustryIcon} from './industry-icons';
import './semiconductor-research.css';

type Preview={question:string;node:string;step:string;returnTo:string};
const questions=['产业利润池是否扩大？','公司能否持续获得更多利润？','当前价格是否包含过高预期？','如何持续验证或推翻判断？'];
function parentPath(value:unknown){
 const fallback='/industry/semiconductors';
 if(typeof value!=='string'||value.length>2000||!value.startsWith('/')||/[\\\u0000-\u001f]/.test(value))return fallback;
 try{const url=new URL(value,'https://guanlan.invalid');return url.origin==='https://guanlan.invalid'&&url.pathname===fallback?url.pathname+url.search:fallback;}catch{return fallback;}
}
export default function SemiconductorResearch({advanced=false,renderFinancials}:{advanced?:boolean;renderFinancials:(codes:string[])=>ReactNode}){
 const [params,setParams]=useSearchParams(),location=useLocation(),ask=useAsk(),reduced=useUiReducedMotion(),treeMotion=useId(),stepMotion=useId();
 const nodes=advanced?advancedProcessNodes:semiconductorNodes,node=semiconductorNode(params.get('node'),advanced);
 const tab=['chain','operating','bom','evidence','companies'].includes(params.get('tab')||'')?params.get('tab')!:'chain',branch:BomBranch=params.get('bom')==='deposition'?'deposition':'etch';
 const step=researchSteps.find(s=>s.id===params.get('step'))||researchSteps[0],stepIndex=researchSteps.indexOf(step);
 const [preview,setPreview]=useState<Preview|null>(null),[copyStatus,setCopyStatus]=useState('');
 const title=advanced?'先进制程设备':'半导体',industry=catalog.find(i=>i.id==='semiconductors')!,companies=industry.companies.filter(c=>node.codes.includes(c.code));
 const parent=parentPath(location.state?.semiconductorParent);
 const evidenceEnabled=['evidence','operating'].includes(tab)&&companies.length>0;
 const evidenceQuery=useQuery({...publicQuery('/api/research/industry/financials?industry=semiconductors',60000),enabled:evidenceEnabled,refetchInterval:evidenceEnabled?300000:false});
 const operatingRows=(evidenceQuery.data?.companies||[]).filter((row:any)=>node.codes.includes(row.code)).map((row:any)=>({...row,name:companies.find(c=>c.code===row.code)?.name}));
 const receipts=(evidenceQuery.data?.companies||[]).filter((r:any)=>node.codes.includes(r.code)).flatMap((r:any)=>(['income','cashflow','balance'] as const).map((kind,i)=>({code:r.code,name:companies.find(c=>c.code===r.code)?.name,kind,label:['利润表','现金流量表','资产负债表'][i],...r.summary?.[kind]}))).filter((r:any)=>r.period);
 const select=(key:string,value:string)=>{const next=new URLSearchParams(params);next.set(key,value);setParams(next,{preventScrollReset:true,state:location.state});};
 const stages=advanced?['扩产计划','厂务与洁净室','前道工艺','晶圆制造']:['设备与材料','芯片设计','晶圆制造','封装与测试','终端应用'];
 const openPreview=()=>{setCopyStatus('');setPreview({question:semiconductorPrompt(node,step.id,advanced),node:node.name,step:step.title,returnTo:'/next'+location.pathname+location.search});};
 const openAssessment=()=>{setCopyStatus('');const snapshot=operatingRows.filter((r:any)=>r.summary?.income?.period).map((r:any)=>r.code+'@'+r.summary.income.period+'@'+(r.summary.income.fetchedAt||r.checkedAt||'取得时间缺失')).join(';');setPreview({question:fourQuestionPrompt(node.name,advanced&&node.id==='etch-film'?branch:null,snapshot),node:node.name,step:'四问研判',returnTo:'/next'+location.pathname+location.search});};
 return <div className="industry-hub semi-research">
  <nav className="semi-breadcrumb" aria-label="产业研究路径"><Link to="/industry">产业总览</Link><ChevronRight size={12}/>{advanced?<><Link to={parent}>半导体</Link><ChevronRight size={12}/><span>先进制程设备</span></>:<span>半导体</span>}</nav>
  <div className="page-heading"><h1>{title}</h1><span className="muted">产业链、证据与公司兑现</span><Link className="industry-back" to={advanced?parent:'/industry'}><ArrowLeft size={14}/>{advanced?'返回半导体':'返回产业总览'}</Link></div>
  <div className="semi-topline"><p>先沿环节找证据，再判断利润如何传导。</p><Segmented label="半导体研究视图" value={tab} options={[["chain","产业链"],["operating","经营与价值"],["bom","研究 BOM"],["evidence","证据与分歧"],["companies","公司与财报"]]} onChange={v=>select('tab',v)}/></div>
  <div className="semi-mobile-node-picker"><label>产业环节<select aria-label="切换产业环节" value={node.id} onChange={event=>select('node',event.target.value)}>{nodes.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select></label>{!advanced&&<Link to="/industry/semiconductors/advanced-process?view=study" state={{semiconductorParent:location.pathname+location.search}}>下钻先进制程设备<ArrowUpRight size={14}/></Link>}</div>
  <div className="semi-workspace">
   <aside className="semi-tree-panel"><h2>{advanced?'产业环节':'产业树'}</h2><p>{advanced?'半导体 / 先进制程设备':'电子 / 半导体'}</p><nav aria-label={title+'产业树'}>{nodes.map(n=><button key={n.id} type="button" aria-current={node.id===n.id?'location':undefined} aria-label={n.name} onClick={()=>select('node',n.id)}>{node.id===n.id&&<motion.span className="semi-active-line" layoutId={treeMotion} initial={false} transition={{duration:reduced?0:uiMotion.normal,ease:uiMotion.ease}}/>}<IndustryIcon kind={n.id}/><span>{n.name}</span><ChevronRight size={13}/></button>)}</nav>{!advanced&&<Link className="semi-drill-link" to="/industry/semiconductors/advanced-process?view=study" state={{semiconductorParent:location.pathname+location.search}} aria-label="进入先进制程设备">先进制程设备<ArrowUpRight size={15}/><small>从扩产下钻到设备、零部件与材料</small></Link>}<p className="semi-tree-note">研究骨架 2026-10-30<br/>不是行情或研报更新日期，也不代表供应关系已经核验。</p></aside>
   <div className="semi-main">
    {tab==='operating'&&<OperatingDashboard node={node} rows={operatingRows} pending={evidenceEnabled&&evidenceQuery.isPending&&evidenceQuery.isFetching} error={evidenceQuery.isError} onRetry={()=>void evidenceQuery.refetch()} onEvidence={()=>select('tab','evidence')} onAssess={openAssessment}/>}
    {tab==='bom'&&(advanced&&node.id==='etch-film'?<ResearchBom branch={branch} onBranch={value=>select('bom',value)}/>:<Widget title="研究级 BOM" subtitle="首版只展开刻蚀与薄膜沉积，不借用其他环节的拆解。"><p>从产业树进入先进制程设备的「刻蚀与薄膜」，查看工艺、需求、价值量与验证条件。</p><Link className="outline-button" to="/industry/semiconductors/advanced-process?node=etch-film&tab=bom" state={{semiconductorParent:location.pathname+location.search}}>打开刻蚀与薄膜 BOM <ArrowUpRight size={14}/></Link></Widget>)}
    {tab==='chain'&&<>
     <Widget title={advanced?'从扩产到工艺兑现':'产业链 · 从上游到应用'} subtitle="节点是研究框架；箭头不确认采购、订单或供应关系。">
      <div className="semi-chain" aria-label="产业传导框架">{stages.map((s,i)=><div className={node.stage===i?'selected':''} key={s}><span>{s}</span><small>{node.stage===i?'当前环节归属':'研究位置'}</small></div>)}</div>
      <div className="semi-current"><span className="semi-eyebrow">当前研究</span><h2>当前环节：{node.name}</h2><dl><div><dt>上游核对范围</dt><dd>{node.upstream}</dd></div><div><dt>下游核对范围</dt><dd>{node.downstream}</dd></div></dl><p className="semi-key-question">{node.question}</p><p>{node.check}</p></div>
      <div className="semi-counter"><span>相反信号</span><p>{node.counter}</p></div>
      <p className="provenance">以上为待验证的问题与条件，不是已取得的产业结论；不能用概念标签替代业务和订单证据。</p>
     </Widget>
     <Widget title="把产业结构落到四个问题" subtitle="分开判断产业、公司、价格与后续验证。"><div className="semi-four-questions">{questions.map((q,i)=><article key={q}><h3>{q}</h3><p>{[node.question,'用同报告期收入、利润和现金核对经营兑现；行业趋势不能替代公司披露。','先明确价格日期、盈利年度和EPS/PE假设；当前未建立该环节估值结论。',node.counter+' 列出下一次核验所需资料和时间。'][i]}</p></article>)}</div></Widget>
    </>}
    {tab==='evidence'&&<Widget title="事实、推断与反证" subtitle="来源数据与研究判断分层；同步不等于已交叉核验原文。">
     <div className="semi-evidence-section"><h3><FileText size={16}/>来源资料</h3>{evidenceQuery.isPending&&evidenceQuery.isFetching&&companies.length>0?<Skeleton label="当前环节共享财报资料"/>:evidenceQuery.isError?<div className="local-error" role="alert">来源读取失败，已有资料仍保留。<button onClick={()=>void evidenceQuery.refetch()}>重试来源资料</button></div>:null}
      {receipts.length?receipts.map((r:any)=><article className="semi-source-row" key={r.code+r.kind}><div><StockLink code={r.code} name={r.name}/><strong>{r.label}</strong><span>报告期 {r.period}</span></div><small>{r.provider||'来源名称未取得'} · {r.status==='ok'?'来源已取得，仍需核对原文':'保留旧资料，来源待更新'} · 单位待核验</small>{safeSource(r.url)&&<a href={safeSource(r.url)!} target="_blank" rel="noopener noreferrer">核对来源 <ArrowUpRight size={13}/></a>}</article>):!evidenceQuery.isError&&(!evidenceQuery.isPending||!companies.length)?<p className="semi-empty-note">当前环节尚无可展示的来源资料；这不代表没有公告、研报或相关公司。</p>:null}
     </div>
     <div className="semi-evidence-section"><h3>研究推断 · 待核验</h3><p>{node.question}</p><p className="provenance">尚未把该问题验证为成立，不展示没有来源的景气评分或公司排名。</p></div>
     <div className="semi-evidence-section"><h3>反向证据 · 待查找</h3><p>{node.counter}</p><p className="provenance">这是需要寻找的反证条件，不代表已经发生。</p></div>
     <button className="outline-button" onClick={()=>select('tab','companies')}>查看公司财报与研究记录</button>
    </Widget>}
    {tab==='companies'&&<>
     <Widget title={'当前环节的公司映射 · '+companies.length+'家'} subtitle="仅列本轮已纳入的研究样本，不是完整产业名单或推荐顺序。">{companies.length?<div className="semi-company-list">{companies.map(c=><article key={c.code}><div><StockLink code={c.code} name={c.name}/><small>{c.code} · {c.stage}</small></div><Link to={'/stock?code='+c.code+'&tab=records'}>研究记录 <ArrowUpRight size={14}/></Link></article>)}</div>:<div className="semi-empty-note"><SearchCheck size={24}/><h3>当前环节尚未纳入公司财报跟踪</h3><p>保留该环节，不用其他环节公司填充。可切换设备或制造环节查看已覆盖样本。</p></div>}</Widget>
     {companies.length>0&&renderFinancials(companies.map(c=>c.code))}
    </>}
   </div>
   <aside className="semi-research-path"><h2>分步研究</h2><p>每次只处理一个问题，先预览，再确认发送。</p><nav aria-label="半导体研究步骤">{researchSteps.map((s,i)=><button key={s.id} type="button" aria-label={'第'+(i+1)+'步 '+s.title} aria-pressed={step.id===s.id} onClick={()=>select('step',s.id)}>{step.id===s.id&&<motion.span className="semi-active-line" layoutId={stepMotion} initial={false} transition={{duration:reduced?0:uiMotion.normal,ease:uiMotion.ease}}/>}<span className="semi-step-number">{String(i+1).padStart(2,'0')}</span><span><strong>{s.title}</strong><small>{s.description}</small></span></button>)}</nav><div className="semi-step-action"><small>当前：{node.name} / 第{stepIndex+1}步</small><AiAction className="primary" onClick={openPreview}>预览本步研究问题</AiAction><p>仅准备草稿，不自动调用模型。深度思考仍由问观澜页面选择。</p></div></aside>
  </div>
  <Drawer open={!!preview} onOpenChange={open=>{if(!open)setPreview(null);}} title="研究问题预览" className="semi-prompt-drawer">{preview&&<><p className="provenance">{preview.node} / {preview.step} · 尚未发送，不会自动连续执行后续步骤。</p><label className="semi-prompt-label">研究问题<textarea aria-label="研究问题" value={preview.question} maxLength={500} onChange={e=>{setPreview({...preview,question:e.target.value});setCopyStatus('');}}/></label><div className="semi-prompt-actions"><button className="outline-button" onClick={async()=>{try{await navigator.clipboard.writeText(preview.question);setCopyStatus('已复制研究问题');}catch{setCopyStatus('复制未完成，请在上方手动选择文本');}}}><Copy size={15}/>复制研究问题</button><AiAction className="primary" disabled={!ask||!preview.question.trim()||preview.question.length>500} onClick={()=>{const value=preview;setPreview(null);ask?.({question:value.question,context:{page:'产业价值研究',section:title+' / '+value.node+' / '+value.step},returnTo:value.returnTo});}}>填入问观澜草稿</AiAction></div>{copyStatus&&<p role="status">{copyStatus}</p>}<p className="provenance">填入后仍需你点击“发送提问”才会创建研究任务。缺失的来源、报告期、单位与口径必须明确保留，不用提示词预设结论。</p></>}</Drawer>
 </div>;
}
