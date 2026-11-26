import {useQuery} from '@tanstack/react-query';
import {Drawer,LocalRefresh} from './components';import {getJSON,number,pct} from './api';
import './structure-evidence.css';
import Pattern15Evidence,{Pattern15Receipt,Pattern15Cell,isPattern15,type PatternKind} from './Pattern15Evidence';
export type StructureTarget={code:string;name:string;day:string;model:string;kind?:PatternKind};
export const structureNames={turning:'转强观察',breakout:'突破确认','second-wave':'前强二波','high-divergence':'高位分歧观察'};
const missingNames={history_60_sessions:'连续60个交易日历史不足（含新股或停牌缺档）',prices_or_adjustment:'日线价格或复权因子缺失',trading_calendar:'交易日历未核验',same_day_session:'缺少同日交易日资料',duplicate_session:'日线日期重复',daily_identity:'日线日期异常'};
const date=(value:any)=>value?new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未留存';
export function StructureReceipt({data}:{data:any}){
 if(!data?.criteria?.structure)return null;const s=data.structure;
 if(isPattern15(data.criteria.structure))return <Pattern15Receipt data={data}/>;
 return <div className="structure-receipt" role="status">{!s||s.status!=='ready'?<><strong>结构历史准备中</strong><span>{s?`已收录 ${s.availableSessions??0} / ${s.targetSessions??80} 个交易日批次；`:''}需连续60个已完成交易日及复权资料。缺数据不代表全市场没有符合结构。</span></>:<><strong>低位转强 · {structureNames[data.criteria.structure]} · 测试</strong><span>截至 {data.day} 收盘 · 可核对 {s.attached??s.readyRows} / {s.expectedRows} 只 · 缺数据 {s.missing??s.missingRows} 只 · 非盘中信号</span></>}<details><summary>结构口径与来源</summary><p>{s?.source||'来源待核验'} · 至少60个连续交易日 · 前复权。</p><p>共享后台准备；不因浏览或筛选重复抓取。低点需后续2个已完成交易日确认，不倒填当时可知的信号。</p></details></div>;
}
export function StructureCell({row,onOpen,kind}:{row:any;onOpen:()=>void;kind?:string}){
 if(isPattern15(kind))return <Pattern15Cell row={row} kind={kind} onOpen={onOpen}/>;
 const s=row.structure,stage=s?.signals?.turning?'转强观察':s?.signals?.breakout?'突破确认':s?.status==='ready'?'未满足结构':'缺结构数据';
 return <div className="structure-cell"><strong>{stage}</strong>{s?.signals?.turning||s?.signals?.breakout?<small>突破参考 {number(s.breakoutLevel)} · 距5日线 {pct(s.distanceMa5Pct)}</small>:null}<button type="button" className="outline-button" aria-label={'查看'+row.name+'结构依据'} onClick={onOpen}>依据</button></div>;
}
export default function StructureEvidence({target,onClose}:{target:StructureTarget|null;onClose:()=>void}){
 if(target?.kind)return <Pattern15Evidence target={{...target,kind:target.kind}} onClose={onClose}/>;
 return <LegacyStructureEvidence target={target} onClose={onClose}/>;
}
function LegacyStructureEvidence({target,onClose}:{target:StructureTarget|null;onClose:()=>void}){
 const url=target?'/api/data/stock-observation?'+new URLSearchParams({mode:'close',structureDetail:target.code,model:target.model}):'';
 const q=useQuery({queryKey:['structure-evidence',url],enabled:!!target,retry:false,queryFn:async({signal})=>{const b=await getJSON(url,signal);if(b.code!==target?.code||b.model!==target?.model||b.day!==target?.day)throw Error('结构依据版本不一致，请返回结果重新读取');return b;}});
 const b=q.data,s=b?.structure,p=b?.parameters;
 return <Drawer title="低位转强 · 结构依据" className="structure-drawer" open={!!target} onOpenChange={v=>{if(!v)onClose();}}><p><strong>{target?.name} · {target?.code}</strong></p><p className="provenance">资料截止 {target?.day} 收盘 · 固定版本 {target?.model.slice(0,8)} · 非当前实时</p><LocalRefresh label="结构依据" loading={q.isPending} busy={false}>{q.error?<div role="alert"><p>{q.error.message}；原结果保留，不自动重取市场。</p><button type="button" className="outline-button" onClick={()=>q.refetch()}>重试读取依据</button></div>:b&&<>
 {b.status!=='ready'?<div className="structure-receipt"><strong>结构资料不足</strong><span>{(s?.missing||[]).map((k:string)=>missingNames[k]||k).join('、')||'本批连续历史、复权资料或同日报价未核验；不借旧日数据补造。'}</span></div>:<><div className="structure-stage">{s.signals.turning?'转强观察':s.signals.breakout?'突破确认':'未满足结构条件'}</div><dl className="structure-evidence-grid"><div><dt>前低</dt><dd>{number(s.baseLow?.price)}</dd><small>{s.baseLow?.day||'未形成'} · 确认 {s.baseLow?.confirmedOn||'未形成'}</small></div><div><dt>抬高低点</dt><dd>{number(s.higherLow?.price)}</dd><small>{s.higherLow?.day||'未形成'} · 确认 {s.higherLow?.confirmedOn||'未形成'}</small></div><div><dt>区间突破参考</dt><dd>{number(s.breakoutLevel)}</dd><small>收盘需超过此值1%；不是目标价</small></div><div><dt>结构失效参考</dt><dd>{number(s.invalidationLevel)}</dd><small>较近确认低点；不是自动止损指令</small></div><div><dt>距5日均线</dt><dd>{pct(s.distanceMa5Pct)}</dd><small>MA5 {number(s.ma5)} · MA10 {number(s.ma10)}</small></div><div><dt>规则突破日期</dt><dd>{s.breakoutOn||'尚未突破'}</dd><small>只用截至所选日的已完成资料</small></div></dl><dl className="structure-discovery"><div><dt>本窗口逐日回放首次满足</dt><dd>{s.windowFirstMet||'窗口内未留存'}</dd></div><div><dt>平台首次收录（北京时间）</dt><dd>{date(s.firstRecordedAt)}</dd></div></dl><p className="provenance">回放首次满足只针对当前留存窗口、同一组低点，不是全历史首次，也不等于平台当日已经发现。平台收录可以晚于资料截止日。</p></>}
 <p className="structure-warning">这是固定规则的结构观察，不是买入信号。突破不等于回踩确认，也不保证趋势反转；可打开股票行情进一步核对，行情日期与本结构截止日分别标注。</p><details><summary>规则、复权与缺数据</summary><p>来源 {b.source||'未提供'} · 规则 {p?.version||'未提供'}。至少60个连续已完成交易日日线；价格按所选收盘日复权因子统一为前复权。</p><p>最近35日内取已确认低点，低点左右各需2个已完成交易日；两低点至少间隔5个交易日，后低至少抬高1%。前段回落至少10%，当前处于60日价格区间下方65%内；收盘高于5／10日均线且5日线向上。</p><p>观察阶段尚未收盘越过区间阻力1%；突破阶段需最近5个交易日内首次收盘越过并维持。距前低不超过40%、距10日线不超过18%；不要求涨停，成交量仅辅助核对，不补造量能。历史、复权、报价或日历缺失单列；与其他均线／MACD条件组合时，任一条件缺项仍需核对。</p><p>拐点确认、窗口回放均不读取未来日期。规则仅为测试版启发式，不是收益模型。</p></details>
 </>}</LocalRefresh></Drawer>;
}
