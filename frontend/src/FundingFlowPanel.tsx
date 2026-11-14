import {AiAction} from './AiAction';
import {useState,useEffect,useRef} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {ArrowDownLeft,ArrowUpRight,RefreshCw} from 'lucide-react';
import {publicQuery,number} from './api';
import {Segmented,Skeleton,Drawer,LocalRefresh} from './components';
import {useAsk} from './AskContext';
import {validDate} from './portfolio-data';
import FundsStructure,{FundsLedger,FundsMemberStatus} from './FundsStructure';
import FundingChanges from './FundingChanges';
import FundsRelativeStrength from './FundsRelativeStrength';
import FundsMarketStructure from './FundsMarketStructure';
import {expandFundsView} from './funds-transport';
const providers:Record<string,string>={'tushare-dc':'TuShare · 东财','eastmoney':'东方财富','sina':'新浪（独立净流入口径）'};
const amount=(v:any)=>typeof v==='number'&&Number.isFinite(v)?(v>0?'+':'')+number(v):'—';
const sampleTime=(v:any)=>{const t=Date.parse(v||'');return Number.isFinite(t)?new Date(t).toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'}):'未取得可核验采样时点';};
export default function FundingFlowPanel({initialDate=''}:{initialDate?:string}={}){
 const [rankMode,setRankMode]=useState('amount'),[kind,setKind]=useState('industry'),[period,setPeriod]=useState('today'),[date,setDate]=useState(initialDate),[limit,setLimit]=useState(10),[pin,setPin]=useState(''),[selection,setSelected]=useState<any>(null),ask=useAsk(),client=useQueryClient();
 const base={kind,period,view:'summary',...(date?{date}:{})},latestUrl='/api/data/funds-radar?'+new URLSearchParams({...base,limit:'10'}),url='/api/data/funds-radar?'+new URLSearchParams({...base,limit:String(limit),...(pin?{batch:pin}:{})});
 const identity=[kind,period,date].join('|'),retained=useRef<{identity:string;data:any}|null>(null);
 const q=useQuery({...publicQuery(url,300000),refetchOnWindowFocus:false}),raw=q.data||(retained.current?.identity===identity?retained.current.data:undefined),d=expandFundsView(raw);
 useEffect(()=>{if(q.data)retained.current={identity,data:q.data};},[q.data,identity]);
 const detailUrl=selection?.sourceSnapshot?.transport?'/api/data/funds-radar?'+new URLSearchParams({view:'board',kind:selection.sourceSnapshot.kind,period:selection.sourceSnapshot.period,date:selection.sourceSnapshot.date,code:selection.code,batch:selection.sourceSnapshot.batch}):'';
 const detail=useQuery({...publicQuery(detailUrl,300000),enabled:!!detailUrl,refetchOnWindowFocus:false,retry:false}),selected=detail.data?.batch===selection?.sourceSnapshot?.batch&&detail.data?.row?{...detail.data.row,sourceSnapshot:selection.sourceSnapshot}:selection;
 const more=()=>{if(d?.batch)setPin(d.batch);setLimit(n=>Math.min(2000,n+10));};
 const refresh=()=>{setPin('');setLimit(10);void client.invalidateQueries({queryKey:['resource',latestUrl],exact:true});};
 const publishedDate=validDate(d?.snapshot?.asof||'')?d.snapshot.asof:d?.status!=='unavailable'&&validDate(d?.date||'')?d.date:'';
 const detailSource=selected?.sourceSnapshot;
 function inspect(row:any,snapshotPeriod=period){setSelected({...row,sourceSnapshot:{date:publishedDate||'数据日期未提供',provider:d.provider,kind,period:snapshotPeriod,ledger:d.ledger,fetchedAt:d.snapshot?.fetchedAt,batch:d.batch||d.snapshot?.id||d.snapshot?.version||d.id||d.version||null,dailyComparison:d.dailyComparison,transport:d.transport}});}
 const rows=(d?.rows||[]).filter(r=>r.rankEligible!==false&&typeof r[period]==='number'&&Number.isFinite(r[period]));
 const available=(d?.transport==='funds-light-v1'?(d.coverage?.valid??rows.length)>0:!!rows.length)&&d?.status!=='unavailable';
 function change(setter:(v:string)=>void,value:string){setter(value);setPin('');setLimit(10);setSelected(null);}
 return <section className="funds-radar" aria-label="板块资金流"><header className="funds-radar-heading"><div><h2>板块资金流</h2><p className="muted">钱流向哪些板块，又从哪些板块撤出</p></div><button className="outline-button" aria-label="刷新资金流" disabled={q.isFetching} onClick={refresh}><RefreshCw size={14}/>刷新</button></header>
 <div className="funds-radar-toolbar"><Segmented label="资金流分类" value={kind} options={[["industry","行业"],["concept","概念"]]} onChange={v=>change(setKind,v)}/><Segmented label="榜单口径" value={rankMode} options={[["amount","净额榜"],["relative","今日净占比"]]} onChange={v=>{setRankMode(v);setSelected(null);}}/>{rankMode==='amount'&&<Segmented label="资金流窗口" value={period} options={[["today","今日"],["d3","近3日"],["d5","近5日"]]} onChange={v=>change(setPeriod,v)}/>}<label>数据日期<input type="date" aria-label="资金流数据日期" value={date||publishedDate} onChange={e=>change(setDate,e.target.value)}/></label><button type="button" className="outline-button" aria-pressed={!date} onClick={()=>change(setDate,'')}>最新已发布</button></div>
 <div className="funds-data-timing" role="group" aria-label="资金数据时点"><div><span>数据日期</span>{publishedDate?<time dateTime={publishedDate}>{publishedDate}</time>:<strong>{q.isPending?'读取中':'未提供'}</strong>}</div><div><span>查看模式</span><strong>{date?'指定日期 '+date:'跟随最新已发布'}</strong></div><div><span>采样时间（北京）</span><strong>{d?sampleTime(d.snapshot?.fetchedAt):q.isPending?'读取中':'未提供'}</strong></div></div>
 <LocalRefresh label="板块资金流" busy={!!d&&q.isFetching}>
 {q.isPending&&<Skeleton label="板块资金流" kind="table"/>}
 {q.error&&<p role="alert" className="local-error">资金流读取失败，已加载的数据保留。<button aria-label="重试资金流" onClick={refresh}>重试</button></p>}
 {d&&<p className="funds-radar-source">{publishedDate||'数据日期未提供'}　{providers[d.provider]||d.provider||'来源待核验'}　{rankMode==='relative'?'来源原生今日主力净占比':d.metric||'来源净额'}（{rankMode==='relative'?'%':d.unit||'亿元'}）{d.status==='partial'?' · 部分覆盖':''}</p>}
 {d&&<p className="funds-radar-source">采样（北京）{sampleTime(d.snapshot?.fetchedAt)} · 源批次 {d.snapshot?.id||d.snapshot?.version||d.id||d.version||'暂未提供'}</p>}
 {d&&<FundsMemberStatus data={d.structureStatus?.flowCoverage}/>}
 {d&&<FundsMarketStructure data={d}/>}
 {d?.overlap&&<p className="provenance">成员重合核验 {d.overlap.covered??'—'} / {d.overlap.expected??'—'} · {d.overlap.status==='ok'?'核验范围完整':'范围尚不完整，未核验部分保留分列'}。按后台重合组折叠，不相加金额、不按名称猜组。</p>}
 <p className="provenance">点击板块查看四窗对照、四档拆解、集中度及连续在榜；10日只作对照，不另设榜单。</p>
 {rankMode==='relative'?(q.isPending?null:<FundsRelativeStrength data={d} onPick={row=>inspect(row,'today')} pageLimit={limit} onMore={more}/>):available?<div className="funds-radar-ranks">{['inflow','outflow'].map(side=>{const positive=side==='inflow',server=d.period===period&&Array.isArray(d.ranks?.[side])?d.ranks[side]:null,list=server?server.filter((r:any)=>r.rankEligible!==false&&typeof r[period]==='number'&&Number.isFinite(r[period])):rows.filter(r=>positive?r[period]>0:r[period]<0).sort((a,b)=>positive?b[period]-a[period]:a[period]-b[period]);return <section key={side}><h3>{positive?<ArrowUpRight size={18}/>:<ArrowDownLeft size={18}/>}净{positive?'流入':'流出'}<small>亿元</small></h3><table><thead><tr><th>板块</th><th>{d.provider==='sina'?'来源净额':'主力净额'}</th><th>窗口变化</th></tr></thead><tbody>{list.slice(0,limit).map(r=><tr key={r.code}><td><button className="funds-radar-board" aria-label={r.name+(r.overlap?.count>1?' 等'+r.overlap.count+'个':'')} onClick={()=>inspect(r)}>{r.name}{r.overlap?.count>1&&<small> 等{r.overlap.count}个</small>}</button>{r.overlap?.names?.length>1&&<details className="funds-overlap-alias"><summary>重合名称</summary><p>{r.overlap.names.join('、')}</p></details>}</td><td className={positive?'up':'down'}>{amount(r[period])}</td><td>{r.divergence||r.phase||'—'}</td></tr>)}</tbody></table>{!list.length&&<p className="empty">此批数据没有净{positive?'流入':'流出'}板块。</p>}{(d.page?.totals?.["ranks."+side]??list.length)>limit&&<button className="outline-button" onClick={more}>再显示10个</button>}</section>;})}</div>:!q.isPending&&!q.error&&<p className="empty">该窗口暂无可核验的资金流数据，不能用涨跌幅或成交额代替。</p>}
 {d?.exclusions?.rows?.length>0&&<details className="funds-radar-note"><summary>方向噪音排除 · {d.exclusions.rows.length}项</summary><p>保留来源原值，但不进入方向双榜与变化名单；没有把排除项当成资金没有变化。</p><ul>{d.exclusions.rows.slice(0,20).map((r:any)=><li key={r.code}>{r.name} · {r.reason}</li>)}</ul>{d.exclusions.rows.length>20&&<p>仅展开前20条说明；排除版本 {d.exclusions.version}</p>}</details>}
 {d&&<><FundingChanges data={d} onPick={inspect} pageLimit={limit} onMore={more}/><FundsLedger ledger={d.ledger}/></>}
 </LocalRefresh>
 <details className="funds-radar-note"><summary>数据口径与覆盖</summary><p>主力净额是按成交单金额分档统计的大单与超大单净额，不代表可识别机构的持仓变化或市场新增资金。行业与概念可能重叠，不可将榜单金额相加。</p><p>近10日仅作窗口对照；前5日由同源近10日减近5日计算，缺任一项则不输出。不同来源不拼接计算。此模块读取后台共享发布，不因打开页面重复采集市场。</p>{d?.coverage&&<p>本次有效 {d.coverage.valid??rows.length} / 已取得 {d.coverage.received??'待核验'}，来源总数 {d.coverage.total??'未提供'}。</p>}{(d?.limitations||[]).map((s,i)=><p key={i}>{s}</p>)}</details>
 <Drawer open={!!selected} onOpenChange={v=>!v&&setSelected(null)} title="板块资金流详情">{selected&&<><h3>{selected.name}</h3><p>{detailSource.date} · {providers[detailSource.provider]||detailSource.provider} · 亿元</p>{typeof selected.netRatio==='number'&&Number.isFinite(selected.netRatio)&&<p>今日主力净占比 <strong className={selected.netRatio>0?'up':'down'}>{amount(selected.netRatio)}%</strong></p>}<p className="provenance">采样（北京）{sampleTime(detailSource.fetchedAt)} · 源批次 {detailSource.batch||'暂未提供'}</p>{detailSource.dailyComparison?.reason&&<p className="provenance">{detailSource.dailyComparison.reason}</p>}<p className="provenance">10日仅用于窗口对照，不单独出榜；前5日＝近10日－近5日。</p><dl className="funds-radar-windows">{[['today','今日'],['d3','近3日'],['d5','近5日'],['d10','近10日'],['previous5','前5日（推导）']].map(([key,label])=><div key={key}><dt>{label}</dt><dd>{amount(selected[key])}</dd></div>)}</dl><p>{selected.phase||'窗口形态资料不足'}{selected.divergence?' · '+selected.divergence:''}</p>{detailUrl&&detail.isPending?<Skeleton label="资金详细依据"/>:detailUrl&&detail.error?<p className="local-error" role="status">详细依据读取失败，窗口快照保留；请关闭后重新读取，不混入其他批次。</p>:<FundsStructure row={selected} ledger={detailSource.ledger}/>}<p className="provenance">板块净额不是成员获利概率，不由此推导买卖建议。</p>{ask&&<AiAction className="primary" onClick={()=>ask({context:{page:'资金观测',section:'funds-radar-v1',asof:detailSource.date,funds:{mode:'board',kind:detailSource.kind,period:detailSource.period,boards:[selected.code]}},question:'按'+detailSource.date+'，资金雷达查看'+selected.name+'的资金流窗口对比与背离，明确数据来源和缺项。'})}>带入问观澜</AiAction>}</>}</Drawer>
 </section>;
}
