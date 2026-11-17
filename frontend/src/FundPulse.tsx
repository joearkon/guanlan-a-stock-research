import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {RefreshCw} from 'lucide-react';
import {getJSON,number,pct,tone} from './api';
import {usePreferences} from './personal-preferences';
import {fundPulsePreview} from './monitor-navigation';
import StockLink from './StockLink';
import {LocalRefresh,Skeleton} from './components';
import {FundSpark,FundTrendDrawer,type FundTarget} from './FundTrend';
import './fund-pulse.css';
const money=(n:any)=>typeof n==='number'&&Number.isFinite(n)?(n>0?'+':'')+number(n/10000):'—';
const stamp=(s:any)=>s?new Date(s).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未提供';
const titles:any={daily:'当日排行',pulse:'资金脉冲',checkpoints:'时点快照'};
const kinds:any={industry:'行业',concept:'概念'};
function checkedSnapshot(value:any,kind:string){
 if(value?.kind===kind&&value.status==='pending_source_validation')return value;
 if(value?.kind!==kind||value.status!=='archived_snapshot'||value.schema!==1||value.provider!=='eastmoney'||value.not_realtime!==true||!/^\d{4}-\d{2}-\d{2}$/.test(value.day)||!/^[a-f0-9]{64}$/.test(value.version)||!Number.isFinite(Date.parse(value.captured_at))||!Number.isFinite(Date.parse(value.completed_at))||!value.coverage?.complete||!Number.isInteger(value.coverage.expected)||value.coverage.received!==value.coverage.expected||!['inflow','outflow','pulseIn','pulseOut'].every(k=>Array.isArray(value.ranks?.[k])&&value.ranks[k].length<=10))throw Error('资金快照格式未核验');
 return value;
}
function SnapshotState({data}:{data:any}){
 const [now,setNow]=useState(Date.now);useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),60000);return ()=>clearInterval(timer);},[]);
 const end=Date.parse(data.completed_at),expired=Number.isFinite(end)&&(now-end>((data.cadence_minutes??30)+5)*60000||new Date(now+28800000).toISOString().slice(0,10)!==data.day);
 return <div className="pulse-validation pulse-snapshot-status" role="status"><strong>已采集快照 · 非实时</strong><span><b>{expired?'已过期':'采样时点快照'}</b> · {data.validation?.qualified?'本类资金源已通过独立验收':'盘中连续性待验收'}。以下金额仅对应原采集窗口，不代表当前资金；过期后仍保留原时间和原值。</span></div>;
}
export function FundPulsePanel({data,error,refreshing=false,onRefresh,onKind,kind='stock'}:{data?:any,error?:string,refreshing?:boolean,onRefresh?:()=>void,onKind?:(k:string)=>void,kind?:string}){
 const [tab,setTab]=useState('daily'),[direction,setDirection]=useState('inflow'),[selected,setSelected]=useState<any>(null);
 const [metric,setMetric]=useState('net'),[search,setSearch]=useState(''),[board,setBoard]=useState(''),[target,setTarget]=useState<FundTarget|null>(null);
 const retainedRef=useRef<HTMLDivElement>(null),widthRef=useRef(0),[retainedHeight,setRetainedHeight]=useState(560);
 useEffect(()=>{setTab('daily');setDirection('inflow');setSelected(null);setMetric('net');setSearch('');setBoard('');setTarget(null);},[kind]);
 useLayoutEffect(()=>{const element=retainedRef.current;if(!element)return;const measure=()=>{const rect=element.getBoundingClientRect(),widthChanged=Math.abs(rect.width-widthRef.current)>1;widthRef.current=rect.width;setRetainedHeight(prior=>Math.max(560,widthChanged?Math.ceil(rect.height):Math.max(prior,Math.ceil(rect.height))));};measure();if(typeof ResizeObserver==='undefined')return;const observer=new ResizeObserver(measure);observer.observe(element);return ()=>observer.disconnect();},[tab,kind,data,error]);
 if(data?.kind&&data.kind!==kind)data={status:'pending_source_validation',kind};
 const history=!!data?.trend?.model,pending=data?.status==='pending_source_validation',archived=data?.status==='archived_snapshot',waitingArchived=archived&&tab==='pulse'&&!history,view=tab==='checkpoints'?selected?.data:data,displayTitles=archived?{...titles,daily:'快照排行'}:titles;
 const delta=tab==='pulse'&&(!history||metric==='change'),showTrend=history&&tab!=='checkpoints';
 const key=delta?(direction==='inflow'?'pulseIn':'pulseOut'):direction;
 const rows=view?.ranks?.[key]||[];
 const choices=(data?.trend?.directory||[]).filter((r:any)=>(r.name+' '+r.code).toLowerCase().includes(search.trim().toLowerCase()));
 const openTrend=(r:any)=>setTarget({kind,code:r.code,name:r.name,model:data.trend.model});
 const subject=(r:any)=><span className="pulse-subject" title={r.name+' '+r.code}>{kind==='stock'?<StockLink code={r.code} name={r.name}/>:<strong>{r.name}</strong>}<small>{r.code}</small></span>;
 return <section className="fund-pulse-page">
  <header className="pulse-header"><div><h1>资金脉冲 <small className="pulse-beta">Beta（测试）</small></h1><p>资金桶统计观察，不代表机构持仓或买卖信号</p></div>{onRefresh&&<button type="button" onClick={onRefresh} disabled={refreshing} className="outline-button"><RefreshCw size={15} className={refreshing?'spin':''}/>读取共享更新</button>}</header>
  <nav aria-label="资金范围" className="pulse-switch">{Object.entries(kinds).map(([k,label])=><button type="button" key={k} aria-pressed={kind===k} onClick={()=>{onKind?.(k);setSelected(null);}}>{label as string}</button>)}</nav>
  {error&&<p role="status" className="pulse-warning">读取失败，保留已读版本及排序。可手动重试；不会重新抓取市场。</p>}
  <div className="pulse-retained" style={{minHeight:retainedHeight}}><LocalRefresh label={'资金'+(kinds[kind]||'资料')} busy={refreshing&&!!data} loading={!data&&!error}><div ref={retainedRef} className="pulse-retained-content">
  {pending?<>
   <div className="pulse-validation" role="status"><strong>数据验证中</strong><span>{data.reason?`${kinds[kind]}尚无可展示的完整快照，取数排查中；不影响其他类别查看。盘中源验收中，不借其他类别或旧日数据补造。`:'功能预览已开放；盘中源验收中，尚未开放排行。不展示未验收的资金数值，收盘探测不算真实盘中通过。'}</span></div>
   <nav aria-label="资金视图" className="pulse-switch pulse-tabs">{Object.entries(titles).map(([k,label])=><button type="button" key={k} aria-pressed={tab===k} onClick={()=>setTab(k)}>{label as string}</button>)}</nav>
   <section className="pulse-preview-content" aria-label={titles[tab]}>
    <h2>{kinds[kind]} · {titles[tab]}</h2>
    {(tab==='daily'||tab==='pulse')&&<div className="pulse-switch">{[['inflow','流入'],['outflow','流出']].map(([k,label])=><button type="button" key={k} aria-pressed={direction===k} onClick={()=>setDirection(k)}>{label}</button>)}</div>}
    {tab==='daily'&&<><h3>等待可核对的{direction==='inflow'?'流入':'流出'}排行</h3><p>按同源、同日主力净额正负值分别排序，全目录校验后取前10。不把行业与概念金额相加，不用行情涨幅推算资金。</p></>}
    {tab==='pulse'&&<><h3>等待有效采样基准</h3><p>相邻有效采样不足，暂不显示{direction==='inflow'?'流入':'流出'}变化。脉冲是同源净额的相邻差额，不是当日累计，也不跨午休或数据缺口补0。</p></>}
    {tab==='checkpoints'&&<><p>计划留档时点如下，均为北京时间；实际采集窗口和完成时间以回执为准，不用当前滚动数据倒填旧快照。</p><div className="pulse-checkpoints">{['午盘 · 11:30','下午 · 14:30','收盘就绪 · 15:05'].map(label=><div className="pulse-preview-checkpoint" key={label}><strong>{label}</strong><small>待验收</small></div>)}</div></>}
   </section>
   <p className="pulse-time">共享后台按交易日计划每30分钟采集，三个时点另存；页面切换不触发市场抓取。数据验收完成前不开放数值读取。</p>
   <details className="pulse-notes"><summary>口径、缺口与观察标签</summary><p>主力净额是来源按成交金额分桶估算的净买入额，不等同于真实新增资金。拟用东方财富行业、概念与个股资金资料；资金字段时间与关联行情更新时间不同，将分别说明。全部时刻按北京时间展示。</p><p>缺数据保留缺口，不当作0。缺少同源近5日价格依据时不生成高低切标签；标签仅作观察，不证明资金转移。</p></details>
  </>:!data?error?<div className="pulse-empty" role="status">资金资料暂不可用，可手动重试。</div>:<Skeleton label={'资金'+(kinds[kind]||'资料')} kind="table"/>:<>
   {archived&&<SnapshotState data={data}/>}
   <div className="pulse-meta"><strong>{data.day} · {kinds[kind]}</strong><span>东方财富 · 主力净额 · 人民币</span><span>计划每{data.cadence_minutes??30}分钟采集（时点快照另存，不保证每批成功）</span><span>目录覆盖 {data.coverage?.received} / {data.coverage?.expected}</span><span>净额等字段缺失 {data.missing_count??data.missing?.length??0} 项</span>{!archived&&data.stale&&<strong className="pulse-warning">旧快照，非当前实时</strong>}</div>
   {archived&&<p className="pulse-warning">资金净额缺失 {data.net_missing_count??0} 项，不参与净额排序；仅对 {data.net_available_count??0} 项可用净额排名，缺失不当作0。行业和概念可能重叠，不相加。</p>}
   <nav aria-label="资金视图" className="pulse-switch pulse-tabs">{Object.entries(displayTitles).map(([k,label])=><button type="button" key={k} aria-pressed={tab===k} onClick={()=>setTab(k)}>{label as string}</button>)}</nav>
   {showTrend&&<div className="fund-trend-tools"><label>查找行业 / 概念<input value={search} onChange={e=>{setSearch(e.target.value);setBoard('');}} placeholder="如：半导体、光刻胶"/></label><label>已收录目录<select value={board} onChange={e=>setBoard(e.target.value)}><option value="">选择板块（{choices.length}）</option>{choices.map((r:any)=><option key={r.code} value={r.code}>{r.name} · {r.code}</option>)}</select></label><button type="button" className="outline-button" disabled={!board} onClick={()=>{const r=choices.find((r:any)=>r.code===board);if(r)openTrend(r);}}>查看趋势</button></div>}
   {history&&tab==='pulse'&&<div className="pulse-switch fund-metric-switch" aria-label="榜单指标">{[['net','累计净额'],['change','相邻变化']].map(([k,label])=><button key={k} type="button" aria-pressed={metric===k} disabled={k==='change'&&!data.trend.change_available} onClick={()=>setMetric(k)}>{label}</button>)}</div>}
   <p className="pulse-time">采集窗口 {stamp(data.captured_at)} — {stamp(data.completed_at)}<br/>资金分钟参照 {stamp(data.anchor?.source_at)}（仅代表校验样本）；榜单未单独提供每只标的的资金时间，行情更新时间另列。版本 {data.version?.slice(0,12)}</p>
   {archived&&<p className="pulse-time">全部时刻为北京时间。接收归档 {stamp(data.received_at)}；关联行情时间 {stamp(data.quote_range?.oldest)} — {stamp(data.quote_range?.newest)}，不是资金字段独立更新时间。页面读取与切换不抓取市场，金额不自动重排。</p>}
   {waitingArchived&&<p className="pulse-empty" role="status">等待两次已验收、同源同日且间隔有效的完整采样；当前快照不能生成资金脉冲。</p>}
   {tab==='checkpoints'&&<div className="pulse-checkpoints">{[['lunch','午盘'],['1430','14:30'],['close','收盘就绪']].map(([id,label])=>{const item=data.checkpoints?.find((c:any)=>c.stage===id);return <button type="button" key={id} disabled={!item} aria-pressed={selected?.stage===id} onClick={()=>setSelected(item)}><strong>{label}{item&&<span className="pulse-checkpoint-state">已收录</span>}</strong><small>{item?stamp(item.completed_at):'未留档'}</small></button>;})}</div>}
   {!waitingArchived&&(tab!=='checkpoints'||selected)&&<>
    {tab==='checkpoints'&&selected&&<p className="pulse-time">所选留档：{selected.data?.day} · 实际采集完成 {stamp(selected.completed_at)}；不是当前滚动快照。</p>}
    <div className="pulse-ranking-head"><div className="pulse-switch">{[['inflow','流入'],['outflow','流出']].map(([k,label])=><button type="button" key={k} aria-pressed={direction===k} onClick={()=>setDirection(k)}>{label}</button>)}</div><span>{delta?`相邻有效采样${data.interval_seconds?' · '+number(data.interval_seconds/60,1)+'分钟':''}，不等于当日累计或该时段真实新增资金`:archived?'快照时点累计净额前10（仅可用数据），不是当前实时排行':'当日累计可用净额前10；全目录排序后取榜，不叠加行业与概念'}</span></div>
    {showTrend&&<p className="pulse-time">折线为当日累计净额历史 · {data.trend.samples}批 · 实际完成时间（北京时间）。漏采、缺值与午休断线；点击查看大图和相邻差值。窄屏可横滑表格查看趋势列。</p>}
    <div className={'pulse-table-wrap'+(showTrend?' pulse-has-trend':'')}><table><thead><tr><th>名称 / 代码</th><th>{delta?'相邻采样净额变化 / 万元':archived?'快照主力净额 / 万元':'当日主力净额 / 万元'}</th><th>{archived?'快照涨跌幅':'涨跌幅'}</th>{showTrend&&<th>累计趋势</th>}</tr></thead><tbody>{rows.map((r:any)=><tr key={r.id}><td>{subject(r)}</td><td className={tone(delta?r.pulse:r.net)}>{money(delta?r.pulse:r.net)}</td><td className={tone(r.pct)}>{pct(r.pct)}</td>{showTrend&&<td><FundSpark points={r.trend?.points||[]} name={r.name} onClick={()=>openTrend(r)}/></td>}</tr>)}</tbody></table></div>
    {!rows.length&&<p className="pulse-empty">暂无可核对记录；不代表该方向没有资金活动。</p>}
   </>}
   <details className="pulse-notes"><summary>口径、缺口与观察标签</summary><p>主力净额是来源按成交金额分桶估算的净买入额，不等同于真实新增资金。行业层级及概念成分可能重叠，不能相加成全市场金额。流入与流出取同源同日累计正负值；脉冲取相邻有效采样之差，不跨午休或缺口补0。页面阅读不自动重排，更新需点击读取。</p><p>缺少同源近5日价格依据时不生成高低切标签；标签仅用于观察，不证明资金转移。</p>{(data.missing||[]).map((r:any)=><p key={r.id}>{r.name} {r.code}：{r.missing?.join('、')} 缺失</p>)}</details>
  </>}
  </div></LocalRefresh></div>
 <FundTrendDrawer target={target} onClose={()=>setTarget(null)}/>
 </section>;
}
export default function FundPulse({preview=fundPulsePreview}:{preview?:boolean}={}){
 const {account}=usePreferences(),[kind,setKind]=useState('industry');
 const q=useQuery({queryKey:['fund-pulse',account,kind],queryFn:async({signal})=>checkedSnapshot(await getJSON('/api/data/fund-pulse?kind='+kind,signal),kind),enabled:!preview&&account!=='guest',retry:false,refetchOnWindowFocus:false,refetchOnReconnect:false,refetchInterval:false});
 return <FundPulsePanel data={preview?{status:'pending_source_validation'}:q.data} error={preview?undefined:q.error?.message} refreshing={!preview&&q.isFetching} onRefresh={preview?undefined:()=>q.refetch()} kind={kind} onKind={setKind}/>;
}
