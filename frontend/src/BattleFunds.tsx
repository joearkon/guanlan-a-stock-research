import {useMemo,useState,type CSSProperties} from 'react';
import {useQuery} from '@tanstack/react-query';
import {RefreshCw,SlidersHorizontal} from 'lucide-react';
import {publicQuery,number,tone} from './api';
import {Segmented,Skeleton} from './components';
import {validDate} from './portfolio-data';
import './battle-funds.css';

type Kind='industry'|'concept';
type Choice={code:string;name:string;provider:string};
type Cell={date:string;value:number|null;reason:string;source:string;sample:string};
type Series={choice:Choice;cells:Cell[]};
const providers:Record<string,string>={eastmoney:'东方财富','tushare-dc':'TuShare · 东财',sina:'新浪独立净流入口径'};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const money=(v:unknown)=>finite(v)?(v>0?'+':'')+number(v):'—';
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date());
function sample(value:unknown){const n=typeof value==='string'?Date.parse(value):NaN;return Number.isFinite(n)?new Date(n).toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'}):'采样时间未提供';}
function historyModel(member:any,calendar:any,kind:Kind,through:string,window:number,choices:Choice[]){
 const stages=new Map<string,any>();
 for(const stage of [...(Array.isArray(member?.flow_history)?member.flow_history:[]),member?.sector_flow]){
  const day=stage?.meta?.asof;if(validDate(day||'')&&day<=through&&['ok','partial','fallback'].includes(stage?.meta?.status))stages.set(day,stage);
 }
 const known=[...stages.keys()].sort(),first=known[0];
 const continuous=!!first&&calendar?.from<=first&&calendar?.through>=through&&Array.isArray(calendar?.open_days)&&calendar.open_days.includes(through);
 const dates=(continuous?[...new Set<string>(calendar.open_days.filter((d:string)=>validDate(d)&&d>=first&&d<=through))].sort():known).slice(-window);
 const series=choices.map(choice=>({choice,cells:dates.map(date=>{
  const stage=stages.get(date),source=stage?.sources?.[kind]||'',sampled=stage?.meta?.fetched_at||'';
  const rows=stage?.groups?.[kind],matches=Array.isArray(rows)?rows.filter(r=>r?.code===choice.code):[];
  let value:number|null=null,reason='';
  if(!stage)reason='缺少当日快照';
  else if(source!==choice.provider)reason='来源变化';
  else if(matches.length!==1)reason=matches.length?'板块身份重复':'未覆盖此板块';
  else if(matches[0].source&&matches[0].source!==source)reason='成员来源不一致';
  else if(!finite(matches[0].today))reason='当日净额缺失';
  else value=matches[0].today;
  return {date,value,reason,source,sample:sampled};
 })}));
 return {dates,series,continuous};
}
function Chart({series,dates,bars}:{series:Series[];dates:string[];bars:boolean}){
 const shown=series.filter(s=>s.cells.some(c=>c.value!==null)).slice(0,8),values=shown.flatMap(s=>s.cells.map(c=>c.value).filter(finite)),max=Math.max(1,...values.map(Math.abs));
 const x=(i:number)=>52+(dates.length>1?i/(dates.length-1)*552:276),y=(v:number)=>100-v/max*76;
 return <svg className="battle-funds-chart" viewBox="0 0 650 225" role="img" aria-label={'关注板块逐日资金'+(bars?'柱状图':'趋势图')}>
  <title>各交易日来源净额，单位亿元；缺日和来源变化不连接</title>
  {[-max,0,max].map(v=><g key={v}><line x1="46" x2="615" y1={y(v)} y2={y(v)} className={v===0?'zero':'grid'}/><text x="40" y={y(v)+4} textAnchor="end">{number(v,1)}</text></g>)}
  {dates.map((d,i)=>(i===0||i===dates.length-1||dates.length<8||i%Math.ceil(dates.length/5)===0)&&<text key={d} x={x(i)} y="205" textAnchor="middle">{d.slice(5)}</text>)}
  {shown.map((s,k)=>{
   const style={'--fund-series':`var(--fund-series-${k})`} as CSSProperties;
   if(bars){const width=Math.min(22,440/Math.max(1,dates.length)/Math.max(1,shown.length));return <g key={s.choice.provider+s.choice.code} className="fund-series" style={style}>{s.cells.map((c,i)=>c.value!==null&&<rect key={c.date} x={x(i)+(k-(shown.length-1)/2)*width-width/2} y={Math.min(100,y(c.value))} width={Math.max(1,width-1)} height={Math.max(.8,Math.abs(y(c.value)-100))}><title>{s.choice.name} {c.date} {money(c.value)} 亿元</title></rect>)}</g>;}
   const segments:{index:number;cell:Cell}[][]=[];let current:{index:number;cell:Cell}[]=[];
   s.cells.forEach((cell,index)=>{if(cell.value===null){if(current.length)segments.push(current);current=[];}else current.push({index,cell});});if(current.length)segments.push(current);
   return <g key={s.choice.provider+s.choice.code} className="fund-series" style={style}>{segments.map((segment,i)=><g role="group" aria-label={s.choice.name+' 连续段 '+(i+1)} key={i}>{segment.length>1&&<polyline fill="none" strokeWidth="2" points={segment.map(p=>`${x(p.index)},${y(p.cell.value!)}`).join(' ')}/ >}{segment.map(p=><circle key={p.cell.date} cx={x(p.index)} cy={y(p.cell.value!)} r="3"><title>{s.choice.name} {p.cell.date} {money(p.cell.value)} 亿元</title></circle>)}</g>)}</g>;
  })}
 </svg>;
}
export default function BattleFunds(){
 const [kind,setKind]=useState<Kind>('industry'),[mode,setMode]=useState('trend'),[direction,setDirection]=useState('all'),[window,setWindow]=useState(5),[configure,setConfigure]=useState(false),[search,setSearch]=useState(''),[more,setMore]=useState(20);
 const [selected,setSelected]=useState<Record<Kind,Choice[]>>({industry:[],concept:[]});
 const funds=useQuery({...publicQuery('/api/data/funds-radar?kind='+kind+'&period=today&view=watch',300000),refetchOnWindowFocus:false});
 const d=funds.data,through=validDate(d?.snapshot?.asof||'')?d.snapshot.asof:validDate(d?.date||'')?d.date:'';
 const valid=through&&through<=today()&&(!d?.snapshot?.asof||d.snapshot.asof===through)&&(!d?.date||d.date===through)&&d?.kind===kind&&d?.period==='today'&&['ok','partial'].includes(d?.status)&&d?.unit==='亿元'&&providers[d?.provider];
 const available=valid&&(Array.isArray(d?.rows))?d.rows.filter((r:any)=>r?.code&&r?.name&&r.rankEligible!==false):[];
 const attention=selected[kind],current=attention.map(choice=>({choice,row:valid&&choice.provider===d.provider?available.find((r:any)=>r.code===choice.code):null}));
 const filtered=current.filter(r=>direction==='all'||direction==='in'&&r.row?.today>0||direction==='out'&&r.row?.today<0);
 const choices=useMemo(()=>filtered.map(r=>r.choice),[selected,kind,d,direction]);
 const seriesUrl='/api/data/funds-radar?'+new URLSearchParams({view:'series',kind,date:through,window:String(window),codes:choices.map(c=>c.provider+':'+c.code).sort().join(','),...(d?.batch?{batch:d.batch}:{})});
 const series=useQuery({...publicQuery(seriesUrl,300000),enabled:!!valid&&choices.length>0&&!configure,refetchOnWindowFocus:false,placeholderData:undefined});
 const history=useMemo(()=>historyModel(series.data?.member,series.data?.calendar,kind,through,window,choices),[series.data,kind,through,window,choices]);
 const options=available.filter((r:any)=>(r.name+r.code).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).slice(0,more);
 const errors=[funds,series].filter(q=>q.error),busy=[funds,series].some(q=>q.isFetching),sourceChanged=attention.some(c=>valid&&c.provider!==d.provider);
 const changeKind=(value:string)=>{setKind(value as Kind);setSearch('');setMore(20);setConfigure(false);};
 return <section className="battle-funds" aria-label="关注板块资金观察">
  <div className="battle-funds-tools"><Segmented label="资金板块分类" value={kind} options={[["industry","行业"],["concept","概念"]]} onChange={changeKind}/><button type="button" className="outline-button" aria-expanded={configure} onClick={()=>setConfigure(!configure)}><SlidersHorizontal size={14}/>配置关注板块</button><button type="button" className="quiet-button" aria-label="重新读取资金资料" disabled={busy} onClick={()=>[funds,...(choices.length?[series]:[])].forEach(q=>void q.refetch())}><RefreshCw size={14}/>重新读取</button></div>
  <p className="battle-funds-note">关注选择仅本次会话有效，不修改自选与持仓，不跨设备同步。</p>
  {errors.length>0&&<p className="local-error" role="status">读取失败，保留已有快照与原日期；可重新读取资金资料。</p>}
  {funds.isPending&&!d&&<Skeleton label="板块资金" kind="table"/>}
  {d&&<p className="battle-funds-receipt">{through||'日期未取得'} · {providers[d.provider]||'来源未确认'} · {d.unit||'亿元'} · {d.metric||'来源净额'}{d.status==='partial'?' · 部分覆盖':''}{through&&through<today()?' · 历史快照':''}<br/>采样（北京）{sample(d.snapshot?.fetchedAt)}；窗口数据不是逐日序列。</p>}
  {d&&!valid&&<p className="local-error" role="status">日期、来源或单位未通过资料核对，暂不提供板块选择与金额；可重新读取资金资料。</p>}
  {sourceChanged&&<p className="local-error" role="status">来源已变化，原关注对象保留原来源；请在配置中移除旧项后明确选择新来源，不自动拼接。</p>}
  {configure&&<fieldset className="battle-funds-picker"><legend>关注{kind==='industry'?'行业':'概念'} · {attention.length}/20</legend><p>仅本次会话保留选择，不修改自选与持仓，不跨设备同步。</p><label>筛选板块<input type="search" aria-label="筛选资金板块" value={search} onChange={e=>{setSearch(e.target.value);setMore(20);}} placeholder="输入板块名称或代码"/></label><div className="battle-funds-options">{options.map((r:any)=>{const checked=attention.some(c=>c.code===r.code&&c.provider===d.provider);return <label key={r.code}><input type="checkbox" aria-label={'关注'+r.name} checked={checked} disabled={!checked&&attention.length>=20} onChange={e=>setSelected(old=>({...old,[kind]:e.target.checked?[...old[kind],{code:r.code,name:r.name,provider:d.provider}]:old[kind].filter(c=>c.code!==r.code||c.provider!==d.provider)}))}/><span>{r.name}<small>{r.code} · {money(r.today)} 亿</small></span></label>;})}</div>{available.length>more&&<button type="button" className="outline-button" onClick={()=>setMore(n=>n+20)}>再显示20个</button>}{!available.length&&<p>尚无可核验板块目录；不会根据手填名称生成资金数据。</p>}{attention.length>0&&<div className="battle-funds-selected">{attention.map(c=><button key={c.provider+c.code} type="button" aria-label={'移除关注'+c.name} onClick={()=>setSelected(old=>({...old,[kind]:old[kind].filter(x=>x!==c)}))}>{c.name}{c.provider!==d?.provider?' · '+providers[c.provider]:''} ×</button>)}</div>}<button type="button" className="outline-button" onClick={()=>setConfigure(false)}>完成选择</button></fieldset>}
  {!attention.length&&!funds.isPending&&<p className="empty">配置关注板块，比较来源净额与逐日变化；行业与概念分别选择。</p>}
  {!!attention.length&&<><div className="battle-funds-view"><Segmented label="资金方向筛选" value={direction} options={[["all","双向"],["in","当日净流入"],["out","当日净流出"]]} onChange={setDirection}/><span>{filtered.length}个关注方向</span></div>
   <div className="battle-funds-table-wrap"><table aria-label="关注板块资金窗口"><thead><tr><th>板块</th><th>今日</th><th>近3日</th><th>近5日</th><th>前5日</th></tr></thead><tbody>{filtered.map(({choice:c,row:r})=><tr key={c.provider+c.code}><th scope="row">{c.name}<small>{providers[c.provider]}</small></th>{['today','d3','d5','previous5'].map(key=><td key={key} className={tone(r?.[key])}>{money(r?.[key])}</td>)}</tr>)}</tbody></table></div>
   {!filtered.length&&<p className="empty">当前关注对象没有匹配方向的可核验当日净额；缺失不等于零。</p>}
   <div className="battle-funds-view"><Segmented label="资金历史图形" value={mode} options={[["trend","趋势线"],["bars","柱状图"],["matrix","热力矩阵"]]} onChange={setMode}/><label>历史范围<select aria-label="资金历史范围" value={window} onChange={e=>setWindow(Number(e.target.value))}>{[5,10,20].map(n=><option key={n} value={n}>近{n}个已归档交易日</option>)}</select></label></div>
   <p className="battle-funds-note">{history.dates.length?history.dates[0]+' 至 '+history.dates.at(-1):'尚无可核验日序列'} · 逐日来源净额（亿元），不是3/5/10日累计值。{filtered.length>8&&mode!=='matrix'?'图中仅展示前8个关注方向，矩阵保留全部关注。':''}</p>
   {!history.continuous&&<p className="battle-funds-note" role="status">交易日历未覆盖，不能核验中间缺日；仅可查看已归档日期矩阵，不绘制连续趋势。</p>}
   {mode==='matrix'?<div className="battle-funds-table-wrap"><table className="battle-funds-matrix" aria-label="关注板块逐日资金矩阵"><thead><tr><th>板块 / 亿元</th>{history.dates.map(date=><th key={date}>{date}</th>)}</tr></thead><tbody>{history.series.map(s=><tr key={s.choice.provider+s.choice.code}><th scope="row">{s.choice.name}</th>{s.cells.map(c=><td key={c.date} className={tone(c.value)} aria-label={s.choice.name+' '+c.date+' '+(c.reason||money(c.value)+' 亿元')} title={c.reason||(providers[c.source]+' · '+sample(c.sample))}>{money(c.value)}</td>)}</tr>)}</tbody></table></div>:history.continuous&&filtered.length>0&&(history.series.some(s=>s.cells.some(c=>c.value!==null))?<><Chart series={history.series} dates={history.dates} bars={mode==='bars'}/><div className="battle-funds-legend">{history.series.filter(s=>s.cells.some(c=>c.value!==null)).slice(0,8).map((s,i)=><span key={s.choice.provider+s.choice.code} style={{'--fund-series':`var(--fund-series-${i})`} as CSSProperties}><i/>{s.choice.name}</span>)}</div></>:<p className="empty">所选板块尚无同源逐日净额，窗口快照保留；不会根据累计窗口拼造走势。</p>)}
  </>}
  <p className="battle-funds-note">来源主力净额是成交单分档统计近似，不代表机构持仓或新增资金。前5日沿用后台同源推导；缺项不补造。重叠板块金额不可相加。只读已发布共享资料，不重扫市场、不运行AI。</p>
 </section>;
}
