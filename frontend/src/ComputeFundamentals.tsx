import {useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight,FileText,ChevronRight,Database} from 'lucide-react';
import {Drawer} from './components';
import {COMPUTE_ROOT,COOLING_ROOT} from './compute-directory';
import {computeFundamentalGroups,computeFundamentalSources,computeForecasts,computeFundamentalsRelease, type ComputeMetric} from './compute-fundamentals';
import './compute-fundamentals.css';

export default function ComputeFundamentals({compact=false}:{compact?:boolean}){
 const [selected,setSelected]=useState<ComputeMetric|null>(null);
 const source=selected?computeFundamentalSources[selected.source]:null;
 const cards=(metrics:ComputeMetric[])=><div className="compute-industry-kpis">{metrics.map(k=><article key={k.id} className={'compute-industry-kpi is-'+k.tone}>
  <div className="compute-metric-meta"><span>{k.kind}</span><span>{k.period.split(' / ')[0]}</span></div>
  <h3>{k.label}</h3><strong>{k.value}<small>{k.unit}</small></strong>
  <p className="compute-metric-change">{k.change}</p><p className="compute-metric-scope">{k.scope}</p>
  <button className="compute-metric-source" onClick={()=>setSelected(k)} aria-label={'查看'+k.label+'来源与同比'}><FileText size={14}/>{computeFundamentalSources[k.source].name}<ArrowUpRight size={13}/></button>
 </article>)}</div>;
 return <div className="compute-fundamentals">
  <section className="cr-panel" aria-label={compact?'算力产业关键指标':'算力产业基本面'}>
   <div className="cr-section-head"><div><h2>{compact?'算力产业关键指标':'产业基本面全景'}</h2><p>国内与全球、基础设施与服务消费分别观察，不以一家公司的财务代替全产业。</p></div>{compact&&<Link className="outline-button" to={COMPUTE_ROOT+'?section=fundamentals'}>查看全部行业指标<ChevronRight size={15}/></Link>}</div>
   <div className="compute-fundamental-stamp"><Database size={15}/><span>核对 {computeFundamentalsRelease.reviewedOn} · 资料覆盖 2025 年度 / 2026 二季度 · 低频公开资料快照</span></div>
   {compact?cards([computeFundamentalGroups[0].metrics[0],computeFundamentalGroups[1].metrics[3],computeFundamentalGroups[1].metrics[2],computeFundamentalGroups[2].metrics[1]]):<>
    {computeFundamentalGroups.map(g=><section className="compute-metric-group" key={g.id} aria-labelledby={'compute-group-'+g.id}><header><h2 id={'compute-group-'+g.id}>{g.title}</h2><p>{g.description}</p></header>{cards(g.metrics)}</section>)}
    <div className="compute-fundamental-reading"><strong>投入与需求扩张，交付与能耗仍需匹配</strong><p>服务器收入增长快于出货量，不能只把金额增长当作实物扩张。国内供给、AI 云应用和全球需求共同观察；这些指标支持产业跟踪，不直接确认每家公司受益。</p></div>
   </>}
  </section>
  {!compact&&<><section className="cr-panel compute-forecast-panel" aria-label="机构预测与情景"><div className="cr-section-head"><div><h2>机构预测与情景</h2><p>保留预测发布版本，单独展示，不与已发生数据合并；跨年倍数不是同比。</p></div><span className="cr-tag">预测，不是实际值</span></div>{cards(computeForecasts)}</section>
   <section className="cr-panel compute-fundamental-next"><div><h2>从产业需求继续下钻</h2><p>进入液冷研究，核对部件、系统、客户验证和公司利润现金。其他未完成研究的方向保持建设中。</p></div><Link className="outline-button" to={COOLING_ROOT}>进入液冷产业链<ChevronRight size={16}/></Link></section>
   <details className="compute-sources"><summary>统计口径与更新说明</summary><p>本页共用一个带版本的公开资料包；打开、切换和查看来源不重新抓取、不调用模型。指标随原机构月度、季度或年度披露低频核对，本版未接自动同步。更新需核验期间、单位和同口径基数后发布新版本，失败保留上版。全国智算利用率、全行业国产加速卡份额等尚无本版可核对的统一序列，未制造数字。</p><p>数据中心机架包含非 AI 机架；全部服务器与全部云基础设施服务不是纯 AI 市场；各金额有交叉，不能直接求和。来源仅给增速时不补造绝对量。</p></details></>}
  <p className="cr-caption">产业指标版本 {computeFundamentalsRelease.version} · 不改写液冷专题和公司报告的原研究日期</p>
  <Drawer open={!!selected} onOpenChange={open=>!open&&setSelected(null)} title="产业指标依据">{selected&&source&&<>
   <span className="cr-tag">{selected.kind}</span><h3>{selected.label}</h3><p className="compute-source-value">{selected.value} {selected.unit}</p>
   <dl className="compute-source-meta"><div><dt>统计期间 / 比较期间</dt><dd>{selected.period}</dd></div><div><dt>统计范围</dt><dd>{selected.scope}</dd></div><div><dt>同比与计算依据</dt><dd>{selected.basis}</dd></div><div><dt>原始来源 / 发布或修订日期</dt><dd>{source.name} · {source.title}<br/>{source.date}</dd></div><div><dt>本版核对日期</dt><dd>{computeFundamentalsRelease.reviewedOn}</dd></div></dl>
   <a className="outline-button" href={source.url} target="_blank" rel="noopener noreferrer">打开原始来源<ArrowUpRight size={15}/></a>
  </>}</Drawer>
 </div>;
}
