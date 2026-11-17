import {lazy,Suspense,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {getJSON,number,tone} from './api';
import {usePreferences} from './personal-preferences';
import {Skeleton,Drawer} from './components';
import {clock,reasonText,sparkPaths,type FundPoint} from './fund-trend-data';
const Chart=lazy(()=>import('./FundTrendChart'));
export type FundTarget={kind:string,code:string,name:string,model:string};
const amount=(n:any)=>typeof n==='number'&&Number.isFinite(n)?(n>0?'+':'')+number(n/10000):'—';
export function FundSpark({points,name,onClick}:{points:FundPoint[],name:string,onClick:()=>void}){
 const p=sparkPaths(points);return <button type="button" className="fund-spark" aria-label={'查看'+name+'资金趋势'} onClick={onClick}><svg viewBox="0 0 112 40" aria-hidden="true"><line x1="4" x2="108" y1={p.zero} y2={p.zero} className="fund-spark-zero"/>{p.segments.map((d,i)=><path key={i} d={d}/>)}{p.dots.map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r="1.8"/>)}</svg><span>{p.dots.length>1?'查看趋势':p.dots.length?'单点快照':'暂无采样'}</span></button>;
}
function TrendContent({target}:{target:FundTarget}){
 const {account}=usePreferences(),[metric,setMetric]=useState<'net'|'change'>('net');
 const q=useQuery({queryKey:['fund-trend',account,target.kind,target.code,target.model],queryFn:async({signal})=>{
  const d=await getJSON('/api/data/fund-pulse?'+new URLSearchParams({kind:target.kind,view:'trend',code:target.code,model:target.model}),signal);
  if(d?.schema!==1||d.model!==target.model||d.kind!==target.kind||d.series?.code!==target.code||d.time_basis!=='capture_completed_beijing'||!Array.isArray(d.series.points)||d.series.points.length>64||d.series.points.some((p:any)=>!Number.isFinite(Date.parse(p.at))||p.net!==null&&!Number.isFinite(p.net)||p.change!==null&&!Number.isFinite(p.change)))throw Error('趋势资料格式未核验');return d;
 },retry:false,refetchOnWindowFocus:false,refetchOnReconnect:false,staleTime:Infinity});
 if(!q.data)return q.error?<p role="status" className="pulse-warning">趋势读取失败，榜单原值保留。<button onClick={()=>void q.refetch()}>重试读取</button></p>:<Skeleton label="资金趋势" kind="table"/>;
 const d=q.data,points:FundPoint[]=d.series.points,valid=points.filter(p=>Number.isFinite(p[metric])),last=valid.at(-1),latest=points.at(-1);
 return <div className="fund-trend-detail"><p className="pulse-time">{d.day} · 东方财富 · {target.kind==='industry'?'行业':'概念'} · {target.code}<br/>历史采样，非实时；金额为来源主力净额估算，行业与概念不相加。</p>
  <div className="pulse-switch" aria-label="趋势指标">{[['net','累计净额'],['change','相邻变化']].map(([k,label])=><button key={k} type="button" aria-pressed={metric===k} disabled={k==='change'&&!d.change_available} onClick={()=>setMetric(k as any)}>{label}</button>)}</div>
  <div className="fund-trend-value"><span>{metric==='net'?'最近可用累计净额':'最近可用相邻变化'} / 万元</span><strong className={tone(last?.[metric])}>{amount(last?.[metric])}</strong><small>{last?clock(last.at):'尚无有效比较'}{last&&last!==latest?' · 最新批次该值缺失':''}</small></div>
  <p className="pulse-time">横轴为北京时间的实际采集完成时间，不是每个板块资金字段的独立更新时间。计划每{d.cadence_minutes}分钟采样；漏采、缺值和午休均断线，不补点、不平滑。收盘计划15:05，14:30至15:05为35分钟。</p>
  {metric==='change'&&<p className="pulse-warning">相邻变化＝本次累计净额－上次累计净额，仅比较同源、同日、同交易时段且间隔有效的采样；不等于该时段真实新增资金，也不代表加速度。</p>}
  {!d.change_available&&<p className="pulse-warning">本类资金源尚未验收，相邻变化未开放；累计快照保留原值。</p>}
  {valid.length?<Suspense fallback={<Skeleton label="趋势图" kind="table"/>}><Chart points={points} metric={metric}/></Suspense>:<p className="pulse-empty">没有可核对的{metric==='net'?'净额采样':'相邻变化'}；不补0。</p>}
  {valid.length===1&&<p className="pulse-time">只有一个有效点，展示采样点，不构成连续走势。</p>}
  <details open><summary>原始采样与缺口 · {points.length} 批</summary><div className="fund-trend-point-table"><table><thead><tr><th>完成时间</th><th>累计 / 万元</th><th>相邻差 / 万元</th><th>采样说明</th></tr></thead><tbody>{points.map(p=><tr key={p.at}><td>{clock(p.at)}</td><td className={tone(p.net)}>{amount(p.net)}</td><td className={tone(p.change)}>{amount(p.change)}</td><td>{reasonText(p.change_reason)}{p.interval_seconds?' · '+number(p.interval_seconds/60,1)+'分钟':''}</td></tr>)}</tbody></table></div></details>
 </div>;
}
export function FundTrendDrawer({target,onClose}:{target:FundTarget|null,onClose:()=>void}){
 return <Drawer open={!!target} onOpenChange={open=>!open&&onClose()} title={(target?.name||'板块')+' · 资金趋势'} className="fund-trend-drawer">{target&&<TrendContent key={target.kind+target.code+target.model} target={target}/>}</Drawer>;
}
