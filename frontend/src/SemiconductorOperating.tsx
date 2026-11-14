import {useId,useState} from 'react';
import {motion} from 'motion/react';
import {ArrowUpRight,ChevronDown,FileText,ClipboardCheck} from 'lucide-react';
import {Segmented,Skeleton} from './components';
import {IndustryIcon} from './industry-icons';
import {bomBranches,SEMI_BOM_VERSION,type BomBranch} from './semiconductor-bom';
import {useUiReducedMotion} from './personal-preferences';
import {uiMotion} from './motion-tokens';
import {pct} from './api';
import {safeSource} from './urls';
import StockLink from './StockLink';
import type {ResearchNode} from './semiconductor-research-model';
import './semiconductor-operating.css';

const dimensions=[
 {id:'cycle',name:'行业景气',status:'需产业证据',summary:'需求、价格、订单与稼动率',question:'产业利润池是否扩大？',check:'比较需求、价格、订单、库存与稼动率是否同向；公司营收增长不能直接外推全行业。',missing:'缺少连续同口径行业序列，当前不判定景气阶段。',counter:'扩产快于需求、价格走弱，库存或验收周期拉长。'},
 {id:'investment',name:'产业投入',status:'需投入证据',summary:'资本开支、扩产与订单；不是股票净流入',question:'产业投入能否转成有效需求？',check:'区分规划、开工、设备搬入、交付、验收和量产。核对现金流量表资本开支与公开扩产披露，不把计划金额写成实际支出。',missing:'当前共享三表摘要未覆盖完整资本开支、订单与在建工程口径。',counter:'扩产计划推迟；交付增加但验收与回款未同步。'},
 {id:'earnings',name:'利润与现金',status:'核对公司三表',summary:'收入、利润、回款与存货',question:'公司能否持续获得更多利润？',check:'按同一报告期核对收入、利润、经营现金及应收存货；金额单位未归一时，不计算现金利润比。',missing:'已接共享财报快照；来源同步不等于完成原文交叉核验。',counter:'利润增长但经营现金恶化，应收或存货持续占用资金。'},
 {id:'expectation',name:'价格预期',status:'需年度假设',summary:'价格要求怎样的盈利兑现',question:'当前价格是否包含过高预期？',check:'使用有日期的价格和明确盈利年度的EPS/PE情景，不把季报直接年化，也不把情景价值称为目标价。',missing:'当前没有绑定价格时点与年度盈利假设，暂不判断高估或低估。',counter:'价格隐含的增长显著超过可核验订单、利润和现金支持。'},
] as const;

export function OperatingDashboard({node,rows,pending,error,onRetry,onEvidence,onAssess}:{node:ResearchNode;rows:any[];pending:boolean;error:boolean;onRetry:()=>void;onEvidence:()=>void;onAssess:()=>void}){
 const [selected,setSelected]=useState<string>('cycle'),current=dimensions.find(d=>d.id===selected)!,id=useId(),reduced=useUiReducedMotion();
 const available=rows.filter(r=>r.summary?.income?.period||r.summary?.cashflow?.period||r.summary?.balance?.period);
 return <section className="semi-value-dashboard" aria-label="经营与价值看板">
  <header className="semi-value-heading"><div><h2>经营与价值 · {node.name}</h2><p>看产业是否兑现，不用短线行情替代经营判断。</p></div><button className="outline-button" onClick={onAssess}><ClipboardCheck size={16}/>准备四问研判</button></header>
  <div className="semi-dimension-grid">{dimensions.map(d=><button key={d.id} type="button" aria-pressed={selected===d.id} onClick={()=>setSelected(d.id)}>{selected===d.id&&<motion.span className="semi-value-indicator" layoutId={id} initial={false} transition={{duration:reduced?0:uiMotion.normal,ease:uiMotion.ease}}/>}<span className="semi-dimension-label">{d.name}</span><strong>{d.status}</strong><small>{d.summary}</small></button>)}</div>
  <section className="semi-signal-detail" aria-label={current.name+'核验'}><div><h3>{current.question}</h3><p>{current.check}</p></div><dl><div><dt>证据边界</dt><dd>{current.missing}</dd></div><div><dt>需要警惕</dt><dd>{current.counter}</dd></div></dl><button onClick={onEvidence} className="semi-text-action">核对事实与反证<ArrowUpRight size={14}/></button></section>
  <section className="semi-operating-receipts"><header><div><h3>公司兑现线索</h3><p>仅显示当前环节已纳入样本，不汇总为行业总量。</p></div><span>{available.length} / {node.codes.length} 家有三表快照</span></header>
   {error&&<div className="local-error" role="alert">共享资料读取失败，已有快照仍保留。<button onClick={onRetry}>重试共享资料</button></div>}
   {pending?<Skeleton label="公司经营证据"/>:available.length?<div className="semi-receipt-list">{available.map(row=>{const s=row.summary,i=s?.income,c=s?.cashflow;return <article key={row.code}><div className="semi-receipt-name"><StockLink code={row.code} name={row.name}/><small>{row.code}</small></div><dl><div><dt>收入同比</dt><dd>{pct(i?.revenueYoy)}</dd></div><div><dt>归母净利润同比</dt><dd>{pct(i?.profitYoy)}</dd></div></dl><div className="semi-receipt-period"><span>利润表 {i?.period||'未取得'}</span><span>现金流 {c?.period||'未取得'}</span><small>来源原值单位待核验</small></div>{safeSource(i?.url)&&<a target="_blank" rel="noopener noreferrer" href={safeSource(i.url)!}>来源<ArrowUpRight size={13}/></a>}</article>;})}</div>:!error?<p className="semi-inline-empty">当前环节尚无可展示的三表快照。保留研究结构，不以其他公司或示意数字补齐。</p>:null}
   <p className="semi-method-note">同比为来源同口径字段；没有可比期就留空。景气判断还需要行业总量、订单和价格证据，不能由几家公司或股价涨跌代替。</p>
  </section>
  <section className="semi-validation-strip"><FileText size={18}/><div><h3>持续验证</h3><p>{node.counter} 下一次沿财报、订单验收与现金回款复核；本页不会自动创建模型任务或提醒。</p></div></section>
 </section>;
}

export function ResearchBom({branch,onBranch}:{branch:BomBranch;onBranch:(value:BomBranch)=>void}){
 const [open,setOpen]=useState<string>(''),data=bomBranches[branch],reduced=useUiReducedMotion();
 return <section className="semi-bom" aria-label="研究级BOM">
  <header className="semi-value-heading"><div><h2>研究级 BOM · {data.name}</h2><p>先拆工艺和价值来源，再找企业兑现证据。</p></div><Segmented label="BOM工艺分支" value={branch} options={[["etch","刻蚀"],["deposition","薄膜沉积"]]} onChange={value=>{setOpen('');onBranch(value as BomBranch);}}/></header>
  <div className="semi-bom-context"><IndustryIcon kind={branch}/><div><h3>{data.description}</h3><p>{data.route}</p></div><a href={data.source} target="_blank" rel="noopener noreferrer">Lam Research 工艺说明<ArrowUpRight size={14}/></a></div>
  <p className="semi-method-note">工艺说明只支持功能框架，不是特定厂商的采购清单。金额、用量、国产化率与客户关系分别核验，不拼成示意百分比。</p>
  <div className="semi-bom-parts">{data.parts.map(part=><article key={branch+part.id} className={open===part.id?'is-open':''}><button type="button" className="semi-bom-part-trigger" aria-expanded={open===part.id} onClick={()=>setOpen(open===part.id?'':part.id)}><IndustryIcon kind={part.id}/><span><strong>{part.name}</strong><small>{part.role}</small></span><ChevronDown size={17} className={open===part.id?'rotated':''}/></button>{open===part.id&&<motion.section initial={reduced?false:{opacity:0,y:3}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:uiMotion.normal}} role="region" aria-label={part.name+' · 拆解依据'} className="semi-bom-part-detail"><dl><div><dt>需求来源</dt><dd>{part.demand}</dd></div><div><dt>用量与价值量</dt><dd>{part.quantity}</dd></div><div><dt>竞争与约束</dt><dd>{part.constraint}</dd></div><div><dt>持续验证</dt><dd>{part.validation}</dd></div></dl><div className="semi-bom-source"><a href={data.source} target="_blank" rel="noopener noreferrer">Lam Research · {data.name}工艺原文<ArrowUpRight size={14}/></a><p>来源支持工艺用途，不逐项证明零部件配置；拆解项为待核验框架。当前未绑定零部件供应商，不代表该公司已经向特定客户供货。</p></div></motion.section>}</article>)}</div>
  <footer className="semi-bom-footer"><span>结构版本 {SEMI_BOM_VERSION}</span><span>来源核对 2026-10-30；页面未提供发布日期</span></footer>
 </section>;
}
