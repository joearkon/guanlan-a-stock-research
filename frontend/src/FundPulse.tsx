import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {RefreshCw} from 'lucide-react';
import {getJSON,number,pct,tone} from './api';
import {usePreferences} from './personal-preferences';
import {fundPulsePreview} from './monitor-navigation';
import StockLink from './StockLink';
import './fund-pulse.css';
const money=(n:any)=>typeof n==='number'&&Number.isFinite(n)?(n>0?'+':'')+number(n/10000):'—';
const stamp=(s:any)=>s?new Date(s).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未提供';
const titles:any={daily:'当日排行',pulse:'资金脉冲',ledger:'近5日台账',checkpoints:'时点快照'};
const kinds:any={industry:'行业',concept:'概念',stock:'个股'};
export function FundPulsePanel({data,error,refreshing=false,onRefresh,onKind,kind='stock'}:{data?:any,error?:string,refreshing?:boolean,onRefresh?:()=>void,onKind?:(k:string)=>void,kind?:string}){
 const [tab,setTab]=useState('daily'),[direction,setDirection]=useState('inflow'),[more,setMore]=useState(20),[selected,setSelected]=useState<any>(null);
 const pending=data?.status==='pending_source_validation',view=tab==='checkpoints'?selected?.data:data;
 const key=tab==='pulse'?(direction==='inflow'?'pulseIn':'pulseOut'):direction;
 const rows=tab==='ledger'?(data?.ledger?.rows||[]).slice(0,more):view?.ranks?.[key]||[];
 const subject=(r:any)=><span className="pulse-subject" title={r.name+' '+r.code}>{kind==='stock'?<StockLink code={r.code} name={r.name}/>:<strong>{r.name}</strong>}<small>{r.code}</small></span>;
 return <section className="fund-pulse-page">
  <header className="pulse-header"><div><h1>资金脉冲</h1><p>资金桶统计观察，不代表机构持仓或买卖信号</p></div>{onRefresh&&<button type="button" onClick={onRefresh} disabled={refreshing} className="outline-button"><RefreshCw size={15} className={refreshing?'spin':''}/>读取共享更新</button>}</header>
  <nav aria-label="资金范围" className="pulse-switch">{Object.entries(kinds).map(([k,label])=><button type="button" key={k} aria-pressed={kind===k} onClick={()=>{onKind?.(k);setSelected(null);setMore(20);}}>{label as string}</button>)}</nav>
  {error&&<p role="status" className="pulse-warning">读取失败，保留已读版本及排序。可手动重试；不会重新抓取市场。</p>}
  {pending?<>
   <div className="pulse-validation" role="status"><strong>数据验证中</strong><span>功能预览已开放；盘中源验收中，尚未开放排行。不展示未验收的资金数值，收盘探测不算真实盘中通过。</span></div>
   <nav aria-label="资金视图" className="pulse-switch pulse-tabs">{Object.entries(titles).map(([k,label])=><button type="button" key={k} aria-pressed={tab===k} onClick={()=>setTab(k)}>{label as string}</button>)}</nav>
   <section className="pulse-preview-content" aria-label={titles[tab]}>
    <h2>{kinds[kind]} · {titles[tab]}</h2>
    {(tab==='daily'||tab==='pulse')&&<div className="pulse-switch">{[['inflow','流入'],['outflow','流出']].map(([k,label])=><button type="button" key={k} aria-pressed={direction===k} onClick={()=>setDirection(k)}>{label}</button>)}</div>}
    {tab==='daily'&&<><h3>等待可核对的{direction==='inflow'?'流入':'流出'}排行</h3><p>按同源、同日主力净额正负值分别排序，全目录校验后取前10。不把行业与概念金额相加，不用行情涨幅推算资金。</p></>}
    {tab==='pulse'&&<><h3>等待有效采样基准</h3><p>相邻有效采样不足，暂不显示{direction==='inflow'?'流入':'流出'}变化。脉冲是同源净额的相邻差额，不是当日累计，也不跨午休或数据缺口补0。</p></>}
    {tab==='ledger'&&<><h3>等待已核验的收盘档案</h3><p>统计前5个完整交易日的流入／流出前10上榜天数与净额；今天未结束的数据不并入。不补造历史金额或上榜次数，缺档将单独标注。</p></>}
    {tab==='checkpoints'&&<><p>计划留档时点如下，均为北京时间；实际采集窗口和完成时间以回执为准，不用当前滚动数据倒填旧快照。</p><div className="pulse-checkpoints">{['午盘 · 11:30','下午 · 14:30','收盘就绪 · 15:05'].map(label=><div className="pulse-preview-checkpoint" key={label}><strong>{label}</strong><small>待验收</small></div>)}</div></>}
   </section>
   <p className="pulse-time">共享后台按交易日计划每30分钟采集，三个时点另存；页面切换不触发市场抓取。数据验收完成前不开放数值读取。</p>
   <details className="pulse-notes"><summary>口径、缺口与观察标签</summary><p>主力净额是来源按成交金额分桶估算的净买入额，不等同于真实新增资金。拟用东方财富行业、概念与个股资金资料；资金字段时间与关联行情更新时间不同，将分别说明。全部时刻按北京时间展示。</p><p>缺数据保留缺口，不当作0。缺少同源近5日价格依据时不生成高低切标签；标签仅作观察，不证明资金转移。</p></details>
  </>:!data?<div className="pulse-empty" role="status">{error?'资金资料暂不可用，可手动重试。':'正在读取共享资金资料…'}</div>:<>
   <div className="pulse-meta"><strong>{data.day} · {kinds[kind]}</strong><span>东方财富 · 主力净额 · 人民币</span><span>每{data.cadence_minutes??30}分钟采集（时点快照另存）</span><span>目录覆盖 {data.coverage?.received} / {data.coverage?.expected}</span><span>净额等字段缺失 {data.missing_count??data.missing?.length??0} 只</span>{data.stale&&<strong className="pulse-warning">旧快照，非当前实时</strong>}</div>
   <nav aria-label="资金视图" className="pulse-switch pulse-tabs">{Object.entries(titles).map(([k,label])=><button type="button" key={k} aria-pressed={tab===k} onClick={()=>setTab(k)}>{label as string}</button>)}</nav>
   <p className="pulse-time">采集窗口 {stamp(data.captured_at)} — {stamp(data.completed_at)}<br/>资金分钟参照 {stamp(data.anchor?.source_at)}（仅代表校验样本）；榜单未单独提供每只标的的资金时间，行情更新时间另列。版本 {data.version?.slice(0,12)}</p>
   {tab==='checkpoints'&&<div className="pulse-checkpoints">{[['lunch','午盘'],['1430','14:30'],['close','收盘就绪']].map(([id,label])=>{const item=data.checkpoints?.find((c:any)=>c.stage===id);return <button type="button" key={id} disabled={!item} aria-pressed={selected?.stage===id} onClick={()=>setSelected(item)}><strong>{label}</strong><small>{item?stamp(item.completed_at):'未留档'}</small></button>;})}</div>}
   {(tab!=='checkpoints'||selected)&&<>
    {tab==='checkpoints'&&selected&&<p className="pulse-time">所选留档：{selected.data?.day} · 实际采集完成 {stamp(selected.completed_at)}；不是当前滚动快照。</p>}
    {tab==='ledger'?<><p className="pulse-time">前5个完整交易日：{data.ledger?.days?.join('、')||'日历待核验'}；今日未完成数据不并入。</p>{data.ledger?.missing_days?.length>0&&<p className="pulse-warning">缺档：{data.ledger.missing_days.join('、')}；完整合计留空，已收录金额另列。</p>}</>:<div className="pulse-ranking-head"><div className="pulse-switch">{[['inflow','流入'],['outflow','流出']].map(([k,label])=><button type="button" key={k} aria-pressed={direction===k} onClick={()=>setDirection(k)}>{label}</button>)}</div><span>{tab==='pulse'?`相邻有效采样${data.interval_seconds?' · '+number(data.interval_seconds/60,1)+'分钟':' · 等待基准'}，不等于当日累计`:'当日累计可用净额前10；全目录排序后取榜，不叠加行业与概念'}</span></div>}
    <div className="pulse-table-wrap"><table><thead><tr><th>名称 / 代码</th>{tab==='ledger'?<><th>流入 / 流出上榜</th><th>近5日净额 / 万元</th></>:<><th>{tab==='pulse'?'相邻采样净额变化 / 万元':'当日主力净额 / 万元'}</th><th>涨跌幅</th></>}</tr></thead><tbody>{rows.map((r:any)=><tr key={r.id}><td>{subject(r)}</td>{tab==='ledger'?<><td>{r.inflow_days} / {r.outflow_days} 日</td><td><span className={tone(r.net)}>{money(r.net)}</span>{r.net===null&&<small>已收录 {money(r.recorded_net)}</small>}</td></>:<><td className={tone(tab==='pulse'?r.pulse:r.net)}>{money(tab==='pulse'?r.pulse:r.net)}</td><td className={tone(r.pct)}>{pct(r.pct)}</td></>}</tr>)}</tbody></table></div>
    {!rows.length&&<p className="pulse-empty">暂无可核对记录；不代表该方向没有资金活动。</p>}
    {tab==='ledger'&&more<(data.ledger?.rows?.length||0)&&<button type="button" className="outline-button pulse-load" onClick={()=>setMore(n=>n+20)}>继续查看台账</button>}
   </>}
   <details className="pulse-notes"><summary>口径、缺口与观察标签</summary><p>主力净额是来源按成交金额分桶估算的净买入额，不等同于真实新增资金。行业层级及概念成分可能重叠，不能相加成全市场金额。流入与流出取同源同日累计正负值；脉冲取相邻有效采样之差，不跨午休或缺口补0。页面阅读不自动重排，更新需点击读取。</p><p>近5日台账按每日收盘可用净额前10计数，一天同方向最多1次；来源缺档和净额缺失不补造。缺少同源近5日价格依据时不生成高低切标签；标签仅用于观察，不证明资金转移。</p>{(data.missing||[]).map((r:any)=><p key={r.id}>{r.name} {r.code}：{r.missing?.join('、')} 缺失</p>)}</details>
  </>}
 </section>;
}
export default function FundPulse({preview=fundPulsePreview}:{preview?:boolean}={}){
 const {account}=usePreferences(),[kind,setKind]=useState('stock');
 const q=useQuery({queryKey:['fund-pulse',account,kind],queryFn:({signal})=>getJSON('/api/data/fund-pulse?kind='+kind,signal),enabled:!preview&&account!=='guest',retry:false,refetchOnWindowFocus:false,refetchOnReconnect:false,refetchInterval:false});
 return <FundPulsePanel key={kind} data={preview?{status:'pending_source_validation'}:q.data} error={preview?undefined:q.error?.message} refreshing={!preview&&q.isFetching} onRefresh={preview?undefined:()=>q.refetch()} kind={kind} onKind={setKind}/>;
}
