import {PrivateValue} from './Privacy';
import {useMemo,useState,type ReactNode} from 'react';
import {useMarketClock as useRefreshClock} from './market-polling';
import {useQuery,useInfiniteQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {RefreshCw,BookOpen,ArrowUpRight,ChevronLeft,ChevronRight} from 'lucide-react';
import {publicQuery,getJSON,retryRead,number,pct,tone} from './api';
import {Skeleton} from './components';import {accountQuoteCodes,useQuoteBatch} from './quote-batch';
import StockLink from './StockLink'; import BattleChart from './BattleChart';
import BattleFunds from './BattleFunds';
import Prices from '../../web/v2/price-policy.mjs';
import {personalWorkbench} from '../../web/v2/home-workbench.mjs';
import {conceptDisplayKind} from '../../web/v2/theme-support.mjs';
import {battleQuoteInterval,quoteChange,type DashboardPanel} from './battle-dashboard';
function useQuotePolling(enabled=true){const free=useQuery({...publicQuery('/api/data/free?view=home',300000),enabled}),now=useRefreshClock();return battleQuoteInterval(free.data?.trading_calendar,now,document.hidden,navigator.onLine!==false);}
function quoteReceipt(rows:any[]){const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date()),items=[...new Set(rows.filter(Boolean).map(q=>{const day=q.asof||(/^\d{14}$/.test(q.time||'')?q.time.slice(0,4)+'-'+q.time.slice(4,6)+'-'+q.time.slice(6,8):''),time=/^\d{14}$/.test(q.time||'')?q.time.slice(8,10)+':'+q.time.slice(10,12):q.time||'';return `${day||'日期未取得'} ${time} · ${q.source||'来源未取得'}${day&&day<today?' · 历史快照':''}`;}))];return items.length?items.slice(0,3).join('；')+(items.length>3?'；其他来源见行情抽屉':''):'报价时间与来源尚未取得';}

function Frame({queries,children}:{queries:any[];children:ReactNode}){
 const errors=queries.filter(q=>q.error),loading=queries.some(q=>q.isPending&&q.fetchStatus!=='idle'),hasData=queries.some(q=>q.data!==undefined);
 return <>{errors.length>0&&<div role="status" className="battle-panel-error">资料读取失败，保留已有数据与原时间。<button type="button" onClick={()=>errors.forEach(q=>void q.refetch())}>重试</button></div>}{loading&&!hasData?<Skeleton label="看板组件" kind="table"/>:children}<div className="battle-panel-refresh"><button type="button" disabled={queries.some(q=>q.isFetching)} onClick={()=>queries.forEach(q=>void q.refetch())}><RefreshCw size={13}/>重新读取</button><span>只读共享资料 · 不运行AI</span></div></>;
}
function useSnapshots(view='indices'){
 const free=useQuery(publicQuery('/api/data/free?view=home',300000)),now=useRefreshClock();
 const live=useQuery({...publicQuery('/api/data/live?view='+view,30000),refetchInterval:()=>battleQuoteInterval(free.data?.trading_calendar,now,document.hidden,navigator.onLine!==false)});
 return {free,live};
}


function Market({panel}:{panel:DashboardPanel}){const {free,live}=useSnapshots('market'),m=live.data?.market,stats=m||free.data?.ustats||{};return <Frame queries={[free,live]}><div className="battle-market-overview"><div className="battle-market-summary"><div className="battle-market-metrics">{[['上涨家数',stats.up,'up'],['下跌家数',stats.down,'down'],['平盘家数',stats.flat,''],['两市成交额',m?.amountYi??stats.amount_yi,'']].map(([label,value,color],i)=><div key={String(label)}><span>{label}</span><strong className={String(color)}>{number(value,i===3?1:0)}{i===3&&value!=null&&<small> 亿</small>}</strong></div>)}</div><p className="battle-source">{m?.label||((free.data?.asof||'日期未取得')+' · 收盘统计')}；成交额不是净流入。</p></div><ConfiguredChart panel={panel} through={free.data?.asof}/></div><Link className="battle-more" to="/market-observation">进入市场观测<ArrowUpRight size={14}/></Link></Frame>;}
const indexName=(code='000001')=>({'000001':'上证指数','399001':'深证成指','399006':'创业板指'}[code]||'上证指数');
function ConfiguredChart({panel,through}:{panel:DashboardPanel;through?:string}){const code=panel.kind==='security'?panel.security!.code:panel.indexCode||'000001';return <BattleChart key={code+(panel.chartPeriod||'day')+(panel.chartAdjust||'qfq')} code={code} name={panel.kind==='security'?panel.security!.name:indexName(code)} asset={panel.kind==='security'?'security':'index'} assetKind={panel.security?.kind} through={through} initialPeriod={panel.chartPeriod} initialAdjust={panel.chartAdjust}/>;}
function IndexChart({panel}:{panel:DashboardPanel}){const free=useQuery(publicQuery('/api/data/free?view=home',300000));return <ConfiguredChart panel={panel} through={free.data?.asof}/>;}
function Indices(){const {free,live}=useSnapshots();return <Frame queries={[free,live]}><div className="battle-index-list">{[['000001','上证指数'],['399001','深证成指'],['399006','创业板指']].map(([code,name])=>{const q=Prices.index(live.data,free.data?.indices?.find((r:any)=>r.code===code)||{code},free.data?.asof);return <article key={code}><div><strong>{name}</strong><small>{q.label}</small></div><b className={tone(q.pct)}>{number(q.price)}</b><span className={tone(q.pct)}>{pct(q.pct)}</span></article>;})}</div><Link className="battle-more" to="/market-observation">查看完整市场数据<ArrowUpRight size={14}/></Link></Frame>;}
function useAccountProfile(account:string){return useQuery({...publicQuery('/api/profile',300000),queryKey:['battle-profile',account],enabled:account!=='guest',retry:retryRead(1)});}
function usePanelPage<T>(rows:T[],size=5){const [requested,setPage]=useState(0),page=Math.min(requested,Math.max(0,Math.ceil(rows.length/size)-1));return {rows:rows.slice(page*size,(page+1)*size),page,setPage,size,total:rows.length};}
function Pagination({value,label}:{value:ReturnType<typeof usePanelPage>;label:string}){const {page,setPage,size,total}=value;if(total<=size)return null;return <nav className="battle-pagination" aria-label={label+'分页'}><span>{page*size+1}–{Math.min((page+1)*size,total)} / {total}项</span><div><button type="button" aria-label={'上一页'+label} disabled={page===0} onClick={()=>setPage(page-1)}><ChevronLeft size={16}/></button><button type="button" aria-label={'下一页'+label} disabled={(page+1)*size>=total} onClick={()=>setPage(page+1)}><ChevronRight size={16}/></button></div></nav>;}
function Personal({holding,account}:{holding:boolean,account:string}){
 const profile=useAccountProfile(account),rows=holding?profile.data?.profile?.positions||[]:(profile.data?.profile?.pool||[]).filter((r:any)=>!r.archived),page=usePanelPage<any>(rows),codes=[...new Set(page.rows.filter((r:any)=>(r.kind||'stock')!=='concept'&&/^\d{6}$/.test(r.code)).map((r:any)=>r.code))].sort().join(',');
 const quotes=useQuoteBatch(accountQuoteCodes(profile.data?.profile).split(',').length>80?codes:accountQuoteCodes(profile.data?.profile));
 return <Frame queries={[profile,...(codes?[quotes]:[])]}>{account==='guest'?<p className="empty">登录后显示当前账号的{holding?'持仓':'观察池'}。</p>:rows.length?<><table className="battle-quote-table"><thead><tr><th>名称 / 代码</th>{holding&&<th>股数 / 成本</th>}<th>现价</th><th>涨跌幅</th></tr></thead><tbody>{page.rows.map((r:any)=>{const q=quotes.data?.quotes?.[r.code],change=quoteChange(q);return <tr key={(r.kind||'stock')+r.code}><td><StockLink code={r.code} kind={r.kind||'stock'} name={r.name}/><small>{r.code}</small></td>{holding&&<td><PrivateValue>{number(r.shares,0)}<small>{number(r.cost)} 元</small></PrivateValue></td>}<td>{number(q?.price)}</td><td className={tone(change)}>{pct(change)}</td></tr>;})}</tbody></table><Pagination value={page} label="观察对象"/></>:!profile.isPending&&<p className="empty">还没有{holding?'持仓记录':'关注对象'}，可在“我的股票”里添加；这里不会自动建立记录。</p>}<p className="battle-source">{quoteReceipt(Object.values(quotes.data?.quotes||{}))}；缺价不把旧日期当今日。</p><Link className="battle-more" to={holding?'/holdings':'/watchlist'}>管理{holding?'持仓':'观察池'}<ArrowUpRight size={14}/></Link></Frame>;
}
function Security({panel,onConfigure}:{panel:DashboardPanel;onConfigure:()=>void}){
 const asset=panel.security,q=useQuoteBatch(asset?.code||''),value=q.data?.quotes?.[asset?.code||''],change=quoteChange(value);
 if(!asset)return <div className="battle-unconfigured"><p>先在组件设置中选择并核验一个股票或ETF。</p><button type="button" className="outline-button" onClick={onConfigure}>选择证券</button></div>;
 return <Frame queries={[q]}>
  <div className="battle-security-identity"><StockLink code={asset.code} name={asset.name} kind={asset.kind}/><span>{asset.code} · {asset.kind==='etf'?'ETF':'股票'}</span></div>
  <div className="battle-security-price"><strong className={tone(change)}>{number(value?.price,asset.kind==='etf'?3:2)}</strong><b className={tone(change)}>{pct(change)}</b></div>
  <p className="battle-source">{quoteReceipt([value])}</p><div className="battle-security-facts"><span>PE 源口径<b>{number(value?.pe,1)}</b></span><span>PB<b>{number(value?.pb)}</b></span><span>换手率<b>{typeof value?.turnover==='number'?number(value.turnover)+'%':'—'}</b></span></div><p className="battle-source">已观测报价，不是逐笔实时；ETF估值缺失不按股票填值。</p><ConfiguredChart panel={panel}/>
 </Frame>;
}
function Themes(){
 const interval=useQuotePolling(),q=useQuery({...publicQuery('/api/data/theme-observation?provider=auto&view=hot&direction=rise&limit=10',60000),refetchInterval:interval}),d=q.data;
 const warming=d?.evidenceReady===false||d?.status==='warming',rows=(d?.boards||[]).filter((b:any)=>b.collective?.rise?.daily?.supported&&conceptDisplayKind(b.name)==='theme').slice(0,6);
 const stamp=(s:string)=>s&&Number.isFinite(Date.parse(s))?new Date(s).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未取得';
 return <Frame queries={[q]}>
  {['stale','historical'].includes(d?.status)&&<p className="battle-panel-error" role="status">{d.status==='stale'?'旧快照 · 非当前实时':'历史交易日快照 · 非今日行情'}</p>}
  <div className="battle-theme-list">{rows.map((b:any)=><Link key={b.code} to={'/relay?'+new URLSearchParams({provider:d.provider,board:b.code,...(d.id?{model:d.id}:{})})}><strong>{b.name}<small>整体{b.signal}</small></strong><span>{b.collective.rise.daily.strongCount} / {b.collective.quality.covered}<small>同向强股</small></span></Link>)}</div>
  {warming?<p className="empty">共享题材快照尚未就绪，等待后台发布；页面不会重算全市场。</p>:q.isError&&!d?<p className="empty">当前没有可读取的共享快照，不将读取失败当作没有异动。</p>:!q.isPending&&d&&!rows.length&&<p className="empty">该批快照未取得达到梯队支撑条件的方向，不以孤立上涨个股补足。</p>}
  <p className="battle-source">交易日 {d?.day||'未取得'} · 报价采样 {stamp(d?.quoteCollectedAt)} · 计算 {stamp(d?.computedAt)}；同批细分榜单，非推荐排名。</p>
  <Link className="battle-more" to="/relay">查看异动接力<ArrowUpRight size={14}/></Link>
 </Frame>;
}
function Events({account}:{account:string}){const p=useAccountProfile(account),m=useQuery(publicQuery('/api/data/member?view=home',300000)),today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date()),work=useMemo(()=>personalWorkbench({pool:p.data?.profile?.pool||[],positions:p.data?.profile?.positions||[],member:m.data||{},today}),[p.data,m.data,today]);return <Frame queries={[p,m]}><div className="battle-event-list">{work.events.slice(0,8).map((e:any,i:number)=><article key={i}><small>{e.date} · {e.kind}</small><strong><StockLink code={e.code} name={e.name}/>{' · '}{e.title}</strong><p>{e.detail}</p><Link to={'/stock?code='+e.code+'&tab=events'}>查看个股事件</Link></article>)}</div>{!p.isPending&&!m.isPending&&!work.events.length&&<p className="empty">当前已取得资料没有匹配事件，不代表没有公告；可到个股档案检查原文。</p>}<p className="battle-source">仅聚合当前账号自选与持仓，保留每条披露日期；不自动修改研究待办。</p></Frame>;}
function Research({account}:{account:string}){
 const q=useInfiniteQuery({queryKey:['personal-research',account,'/api/research/library?search=&kind='],initialPageParam:0,queryFn:({pageParam,signal})=>getJSON('/api/research/library?search=&kind=&offset='+pageParam,signal),getNextPageParam:(p:any)=>p.nextOffset??undefined,enabled:account!=='guest',staleTime:30000,retry:retryRead(1)}),rows=q.data?.pages.flatMap(p=>p.archives||[])||[],page=usePanelPage<any>(rows,4);
 return <Frame queries={[q]}><div className="battle-research-list">{page.rows.map((r:any)=><Link to={'/my-research?archive='+encodeURIComponent(r.key)} key={r.key}><BookOpen size={15}/><div><strong>{r.name}</strong><small>{r.kind==='company'?'公司价值':r.kind==='industry'?'产业价值':'专题研究'} · 资料 {r.asof||'日期未提供'} · {r.versions}个版本</small></div></Link>)}</div><Pagination value={page} label="研究档案"/>{!q.isPending&&!rows.length&&<p className="empty">尚无已保存研究。从产业公司页保存副本，或进入“我的研究”建立记录。</p>}<Link className="battle-more" to="/my-research">进入我的研究<ArrowUpRight size={14}/></Link></Frame>;
}
export default function BattlePanels({panel,account,onConfigure}:{panel:DashboardPanel;account:string;onConfigure:()=>void}){
 switch(panel.kind){case 'market':return <Market panel={panel}/>;case 'index-chart':return <IndexChart panel={panel}/>;case 'indices':return <Indices/>;case 'watch':return <Personal holding={false} account={account}/>;case 'holdings':return <Personal holding account={account}/>;case 'security':return <Security panel={panel} onConfigure={onConfigure}/>;case 'themes':return <Themes/>;case 'funds':return <BattleFunds/>;case 'events':return <Events account={account}/>;case 'research':return <Research account={account}/>;}
}
