import {PrivacyToggle} from './Privacy';
import PlatformNotice from './PlatformNotice';
import MarketStatus from './MarketStatus';
import {AiAction,AiIcon} from './AiAction';
import {StrictMode,Suspense,lazy,useState,useEffect,Component,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,NavLink,Outlet,useLocation,Link} from 'react-router-dom';
import {QueryClientProvider,useQuery} from '@tanstack/react-query';
import {Home,Activity,History,Layers3,Star,MessageCircle,Bell,LoaderCircle,LayoutDashboard,ChartNoAxesCombined} from 'lucide-react';
import {queryClient,publicQuery} from './api';
import {Drawer,ThemeToggle,Skeleton} from './components';
import {initializeTheme} from './theme';
import {PreferenceProvider} from './personal-preferences';
import AccountScope,{LocalSessionGate} from './AccountScope';
import Notifications,{OfficialNotificationInbox as NotificationInbox,OfficialSecurity as Security}from'./OfficialServices';
import AlertToasts from './AlertToasts';
import FollowAlertOffer from './FollowAlertOffer';
const BoardSupportDrawer=lazy(()=>import('./BoardSupportDrawer'));
import PreferenceStartup from './PreferenceStartup';
import OnboardingProvider from './Onboarding';
import './personal-preferences.css';
import ReadStatus from './ReadStatus';
import Sidebar,{SidebarLabel} from './Sidebar';
import LocalAIStatus,{LocalAIStartup} from './LocalAIStatus';
import MobileNavigation from './MobileNavigation';
import RouteBoundary from './RouteBoundary';
import {installErrorListeners} from './client-errors';
import PageLoading from './PageLoading';
import {ReviewNavigation,LegacyReview} from './review-navigation';
import {StockDrawerProvider,useOpenStock} from './StockLink';
import {SiteSearch,AccountMenu} from './TopControls';
import {AskProvider,useAsk} from './AskContext';
import IndustryTree from './IndustryTree';
import './style.css';
import './theme.css';
import './motion.css';
import './shell-controls.css';
import './interaction-feedback.css';
import './portfolio-table.css';
import './typography.css';
import './shell-frame.css';
import './mobile-interaction.css';
initializeTheme();
installErrorListeners();
const OpsConsole=lazy(()=>import('./OpsConsole'));
const AccountUsage=lazy(()=>import('./LocalUsage'));
const ReleaseNotes=lazy(()=>import('./ReleaseNotes'));
const LocalAI=lazy(()=>import('./LocalAI'));
const Portfolio=lazy(()=>import('./Portfolio'));
const Market=lazy(()=>import('./ReviewWorkspace'));
const Radar=lazy(()=>import('./Radar'));
const Funding=lazy(()=>import('./CollectiveRelay').then(m=>({default:()=> <m.default funding/>})));
const HomePage=lazy(()=>import('./Home'));
const Monitor=lazy(()=>import('./Monitor'));
const StockObservation=lazy(()=>import('./StockObservation'));
const Relay=lazy(()=>import('./Relay'));
const Auction=lazy(()=>import('./Auction'));
const Stock=lazy(()=>import('./Stock'));
const Agent=lazy(()=>import('./Agent'));
const Pending=lazy(()=>import('./Pending'));
const IndustryHub=lazy(()=>import('./IndustryHub'));
const IndustryPage=lazy(()=>import('./IndustryHub').then(m=>({default:m.IndustryPage})));
const ValueResearch=lazy(()=>import('./ValueResearch'));
const IndustryCatalogPage=lazy(()=>import('./IndustryCatalogPage'));
const PortfolioReview=lazy(()=>import('./PortfolioReview'));
const Account=lazy(()=>import('./Account'));
const Auth=lazy(()=>import('./Auth'));
const BattleDashboard=lazy(()=>import('./BattleDashboard'));
const MyResearch=lazy(()=>import('./MyResearch'));
import './release.css';
const PersonalResearchEntry=lazy(()=>import('./PersonalResearchEntry'));
const IndustryAutomationRoute=lazy(()=>import('./IndustryAutomation').then(m=>({default:m.IndustryAutomationRoute})));
function AccountPreferences({children}:{children:ReactNode}){return <AccountScope><PreferenceStartup ready/>{children}</AccountScope>;}
function Layout(){const me=useQuery({...publicQuery('/api/me',300000),retry:false});return <OnboardingProvider account={String(me.data?.user?.id||'guest')} ready={!me.isPending&&!!me.data?.user}><LayoutContent user={me.data?.user}/></OnboardingProvider>;}
function LayoutContent({user}:{user:any}){
 const [boardSupport,setBoardSupport]=useState<any>(null);
 const openStock=useOpenStock();
 const ask=useAsk();
 const location=useLocation(),[notice,setNotice]=useState(false),[noticeId,setNoticeId]=useState(''),[search,setSearch]=useState(''),[clock,setClock]=useState('');
 useEffect(()=>{const update=()=>setClock(new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date()));update();const timer=setInterval(update,30000);return()=>clearInterval(timer);},[]);
 useEffect(()=>setNotice(false),[location.key]);
 useEffect(()=>{if(!('serviceWorker' in navigator))return;const onMessage=(event:MessageEvent)=>{if(event.data?.type!=='guanlan-open-notification')return;setNoticeId(/^[0-9a-f-]{36}$/i.test(event.data.id||'')?event.data.id:'');setNotice(true);};navigator.serviceWorker.addEventListener('message',onMessage);return()=>navigator.serviceWorker.removeEventListener('message',onMessage);},[]);
 const unread=useQuery({...publicQuery('/api/notifications/summary',30000),enabled:!!user,refetchInterval:60000});
 const isStocks=/^\/(?:watchlist|holdings|notifications|my-research)(?:\/|$)/.test(location.pathname),isReview=/observation|review|emotion|screener/.test(location.pathname),isMonitor=/monitor|relay|auction/.test(location.pathname);
 const name=location.pathname==='/local-ai'?'本地 AI Agent':location.pathname==='/screener'?'条件观测':location.pathname==='/updates'?'版本更新':location.pathname==='/account/usage'?'用量与额度':location.pathname==='/admin'?'管理后台':location.pathname==='/battle-dashboard'?'我的作战看板':location.pathname==='/my-research'?'我的研究':location.pathname==='/account'?'我的账号':location.pathname.includes('security')?'密码与安全邮箱':location.pathname.startsWith('/industry')?'产业价值研究':location.pathname==='/notifications'?'提醒与消息':location.pathname==='/agent'?'问观澜':location.pathname==='/stock'?'个股档案':location.pathname==='/coming-soon'?'产业价值研究':location.pathname==='/funding-observation'?'资金观测':location.pathname==='/review'?'市场观测':location.pathname==='/emotion'?'情绪观测':location.pathname==='/radar-observation'?'雷达观测':location.pathname==='/relay'?'异动接力':location.pathname==='/auction'?'竞价盘中':isMonitor?'实时动态':isStocks?'自选与持仓':isReview?'市场观测':'今日研究台';
 return <>
  <Sidebar brand={<div className="sidebar-brand-row"><Link to="/" className="brand"><img src="/v2/assets/imgGuanlanLogoMarkHdPng.png?v=dd1f792049fc" alt="观澜品牌标识"/><div><strong>观澜 <span className="brand-beta" title="观澜 v1.0.0-beta.1">内测版</span></strong><small>v1.0.0 · A股研究平台</small></div></Link><MarketStatus calendarUrl={location.pathname==='/'?'/api/data/free?view=home':'/api/data/free?view=watch'}/></div>}>
   <nav aria-label="主导航" data-tour="navigation">
    <NavLink to="/" end aria-label="首页"><Home/><SidebarLabel>首页</SidebarLabel></NavLink>
    <NavLink to="/monitor" aria-label="盯盘" className={isMonitor?'active':''}><Activity/><SidebarLabel>盯盘</SidebarLabel></NavLink>
    {isMonitor&&<div className="subnav"><NavLink to="/monitor">实时动态</NavLink><NavLink to="/relay">异动接力</NavLink><NavLink to="/auction">竞价盘中</NavLink></div>}
    <NavLink to="/market-observation" aria-label="复盘" data-tour="review" className={isReview?'active':''}><History/><SidebarLabel>复盘</SidebarLabel></NavLink>
    {isReview&&<ReviewNavigation/>}
    <NavLink to="/industry" aria-label="产业价值研究" data-tour="industry"><Layers3/><SidebarLabel>产业价值研究</SidebarLabel></NavLink>
    {location.pathname.startsWith('/industry')&&<IndustryTree/>}
    <NavLink to="/stock" aria-label="个股档案" data-tour="stock-dossier"><ChartNoAxesCombined/><SidebarLabel>个股档案</SidebarLabel></NavLink>
    <NavLink to="/battle-dashboard" aria-label="我的作战看板" data-tour="battle"><LayoutDashboard/><SidebarLabel>我的作战看板</SidebarLabel></NavLink>
    <NavLink to="/watchlist" aria-label="我的股票" data-tour="stocks" className={isStocks?'active':''}><Star/><SidebarLabel>我的股票</SidebarLabel></NavLink>
    {isStocks&&<div className="subnav"><NavLink to="/watchlist" className={/watchlist|holdings/.test(location.pathname)?'active':''}>自选与持仓</NavLink><NavLink to="/my-research">我的研究</NavLink><NavLink to="/notifications">提醒</NavLink></div>}
    <NavLink to="/agent" aria-label="问观澜" className="ai-navigation"><AiIcon/><SidebarLabel>问观澜</SidebarLabel></NavLink>
    <LocalAIStatus/>
   </nav>
  </Sidebar>
  <header className="topbar">
   <MarketStatus calendarUrl={location.pathname==='/'?'/api/data/free?view=home':'/api/data/free?view=watch'}/>
   <div className="breadcrumb">{location.pathname==='/battle-dashboard'?'个人空间':location.pathname==='/stock'?'个股资料':location.pathname.startsWith('/industry')?'产业研究':isStocks?'我的股票':isReview?'复盘':isMonitor?'盯盘':'首页'}<span>›</span><strong>{name}</strong></div>
   <SiteSearch key={'search:'+(user?.id||'guest')} onPick={code=>openStock?.({code})}/>
   <time>北京时间 {clock}</time>
   <ThemeToggle/>
   <PrivacyToggle/>
   <button className="icon-button" aria-label="打开消息" onClick={()=>{setNoticeId('');setNotice(true);}}><Bell size={17}/>{unread.data?.unread>0&&<span className="notification-badge" title={'最高优先级 L'+unread.data.highestPriority}>{unread.data.unread>99?'99+':unread.data.unread}</span>}</button>
   <AccountMenu key={'account:'+(user?.id||'guest')} user={user}/>
   <LocalAIStatus topbar/>
   <AiAction data-tour="ask" className="primary" aria-label="问观澜" onClick={()=>ask?.({context:{page:name},returnTo:'/next'+location.pathname+location.search})}><span className="topbar-ask-label">问观澜</span></AiAction>
  </header>
  <main className="route-content"><LocalAIStartup/><RouteBoundary key={location.pathname}>{location.pathname.startsWith('/industry')&&<Suspense fallback={null}><div className="industry-utility-bar"><IndustryAutomationRoute/><PersonalResearchEntry/></div></Suspense>}<Suspense fallback={<PageLoading/>}><Outlet/></Suspense></RouteBoundary></main>
  <footer><PlatformNotice/><ReadStatus page={name} frozenResearch={/^\/industry\/(?:dividend|consumer|media|gaming)(?:\/|$)/.test(location.pathname)||location.pathname.startsWith('/industry/ai-compute/liquid-cooling')||location.pathname.startsWith('/industry/batteries/storage')}/></footer>
  <MobileNavigation key={'mobile-navigation:'+(user?.id||'guest')} user={user}/>
  <Drawer open={notice} onOpenChange={setNotice} title="消息中心" className="notice-drawer"><Suspense fallback={<p>正在读取最近消息，当前页面保持可用…</p>}><NotificationInbox compact messageId={noticeId}/></Suspense></Drawer>
  <AlertToasts key={'alerts:'+(user?.id||'guest')} account={String(user?.id||'guest')} receipt={unread.data} onOpen={id=>{setNoticeId(id);setNotice(true);}} onBoard={m=>setBoardSupport({...m,accountId:String(user?.id)})} onStock={m=>openStock?.(m)}/>
  <FollowAlertOffer key={'follow-alerts:'+(user?.id||'guest')} account={String(user?.id||'guest')}/>
  {boardSupport?.accountId===String(user?.id)&&<Suspense fallback={<Drawer open onOpenChange={v=>!v&&setBoardSupport(null)} title="板块梯队与支撑证据"><Skeleton label="板块梯队与支撑证据"/></Drawer>}><BoardSupportDrawer target={boardSupport} onClose={()=>setBoardSupport(null)}/></Suspense>}
 </>;
}
function App(){return <QueryClientProvider client={queryClient}><BrowserRouter basename="/next"><AccountPreferences><AskProvider><StockDrawerProvider><Routes><Route path="login" element={<Suspense fallback={<PageLoading/>}><Auth/></Suspense>}/><Route path="logout" element={<Suspense fallback={<PageLoading/>}><Account mode="logout"/></Suspense>}/><Route element={<LocalSessionGate><Layout/></LocalSessionGate>}>
 <Route index element={<HomePage/>}/><Route path="battle-dashboard" element={<BattleDashboard/>}/><Route path="watchlist" element={<Portfolio mode="watchlist"/>}/><Route path="holdings" element={<Portfolio mode="holdings"/>}/>
 <Route path="market-observation" element={<Market/>}/><Route path="funding-observation" element={<Funding/>}/><Route path="review" element={<LegacyReview kind="notes"/>}/>
 <Route path="emotion" element={<LegacyReview kind="emotion"/>}/><Route path="radar-observation" element={<Radar/>}/>
 <Route path="monitor" element={<Monitor/>}/><Route path="relay" element={<Relay/>}/><Route path="auction" element={<Auction/>}/><Route path="screener" element={<StockObservation/>}/>
 <Route path="stock" element={<Stock/>}/><Route path="my-research" element={<MyResearch/>}/><Route path="notifications" element={<Notifications/>}/>
 <Route path="agent" element={<Agent/>}/><Route path="admin" element={<OpsConsole/>}/><Route path="account/usage" element={<AccountUsage/>}/>
 <Route path="updates" element={<ReleaseNotes/>}/>
 <Route path="local-ai" element={<LocalAI/>}/>
 <Route path="account" element={<Account mode="account"/>}/><Route path="account/security" element={<Security/>}/><Route path="security" element={<Security/>}/>
 <Route path="industry" element={<IndustryHub/>}/><Route path="industry/semiconductors/advanced-process" element={<IndustryPage industryId="semiconductors" advanced/>}/><Route path="industry/semiconductors/equipment" element={<IndustryPage industryId="semiconductors"/>}/><Route path="industry/semiconductors/equipment/:process" element={<IndustryPage industryId="semiconductors"/>}/><Route path="industry/semiconductors/companies/:code" element={<IndustryPage industryId="semiconductors"/>}/><Route path="industry/semiconductors/layers/:layer" element={<IndustryPage industryId="semiconductors"/>}/><Route path="industry/semiconductors/layers/:layer/:segment" element={<IndustryPage industryId="semiconductors"/>}/><Route path="industry/ai-compute/*" element={<IndustryPage industryId="ai-compute"/>}/><Route path="industry/:industryId" element={<IndustryPage/>}/><Route path="coming-soon" element={<Pending/>}/>
 <Route path="industry/semiconductors/layers/cleanroom/companies/:code" element={<IndustryPage industryId="semiconductors"/>}/>
 <Route path="industry/media/*" element={<ValueResearch/>}/><Route path="industry/gaming/*" element={<ValueResearch/>}/><Route path="industry/compare" element={<IndustryCatalogPage/>}/><Route path="industry/ai-applications/*" element={<ValueResearch/>}/><Route path="industry/robotics/*" element={<ValueResearch/>}/><Route path="industry/batteries/*" element={<ValueResearch/>}/><Route path="industry/coal/*" element={<IndustryCatalogPage/>}/><Route path="industry/oil-gas/*" element={<IndustryCatalogPage/>}/><Route path="industry/dividend/*" element={<ValueResearch/>}/><Route path="industry/consumer/*" element={<ValueResearch/>}/>
 <Route path="portfolio-review" element={<PortfolioReview/>}/>
 <Route path="*" element={<section className="empty"><h1>页面未找到</h1><p>该页面不存在或地址已更新，请从导航选择功能。</p><Link className="outline-button" to="/">返回首页</Link></section>}/>
 </Route></Routes></StockDrawerProvider></AskProvider></AccountPreferences></BrowserRouter></QueryClientProvider>;}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
