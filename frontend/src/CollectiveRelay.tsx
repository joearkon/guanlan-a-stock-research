import {usePreferences} from './personal-preferences';
import {useState} from 'react';
import {ChevronDown} from 'lucide-react';
import {useSearchParams,Link,Navigate} from 'react-router-dom';
import {useQuery,useInfiniteQuery} from '@tanstack/react-query';
import {publicQuery,getJSON,number,pct,tone,retryRead} from './api';
import {Segmented,Skeleton,Widget,Drawer} from './components';
import StockLink from './StockLink';import StockListTable from './StockListTable';import DayEventStream from './DayEventStream';import ScrollMore from './ScrollMore';
import {useProfileActions} from './profile-actions';import {getThemeArtwork} from '../../web/v2/theme-artwork.mjs';
import './monitor.css';import './relay-events.css';import './concept-relay.css';import './collective-relay.css';
import FundingDirections from './FundingDirections';
import FundingTimeline from './FundingTimeline';
import FundingFlowPanel from './FundingFlowPanel';
import {useMarketReadInterval,useMarketClock} from './market-polling';
import {relayDisplay} from './relay-display';import RelayArtwork from './RelayArtwork';
import './funding-observation.css';
import {ThemeFrequencyBadge,ThemeContinuity} from './ThemeFrequency';
import {OfficialRuleEditor as BoardAlertEditor} from './OfficialServices';
import MonitorAlertButton from './MonitorAlertButton';
import './monitor-density.css';
const sources:any={auto:'自动 · 主行业细分优先，概念作关联',ths:'同花顺概念 × 三级主行业',dc:'东财概念 × 三级主行业',sina:'新浪概念 × 三级主行业',sw:'申万三级主行业'};
const time=(s:any)=>/^\d{14}$/.test(s||'')?`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)} ${s.slice(8,10)}:${s.slice(10,12)}:${s.slice(12,14)}`:s?new Date(s).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未取得';
function Members({board,model,view,direction}:{board:any,model:any,view:string,direction:string}){
 const [scope,setScope]=useState('representatives');
 const url='/api/data/theme-observation?'+new URLSearchParams({provider:model.provider,view,direction,model:model.id,board:board.code,scope,limit:'10'});
 const q=useInfiniteQuery({queryKey:['resource',url],initialPageParam:'',queryFn:({pageParam,signal})=>getJSON(url+(pageParam?'&cursor='+encodeURIComponent(pageParam):''),signal),getNextPageParam:(p:any)=>p.nextCursor||undefined,staleTime:Infinity,refetchOnWindowFocus:false,retry:retryRead(1)});
 const pages=q.data?.pages||[],valid=pages.every(p=>p.id===model.id&&p.provider===model.provider&&p.board?.code===board.code),members=valid?[...new Map(pages.flatMap(p=>p.board?.members||[]).map(s=>[s.code,s])).values()]:[];
 const more=()=>{if(q.hasNextPage&&!q.isFetchingNextPage)void q.fetchNextPage();};
 return <div className="concept-members"><div className="concept-toolbar"><label>成员范围<select aria-label="成员范围" value={scope} onChange={e=>setScope(e.target.value)}><option value="representatives">梯队代表 · 最多20只</option><option value="source">原始细分成员 · 分批查看</option></select></label></div>
 <p className="provenance">判定使用全部 {board.memberCount} 只来源成员；现在展示 {members.length} 只。前排按本方向强度，成交核心仅为活跃候选，不确认为龙头或中军。</p>
 {!valid&&<p role="alert" className="local-error">成员批次不一致，已阻止显示其他板块数据。请更新榜单。</p>}
 {q.isPending&&<Skeleton label="细分成员" kind="table"/>}{q.error&&<p role="alert" className="local-error">成员快照读取失败或已过期，已加载内容保留。<button onClick={()=>q.refetch()}>重试成员</button></p>}
 <div onScrollCapture={e=>{const el=e.target as HTMLElement;if(el.scrollHeight>el.clientHeight&&el.scrollHeight-el.scrollTop-el.clientHeight<40)more();}}><StockListTable tailWidths={[120,260,176]} headers={['股票 / 代码','最新价','涨跌幅','成交额（亿）','梯队角色 / 依据','报价时间']} rows={members.map((s:any)=>[<StockLink code={s.code} name={s.name}>{s.name}<small>{s.code}</small></StockLink>,number(s.quote?.price),<span className={tone(s.quote?.pct)}>{pct(s.quote?.pct)}</span>,s.quote?.amount==null?'—':number(s.quote.amount/1e8),<span className="support-role">{s.roles?.join(' / ')||'来源成员'}<small>{s.reason?.join('；')||'未因此确认支撑角色'}</small></span>,time(s.quote?.time)])}/></div>
 {q.hasNextPage&&<button disabled={q.isFetchingNextPage} className="outline-button" onClick={more}>{q.isFetchingNextPage?'正在读取…':'继续显示10只'}</button>}
 {!q.isPending&&!q.error&&valid&&!members.length&&<p className="empty">这一方向没有符合条件的代表，不用其他板块或弱势股票凑数。可查看原始细分成员。</p>}
 </div>;
}
export default function CollectiveRelay({funding=false,directions=false}:{funding?:boolean;directions?:boolean}={}){
 const [params]=useSearchParams();
 if(funding){if(['provider','view','direction','board','model','archive'].some(k=>params.has(k))){const next=new URLSearchParams(params);next.set('section','directions');return <Navigate replace to={'/market-observation?'+next}/>;}return <div className="funding-page"><div className="page-heading"><h1>资金观测</h1><p className="muted">资金净额、窗口变化与原资金雷达规则</p></div><FundingFlowPanel initialDate={params.get('date')||''}/></div>;}
 return <DirectionRelay funding={directions} review={directions}/>;
}
function DirectionRelay({funding=false,review=false}:{funding?:boolean;review?:boolean}){
 const [alertBoard,setAlertBoard]=useState<any>(null);
 const {preferences}=usePreferences();
 const [params]=useSearchParams(),[provider,setProvider]=useState(params.get('provider')||'auto'),[view,setView]=useState(params.get('view')||'hot'),[direction,setDirection]=useState(params.get('direction')||'rise'),[search,setSearch]=useState(params.get('board')||''),[selected,setSelected]=useState(params.get('board')||''),[pinned,setPinned]=useState(params.get('model')||''),[archive,setArchive]=useState(''),[event,setEvent]=useState<any>(null),[notice,setNotice]=useState(''),[historyDay,setHistoryDay]=useState('');
 const account=useProfileActions();
 const base='/api/data/theme-observation?'+new URLSearchParams({provider,view,direction,search,archive,limit:'20',...(pinned?{model:pinned}:{})});
 const q=useInfiniteQuery({queryKey:['resource',base],initialPageParam:'',queryFn:({pageParam,signal})=>getJSON(pageParam?base.replace('limit=20','limit=10')+'&cursor='+encodeURIComponent(pageParam):base,signal),getNextPageParam:(p:any)=>p.nextCursor||undefined,staleTime:Infinity,refetchOnWindowFocus:false,retry:retryRead(1)});
 const d=q.data?.pages[0],rows=[...new Map((q.data?.pages||[]).flatMap((p:any)=>p.id===d?.id?p.boards||[]:[]).map((b:any)=>[b.code,b])).values()] as any[];
 const frequencyUrl='/api/data/theme-observation?'+new URLSearchParams({frequency:'1',provider:d?.provider||provider,day:d?.day||'',until:d?.asof||'',direction});
 const frequency=useQuery({...publicQuery(frequencyUrl,300000),enabled:!!d?.asof&&(review||view==='hot'),refetchOnWindowFocus:false,retry:false});
 const calendar=useQuery({...publicQuery('/api/data/free?view=watch',300000),enabled:!!d,refetchOnWindowFocus:false,retry:false}),now=useMarketClock(),display=relayDisplay(d,calendar.data?.trading_calendar,now,archive);
 const headInterval=useMarketReadInterval(60000,calendar.data?.trading_calendar),head=useQuery({...publicQuery('/api/data/theme-observation?provider='+provider+'&head=1',60000),refetchInterval:headInterval,enabled:!archive});
 const history=useQuery({...publicQuery('/api/data/theme-observation?provider='+(d?.provider||provider)+'&history=1&day='+(historyDay||d?.day||''),60000),enabled:!!(historyDay||d?.day)});
 const reset=(preserveBatch=true)=>{setPinned(funding&&preserveBatch?d?.id||'':'');if(!funding||!preserveBatch)setArchive('');setSelected('');};
 const more=()=>{if(q.hasNextPage&&!q.isFetchingNextPage)void q.fetchNextPage();};
 const day=display.day;
 const descriptions:any={hot:'同向支撑广度与相对市场强度优先；上涨和下跌分开，不用最后一只异动股代表整个板块。',anomaly:'最近5分钟真实多股价格事件优先，再看扩散比例和人数；报价或采样窗口不完整时不确认共振。',relay:'昨日冻结题材与今日全量成员反馈：区分延续、反向分化和退潮。缺少昨日档案时不以今日名单补造。',directory:'榜单筛选不等于全目录；原始分类另有独立核验入口。'};
 async function follow(b:any){try{await account.toggleAsset(d?.provider==='sw'?'industry':'concept',d?.provider==='sw'?b.code:(d?.provider||provider)+':'+b.code.split('~')[0],b.name,{targetType:'board',provider:d.provider,code:b.code,name:b.name,sourceVersion:d.sourceVersion});setNotice('题材关注已保存；异动提醒需另行确认开启');}catch(e:any){setNotice(e.message);}}
 return <div className={'relay-page collective-page'+(funding?' funding-page':'')}><div className="page-heading">{funding?<h2>方向榜</h2>:<h1>异动接力</h1>}<span className="muted">{day||'日期待核验'} · 细分方向与梯队支撑</span>{!funding&&<MonitorAlertButton/>}<button className="outline-button" disabled={q.isFetching} onClick={()=>{if(head.data?.id&&head.data.id!==d?.id)setPinned(head.data.id);else void q.refetch();setArchive('');setSelected('');}}>更新榜单</button></div>
 {display.notice&&<p className="relay-snapshot-notice" role="status">{display.notice}</p>}
 {funding&&d?.id&&<FundingDirections model={d} archive={archive} onPick={(dir,code)=>{setView('hot');setDirection(dir);setPinned(d.id);setSearch('');setSelected(code);}}/>}
 <Segmented label="题材视图" value={view} options={funding?[["hot","方向榜"],["anomaly","近期变化"],["relay","昨日方向反馈"]]:[["hot","热点题材"],["anomaly","异动发现"],["relay","昨日接力"]]} onChange={v=>{setView(v);reset();setSearch('');}}/>
 <p className="provenance">{view==='relay'?'昨日冻结题材 · ':''}{descriptions[view]}</p>
 <div className="collective-controls"><Segmented label="集体方向" value={direction} options={[["rise","集体向上"],["fall","集体向下"],["all","双向观察"]]} onChange={v=>{setDirection(v);reset();}}/><label>分类来源<select aria-label="分类来源" value={provider} onChange={e=>{setProvider(e.target.value);reset(false);}}>{Object.entries(sources).map(([value,label]:any)=><option key={value} value={value}>{label}</option>)}</select></label><label>榜单筛选<input aria-label="细分检索" placeholder="题材、行业环节或来源代码" value={search} onChange={e=>{setSearch(e.target.value);setSelected('');}}/></label></div>
 {preferences.topics.length>0&&<div className="preference-topics" aria-label="常用题材快捷检索"><span>常用方向</span>{preferences.topics.map(topic=><button className="outline-button" key={topic} aria-label={"检索"+topic} onClick={()=>{setSearch(topic);reset();}}>{topic}</button>)}</div>}
 <p className="provenance">报价批次 {time(d?.quoteCollectedAt)} · 计算时间 {time(d?.computedAt)} · {d?.closed?'收盘快照，非实时':d?.status==='stale'||d?.status==='historical'?'保留旧结果，非当前实时':'共享采样结果，非逐笔'}。{d?.id&&<>版本 {d.id.slice(0,8)}</>}</p>
 {head.data?.id&&d?.id&&head.data.id!==d.id&&!archive&&<button className="outline-button" onClick={()=>{setPinned(head.data.id);setSelected('');}}>有新榜单，点击更新（阅读时不自动重排）</button>}
 {notice&&<p role="status">{notice}</p>}{search&&<p className="fact-note">正在筛选这批已保存榜单；全量原始目录可在下方核验入口查看，不能把榜单范围当成全市场覆盖。</p>}
 {d&&!d.evidenceReady&&<p className="fact-note">共享结果正在准备或批次已过期；页面不会自行扫描市场，也不据此判断没有热门题材。</p>}
 <div className="relay-layout"><div className="relay-primary">
 {review&&<ThemeContinuity data={frequency.data} error={frequency.error} retry={()=>void frequency.refetch()}/>}
 {q.isPending&&<Skeleton label="细分共享榜单"/>}{q.error&&<p role="alert" className="local-error">榜单读取失败，已加载结果保留。<button onClick={()=>q.refetch()}>重试榜单</button></p>}
 {rows.map(b=>{const dir=b.activeDirection||(direction==='fall'?'fall':'rise'),c=b.collective,m=c?.[dir],art=getThemeArtwork(b.name,b.taxonomy)||(b.taxonomy?.relatedConcepts||[]).map(s=>getThemeArtwork(s.name)).find(Boolean),daily=m?.daily||{},window=m?.window||{},open=selected===b.code;return <article className={"relay-theme"+(view==='hot'?' has-frequency':'')} data-selected={open} key={b.code}>
 {view==='hot'&&<ThemeFrequencyBadge data={frequency.data} board={b} direction={dir} error={frequency.error} retry={()=>void frequency.refetch()}/>}
 <button className="collective-summary" aria-label={(open?'收起':'展开')+b.name+'成员'} aria-expanded={open} aria-controls={'board-'+encodeURIComponent(b.code)} onClick={()=>setSelected(open?'':b.code)}><RelayArtwork src={art?.src}/><span className="collective-name"><strong>{b.name}</strong><small>{b.taxonomy?.industryPath?.join(' / ')||'细分关系待核验'}</small>{b.taxonomy?.relatedConcepts?.length>0&&<small>概念关联：{b.taxonomy.relatedConcepts.slice(0,5).map(s=>s.name).join('、')}</small>}<small>整体{b.signal}（原规则）{b.relayState?' · '+b.relayState:''}</small></span><span className={dir==='fall'?'down':'up'}><b>{daily.strongCount??'—'} / {c?.quality?.covered??'—'} 同向强股</b><small>成交活跃候选 {daily.coreCount??'—'} 只</small></span><span><b>{view==='anomaly'?'窗口 '+(window.memberCount??0)+' 只':display.dayText(c?.state||'证据待核验')}</b><small>{window.confirmed?'同窗共振已核验':window.observed?'可见异动 · 窗口待核验':'尚无同窗共振'} · {display.dayText(b.lifecycle?.[dir]?.phase||'首次观察')}</small><span className="collective-toggle">{open?'收起梯队':'展开梯队'}<ChevronDown size={16}/></span></span></button>
 <div className="collective-facts"><span>支撑比例 {Number.isFinite(daily.memberRatio)?number(daily.memberRatio*100,1)+'%':'—'}</span><span>{display.snapshot?'快照窗口事件':'最近窗口事件'} {time(window.latestTime)}</span>{c?.rolling?.coverageReady&&<span>{display.snapshot?'快照5分钟中位变化':'5分钟中位变化'} <span className={tone(c.rolling.medianChange)}>{pct(c.rolling.medianChange)}</span></span>}{b.baseline&&<span>昨日 {b.baseline.day} · 支撑比例 {number((b.baseline.collective?.[dir]?.daily.memberRatio||0)*100,1)}%</span>}</div>
 {open&&<div id={'board-'+encodeURIComponent(b.code)} className="collective-open-content"><details className="provenance collective-detail"><summary>来源、门槛与重叠关系</summary><p>{b.taxonomy?.membershipBasis==='official_primary_industry'?'官方主行业归属':'来源概念关联 × 官方主行业交集；不等同于已核验该概念为主营'}。全量成员 {b.memberCount}，有效报价 {c?.quality?.covered}；同向强股门槛 {daily.requiredCount} 只，且需成交活跃候选；同向比例须高于市场基准 {number((daily.marketRate||0)*100,1)}%。展示10或20只不参与判定。</p><p>原始成员抓取 {time(b.fetchedAt)}；{b.membershipStale?'成员待更新':'保留来源时间'}；目录版本 {d?.sourceVersion?.slice(0,12)}。</p>{b.overlappingConcepts?.length>0&&<p>相同支撑簇合并展示：{b.overlappingConcepts.map(s=>s.name).join('、')}；不是这些概念存在上下级关系，不能累加股票数量。</p>}<p>采样窗口{d?.windowComplete?'具备连续性证据':'尚不完整'}；支持候选不是买入推荐，成交核心缺多日趋势/流通市值验证时不确认为中军。</p></details><Members key={[b.code,d?.id,view,dir].join('|')} board={b} model={d} view={view} direction={dir}/><div className="notice-actions"><button className="outline-button" disabled={!account.query.data||account.mutation.isPending} onClick={()=>void follow(b)}>切换来源题材关注</button><button className="outline-button" onClick={()=>setAlertBoard({code:b.code,name:b.name,provider:d.provider,sourceVersion:d.sourceVersion})}>设置板块提醒</button></div></div>}
 </article>;})}
 {q.hasNextPage&&<ScrollMore key={base} onMore={more}>{q.isFetchingNextPage?'正在读取下一批…':'继续显示10个细分方向'}</ScrollMore>}
 {!q.isPending&&d?.evidenceReady&&!rows.length&&<p className="empty">{d.baselineStatus==='missing'?'昨日冻结题材档案尚未建立；保留原昨日涨停原因接力，不补造历史。':d.closed&&view==='anomaly'?'已收盘，最近5分钟没有当前可核验的集体异动；可查看榜单存档或右侧全日事件。':'此方向尚无达到支撑条件的细分板块；可检索目录核验，不用孤立股票凑榜。'}</p>}
 <details className="collective-archive"><summary>榜单存档与口径核验</summary><label>存档日期<input type="date" aria-label="榜单存档日期" value={historyDay||day} max={day} onChange={e=>setHistoryDay(e.target.value)}/></label><select aria-label="榜单历史快照" value={archive} onChange={e=>{setArchive(e.target.value);setSelected('');}}><option value="">当前共享榜单</option>{history.data?.snapshots?.map((s:any)=><option key={s.id} value={s.id}>{time(s.asof)} · {s.kind==='close'?'收盘冻结':'采样存档'}</option>)}</select>{history.error&&<p role="alert">存档读取失败<button onClick={()=>history.refetch()}>重试存档</button></p>}<p>只保存真实观察时点，各方向榜单前60；不是全市场逐笔回放。目录和窗口缺项会留痕，不回填部署前历史。</p><Link to="/relay?legacy=1">原始概念目录与昨日涨停原因接力（独立口径）</Link></details>
 </div>{funding?(d?.asof&&<FundingTimeline key={[d.id,selected,direction].join('|')} model={d} board={selected} direction={direction} onClear={()=>setSelected('')}/>):<Widget title={day?day+' 异动记录':'全日异动记录'} subtitle="独立保留原始个股事件；不等同于集体支撑"><DayEventStream key={day} day={day} direction={direction} onSelect={setEvent}/></Widget>}</div>
 <Drawer open={!!event} onOpenChange={v=>!v&&setEvent(null)} title="异动触发依据">{event&&<><h3><StockLink code={event.code} name={event.name}>{event.name||event.code}</StockLink> · {event.kind}</h3><p>实际事件 {time(event.time)} · 窗口 {event.span_sec??'未提供'} 秒 · 变化 {pct(event.change_pct)} · 触发价 {number(event.price)}。</p><p className="provenance">不把当日涨幅代替分钟变化；触发事件不证明题材是上涨原因。</p></>}</Drawer>
 <Drawer open={!!alertBoard} onOpenChange={v=>!v&&setAlertBoard(null)} title="设置板块提醒">{alertBoard&&<BoardAlertEditor key={alertBoard.provider+':'+alertBoard.code} target={alertBoard} onSaved={()=>{setAlertBoard(null);setNotice('板块规则已保存；是否启用以规则设置为准。');}}/>}</Drawer></div>;
}
