import StockLink from './StockLink';
import StockAssociations from './StockAssociations';
import {Link} from 'react-router-dom';
import {Widget,Skeleton} from './components';
import SmartTable from './SmartTable';
import {number,pct,tone} from './api';
import {safeSource} from './urls';
import {useState,lazy,Suspense} from 'react';
import {stockEvents} from './stock-events';
const BenchmarkComparison=lazy(()=>import('./BenchmarkComparison'));
function Source({value}:{value:any}){const url=safeSource(value?.sourceUrl);return <p className="provenance">{value?.source||'来源未提供'} · 数据 {value?.asof||'未提供'}{url&&<> · <a href={url} target="_blank" rel="noopener noreferrer">核验来源</a></>}</p>;}
export function StockSector({deep,code}:{deep:any,code?:string}){
 const s=deep?.industry,[compare,setCompare]=useState(false);
 return <><Widget title="板块协同" subtitle="仅比较可核验的同日行情，不作交易裁决">{s?<><div className="stat-grid"><article className="stat"><small>申万一级行业</small><strong>{s.name}</strong><span>归属日期 {s.classificationAsOf}</span></article><article className="stat"><small>行业等权涨跌</small><strong className={tone(s.changePct)}>{pct(s.changePct)}</strong><span>{s.asof}</span></article><article className="stat"><small>个股减行业 · 百分点</small><strong className={tone(s.excessOneDay)}>{s.excessOneDay==null?'—':number(s.excessOneDay)}</strong><span>{s.excessOneDay==null?'未取得同日可比数据':'同日涨跌幅之差，非复合超额收益'}</span></article></div><p className="provenance">个股报价日期 {s.stockDate||'未提供'}；分类日期与行情日期分别保留。板块等权统计不等于行业指数。</p><SmartTable headers={['行业上涨家数','行业下跌家数','篮子涨幅最高股']} rows={[[s.up==null?'未提供':s.up,s.down==null?'未提供':s.down,s.leader?<StockLink code={s.leader.code} name={s.leader.name}>{s.leader.name} {pct(s.leader.pct)}</StockLink>:'未提供']]}/><Source value={s}/><Link className="outline-button" to={'/market-observation?board='+encodeURIComponent(s.code)+'#sector'}>查看行业板块</Link></>:<p className="empty">尚未取得可核验的个股行业归属和板块统计；不根据名称猜测行业。</p>}</Widget>{code?<StockAssociations code={code}/>:<Widget title="概念与其他归属" subtitle="行业、概念和地域分类不可混为同一种题材"><p className="empty">尚无带分类类型和有效日期的完整个股概念序列；不扫描全市场板块，不把无日期的关联涨幅当成实时行情。</p><p className="provenance">3/10/30日行业与沪深300超额收益需要同日期、同复权序列；缺序列时不拼接或估算。</p></Widget>}{code&&(compare?<Suspense fallback={<Skeleton label="同日基准比较"/>}><BenchmarkComparison code={code}/></Suspense>:<Widget title="区间相对行情"><button className="outline-button" onClick={()=>setCompare(true)}>按需对比沪深300</button><p className="provenance">点击后才加载同日基准序列，不影响上方板块与其他标签。</p></Widget>)}</>;
}
export function StockFunds({deep}:{deep:any}){
 const f=deep?.funds;
 return <Widget title="资金成交" subtitle="保留提供方原始指标与周期，不混算不同来源">{f?<><div className="stat-grid"><article className="stat"><small>{f.metric} · {f.period}</small><strong className={tone(f.valueYi)}>{number(f.valueYi)} 亿元</strong><span>{f.status==='stale'?'历史缓存 · 待来源更新':'来源已返回 · 以数据日期为准'}</span></article></div><Source value={f}/><SmartTable headers={['交易日期',f.metric+'（亿元）']} rows={(f.daily||[]).map((x:any)=>[x.date,x.valueYi==null?'未提供':<span className={tone(x.valueYi)}>{number(x.valueYi,4)}</span>])}/><p className="provenance">每日值由源人民币金额换算亿元；期间值保留来源汇总精度。空值不等于零；资金流估算不是账户实际买卖。</p></>:<p className="empty">尚未取得有日期和口径的资金成交资料；不能据此认定没有资金流入或流出。</p>}</Widget>;
}
export function StockEvents({evidence,onInspect}:{evidence:any[],onInspect:(id:string)=>void}){
 const [kind,setKind]=useState('all'),[search,setSearch]=useState(''),events=stockEvents(evidence,kind,search);
 return <Widget title="事件时间线" subtitle="公告与新闻分别标识；时间先后不代表价格因果"><div className="question-bar"><label>资料类型<select value={kind} onChange={e=>setKind(e.target.value)}>{[['all','全部'],['announcement','公告原文线索'],['news','新闻'],['earn','业绩'],['holder','股东动态'],['buyback','回购'],['survey','机构调研']].map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label><label>关键词<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="标题、摘要或来源"/></label></div><div className="stock-timeline">{events.map(e=><article key={e.id}><time>{e.dataDate}</time><div><button className="text-button" onClick={()=>onInspect(e.id)}>{e.title}</button><p className="stock-prose">{e.summary||'未取得摘要'}</p><p className="provenance">{e.kind==='news'?'新闻线索':'披露资料'} · {e.source||'来源未提供'} · {e.status||'时效待核验'}</p>{safeSource(e.sourceUrl)&&<a href={safeSource(e.sourceUrl)!} target="_blank" rel="noopener noreferrer">查看原文</a>}</div></article>)}</div>{!events.length&&<p className="empty">当前来源和筛选范围内暂无带有效日期的事件；不代表该公司没有新公告。</p>}<p className="provenance">标题与摘要不是全文核验。缺原文、来源失败和本轮无匹配结果，请查看“资料刷新状态”；研究记录不会自动改写为公告事实。</p></Widget>;
}
