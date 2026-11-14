import {useEffect,useRef,useState} from 'react';import {useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {publicQuery,number,pct,tone} from './api';
import {Widget,Segmented,Skeleton,Drawer,RefreshButton} from './components';
import StockLink from './StockLink';import SmartTable from './SmartTable';import ConceptMembers from './ConceptMembers';
import DayEventStream from './DayEventStream';import {rankConcepts,hotTier,eventCountFor,eventTimeFor} from './concept-ranking';
import {useWatchData} from './watch-data';import {useProfileActions} from './profile-actions';
import {getThemeArtwork} from '../../web/v2/theme-artwork.mjs';
import {conceptDisplayKind} from '../../web/v2/theme-support.mjs';
import ScrollMore from './ScrollMore';
import {useMarketReadInterval} from './market-polling';
import './monitor.css';import './watch-fidelity.css';import './relay-events.css';import './concept-relay.css';
const quality=(b:any)=>b.membershipStale?'成员待更新':b.status==='complete'?'来源数量已核验':b.status==='collected_with_catalog_discrepancy'?'来源数量有差异':b.status==='stale'?'旧版本成员':'成员未收齐';
const sourceNames:Record<string,string>={ths:'TuShare · 同花顺概念',dc:'TuShare · 东财概念',sina:'新浪概念'};
const stamp=(s:any)=>s?new Date(s).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未取得';
const eventTime=(s:any)=>/^\d{14}$/.test(s||'')?s.slice(8,10)+':'+s.slice(10,12)+':'+s.slice(12,14):'暂无已存异动';
export default function ConceptRelay(){
 const [params]=useSearchParams(),initialProvider=['ths','dc','sina'].includes(params.get('provider')||'')?params.get('provider')!:'auto',initialBoard=/^(?:gn_[a-zA-Z0-9_]{1,80}|\d{6}\.TI|BK\d{4,8})$/.test(params.get('board')||'')?params.get('board')!:'';
 const [view,setView]=useState('linkage'),[provider,setProvider]=useState(initialProvider),[filter,setFilter]=useState('全部'),account=useProfileActions(),[feedback,setFeedback]=useState('');
 const suffix=view==='relay'?'?view=relay':provider==='auto'?'':'?provider='+provider;
 const interval=useMarketReadInterval(60000),q=useQuery({...publicQuery('/api/data/concept-observation'+suffix,60000),refetchInterval:interval}),{model,live}=useWatchData();
 const [search,setSearch]=useState(initialBoard),[sort,setSort]=useState('hot'),[direction,setDirection]=useState('all'),[onlyEvents,setOnlyEvents]=useState(false),[selected,setSelected]=useState(initialBoard),[event,setEvent]=useState<any>(null),[limit,setLimit]=useState(20);
 const d=q.data,c=d?.coverage||{},activeProvider=d?.provider||(provider==='auto'?'sina':provider);
 const detail=useQuery({...publicQuery('/api/data/concept-observation?board='+selected+'&provider='+activeProvider,60000),enabled:!!selected&&view!=='relay'});
 const previousProvider=useRef<string|undefined>(undefined);
 useEffect(()=>{if(previousProvider.current&&d?.provider&&previousProvider.current!==d.provider)setSelected('');if(d?.provider)previousProvider.current=d.provider;},[d?.provider]);
 const profile=account.query.data?.profile||{},mine=new Set([...(profile.pool||[]).filter(s=>!s.archived),...(profile.positions||[])].map(s=>s.code));
 const activeDirection=view==='anomaly'?direction:'all';
 const [includeAttributes,setIncludeAttributes]=useState(false);
 useEffect(()=>{setLimit(20);},[view,provider,filter,search,sort,direction,onlyEvents,includeAttributes]);
 const rows=rankConcepts<any>((d?.boards||[]).filter((b:any)=>(view!=='linkage'||includeAttributes||conceptDisplayKind(b.name)==='theme')&&(!search||b.name.includes(search)||b.code.includes(search))&&(!(onlyEvents||view==='anomaly')||eventCountFor(b,activeDirection)>0)&&(filter==='全部'||filter==='我的关注'&&((b.memberCodes||[]).some(code=>mine.has(code))||mine.has(activeProvider+':'+b.code))||filter===b.signal)),sort,view,activeDirection);
 async function follow(b:any){try{await account.toggleAsset(view==='relay'?'theme':'concept',view==='relay'?'relay:'+b.code:activeProvider+':'+b.code,b.name);setFeedback('关注状态已保存');}catch(e:any){setFeedback(e.message);}}
 const day=d?.day||model.day||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai'}).format(new Date());
 const sortText=sort==='hot'?'梯队支撑优先：有同窗向上证据、快照梯队、局部强势依次排序；同层保留整体强弱、强股比例和人数对照。整体标签不因挑出强股而改写，展开默认查看最多10只代表及入选依据':sort==='latest'?'所选方向最近异动时间优先，同一时刻按异动成员占比、再按人数':sort==='ratio'?'所选方向异动成员占比优先、再按人数':sort==='original'?(view==='anomaly'?'沿原规则：异动成员数优先、再中位涨幅':'沿原规则：达到3%的成员数优先、再中位涨幅'):sort==='median'?'中位涨幅降序':sort==='average'?'平均涨幅降序':sort==='amount'?'成交额降序':'该日异动成员数降序';
 return <div className="relay-page"><div className="page-heading"><h1>异动接力</h1><span className="muted">概念板块观测 · {day} · 行情时点见各股</span><RefreshButton busy={q.isFetching} onClick={()=>q.refetch()}/></div>
 <Segmented label="题材视图" value={view} options={[["linkage","热点题材"],["anomaly","异动发现"],["relay","昨日接力"]]} onChange={v=>{setView(v);setSelected('');setLimit(20);setFilter('全部');setOnlyEvents(false);setSort(v==='relay'?'original':v==='anomaly'?'latest':'hot');}}/>
 {view==='anomaly'&&<Segmented label="异动方向" value={direction} options={[["all","全部方向"],["rise","向上 · 急拉/封板"],["fall","向下 · 急跌/开板"]]} onChange={v=>{setDirection(v);setLimit(20);setSelected('');}}/>}
 <div className="relay-filters"><Segmented label="题材筛选" value={filter} options={['全部','多股走强','单股走强','分化','偏弱','行情缺项','我的关注'].map(s=>[s,s])} onChange={setFilter}/></div>
 <p className="provenance">{view==='relay'?`昨日基线 ${d?.baselineDate||'未覆盖'} → ${day} 行情反馈；沿原涨停原因标签分组。`:`来源：${sourceNames[activeProvider]||activeProvider} · 目录 ${c.catalogBoards??'—'} 组 · 已收成员 ${c.collectedBoards??'—'} 组 · 数量一致 ${c.consistentBoards??'—'} 组 · 24小时内更新 ${c.freshBoards??'—'} 组。`}</p>
 <p className="provenance">共享报价 {stamp(d?.quoteCollectedAt)} · {d?.quoteStatus==='stale'?'上次快照，未确认新行情':'各股时刻与状态见详情'}；异动统计{d?.eventScope==='day_archive'?'来自该日已存档记录':'当前仅有最近窗口或档案尚未核验'}。</p>
 <details className="provenance"><summary>分类口径与原判断规则（保持不变）</summary><p>来源概念目录不是标准行业细分层级，可能包含宽泛产业主题、地域和融资融券等属性标签，不自动推断上下级。不同来源独立保留，不按同名强行合并。</p><p>有效报价覆盖不足80%不判强弱；至少两只涨幅≥3%且上涨占比≥60%为多股走强，仅一只达到3%为单股走强；上涨占比低于40%为偏弱，否则分化。排序和强弱判断分开，急拉、急跌、封板、开板均属采样事件，不是买入推荐或新闻因果归因。</p>{d?.availableSources?.map((s:any)=><p key={s.provider}>{sourceNames[s.provider]||s.provider}：已收{s.collected}/{s.total}组 · 更新 {stamp(s.updatedAt)}</p>)}</details>
 {feedback&&<p role="status">{feedback}</p>}{c.complete===false&&<p className="fact-note">来源数量、时效或报价仍有待核验项；缺项、旧成员与数量差异保留，不静默删除题材。已采异动不因暂未归类而丢弃。</p>}
 <div className="relay-layout"><div className="relay-primary"><div className="concept-toolbar">
 {view!=='relay'&&<label>来源<select aria-label="分类来源" value={provider} onChange={e=>{setProvider(e.target.value);setSelected('');setLimit(20);}}><option value="auto">自动 · 完整可用来源优先</option><option value="ths">同花顺概念 · TuShare</option><option value="dc">东财概念 · TuShare</option><option value="sina">新浪概念 · 对照</option></select></label>}
 <label>概念检索<input aria-label="概念板块检索" placeholder="名称或来源代码" value={search} onChange={e=>{setSearch(e.target.value);setLimit(20);}}/></label>
 <label>排序<select aria-label="概念排序" value={sort} onChange={e=>setSort(e.target.value)}>{view==='linkage'&&<option value="hot">梯队支撑优先</option>}<option value="latest">最新异动优先</option><option value="ratio">异动成员占比</option><option value="original">原规则排序</option><option value="median">样本中位涨幅</option><option value="average">样本平均涨幅</option><option value="amount">样本成交额</option><option value="events">该日异动成员数</option></select></label><label><input type="checkbox" checked={onlyEvents} onChange={e=>setOnlyEvents(e.target.checked)}/>仅有已存异动</label></div>
 {view==='linkage'&&<label className="provenance"><input type="checkbox" checked={includeAttributes} onChange={e=>{setIncludeAttributes(e.target.checked);setLimit(20);}}/>显示融资、样本与风格标签（名称规则单列，不删来源目录）</label>}
 <p className="provenance">{sortText}；不是龙头评分或启动顺序。{!q.isPending&&`当前展示前 ${Math.min(limit,rows.length)} / ${rows.length} 组，检索覆盖当前范围全部分类；查属性标签请勾选显示。`}</p>
 {q.isPending&&<Skeleton label="概念目录"/>}{q.error&&<p className="local-error" role="alert">目录更新失败，已有数据保留。<button onClick={()=>q.refetch()}>重试目录</button></p>}
 {rows.slice(0,limit).map((b:any)=>{const art=getThemeArtwork(b.name);return <article className="relay-theme" key={b.code}><button className="concept-summary" aria-label={(selected===b.code?'收起':'展开')+b.name+'成员'} aria-expanded={selected===b.code} onClick={()=>setSelected(selected===b.code?'':b.code)}>{art?<img src={art.src} width="48" height="48" loading="lazy" alt=""/>:<span aria-hidden="true" className="relay-art-fallback">◇</span>}<span><strong>{b.name}</strong><small>整体{b.signal} · {b.code} · {view==='relay'?'昨日原因标签':quality(b)}</small>{view==='linkage'&&<small>{hotTier(b)===2?'整体共振':hotTier(b)===1?'局部强势':'尚未形成多股强势'} · ≥3% {b.strong??0}只 / {b.covered??0}只有效报价 · {b.covered?pct((b.strong||0)/b.covered*100):'—'}</small>}<small>最近{activeDirection==='rise'?'向上':activeDirection==='fall'?'向下':''}异动 {eventTime(eventTimeFor(b,activeDirection))}</small></span><span><small>样本中位涨幅</small><b className={tone(b.median)}>{pct(b.median)}</b></span><span><small>有效报价 / A股成员</small><b>{b.covered} / {b.memberCount}</b><small>{activeDirection==='rise'?'向上':activeDirection==='fall'?'向下':''}异动股 {eventCountFor(b,activeDirection)} · 占比 {b.memberCount?pct(eventCountFor(b,activeDirection)/b.memberCount*100):'—'}</small></span></button>
 {b.support&&view==='linkage'&&<p className="concept-support-summary">{b.support.label} · 前排 {b.support.frontCount} / 成交核心候选 {b.support.coreCount} / 扩散代表 {b.support.followCount} · 同窗向上至少 {b.support.syncCount}只</p>}
 {selected===b.code&&<div className="concept-members"><p className="provenance">成员抓取 {stamp(b.fetchedAt)} · {quality(b)} · 来源目录计数 {b.declaredCount??'未提供'}。全部成员用于计算，不判定关联是上涨原因。</p>
 {view!=='relay'&&detail.isPending?<Skeleton label="概念成员" kind="table"/>:view!=='relay'&&detail.error?<p role="alert" className="local-error">成员读取失败<button onClick={()=>detail.refetch()}>重试成员</button></p>:<ConceptMembers key={b.code} members={view==='relay'?b.members||[]:detail.data?.board?.members||[]}/>}
 {detail.data?.board?.excludedMembers?.length>0&&<details className="provenance"><summary>来源中的非A股成员 · {detail.data.board.excludedMembers.length}只（不参与A股判断）</summary>{detail.data.board.excludedMembers.map((s:any)=><p key={s.sourceCode}>{s.name} · {s.sourceCode} · 非A股市场，保留原来源记录</p>)}</details>}
 <button className="outline-button" disabled={!account.query.data||account.mutation.isPending} onClick={()=>void follow(b)}>切换该题材关注</button></div>}</article>;})}
 {!q.isPending&&!rows.length&&<p className="empty">此来源与筛选下暂无记录；不代表市场没有相应题材。</p>}{rows.length>limit&&<ScrollMore key={[view,provider,search,filter,sort,direction,onlyEvents,includeAttributes].join('|')} onMore={()=>setLimit(n=>Math.min(rows.length,n+10))}>继续显示10个题材 · {Math.min(limit,rows.length)}/{rows.length}</ScrollMore>}
 <Widget title="未归类异动" subtitle="已采到事件、但未匹配到所选来源成员库的股票仍保留" loading={q.isPending}><SmartTable headers={['股票 / 代码','已存事件数','最近事件']} rows={(d?.unclassified||[]).map((s:any)=>[<StockLink code={s.code} name={s.name}>{s.name}<small>{s.code}</small></StockLink>,s.eventCount,eventTime(s.lastTime)])}/>{!d?.unclassified?.length&&<p className="empty">当前没有待归类的已存事件，不据此推断跨来源分类完整。</p>}</Widget>
 </div><Widget title="全日异动记录" subtitle="按交易日持续留存，不是只看最近30条"><DayEventStream key={day} day={day} direction={activeDirection} fallback={model.events} onSelect={setEvent}/>{live.data?.event_archive?.status==='failed'&&<p className="local-error" role="alert">本轮档案写入失败；报价正常不代表档案完整。</p>}</Widget></div>
 <Drawer open={!!event} onOpenChange={v=>!v&&setEvent(null)} title="异动触发依据">{event&&<><h3><StockLink code={event.code} name={event.name}>{event.name||event.code}</StockLink> · {event.kind}</h3><p>原事件时间 {event.time}；触发价 {number(event.price)}；窗口变化 {pct(event.change_pct)}；窗口 {event.span_sec??'未提供'} 秒；基准价 {number(event.base_price)}。</p><p className="provenance">触发价格与当前报价不同；事件不证明新闻归因，不把日涨幅代替分钟窗口变化。</p></>}</Drawer></div>;
}
