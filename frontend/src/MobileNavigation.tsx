import {useEffect,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {motion} from 'motion/react';
import {Home,Activity,Layers3,Star,Grid2X2,History,ChartNoAxesCombined,LayoutDashboard,Bell,BookOpen,Wallet,Search,Filter,UserRound,Settings2,HelpCircle,ChevronLeft,type LucideIcon} from 'lucide-react';
import {Drawer} from './components';
import {AiIcon} from './AiAction';
import {PrivacyToggle} from './Privacy';
import PersonalSettings from './PersonalSettings';
import HelpCenter from './HelpCenter';
import {useOnboarding} from './Onboarding';
import {useMobileLayout,useUiReducedMotion} from './personal-preferences';
import {uiMotion} from './motion-tokens';
import {monitorLinks,isMonitorPath} from './monitor-navigation';
import './mobile-navigation.css';
import LocalAIStatus from './LocalAIStatus';

const groups:{title:string;links:[string,string,LucideIcon][]}[]=[
 {title:'首页与盯盘',links:[['/','今日研究台',Home],...monitorLinks().map(([to,label]):[string,string,LucideIcon]=>[to,label,Activity])]},
 {title:'复盘与观测',links:[['/market-observation','市场观测',History],['/screener','条件观测',Filter],['/funding-observation','资金观测',ChartNoAxesCombined],['/radar-observation','雷达观测',Search]]},
 {title:'研究与个人工作区',links:[['/stock','个股档案',ChartNoAxesCombined],['/industry','产业价值研究',Layers3],['/battle-dashboard','我的作战看板',LayoutDashboard],['/watchlist','我的自选',Star],['/holdings','我的持仓',Wallet],['/my-research','我的研究',BookOpen],['/notifications','提醒与消息',Bell]]}
];

export default function MobileNavigation({user}:{user:any}){
 const mobile=useMobileLayout(),reduced=useUiReducedMotion(),location=useLocation(),guide=useOnboarding();
 const [panel,setPanel]=useState<'menu'|'settings'|'help'|null>(null);
 useEffect(()=>setPanel(null),[location.key]);
 const path=location.pathname,monitor=isMonitorPath(path),review=/^\/(market-observation|screener|funding-observation|radar-observation|review|emotion)(\/|$)/.test(path),stocks=['/watchlist','/holdings'].includes(path);
 const items=[{to:'/',label:'首页',icon:Home,active:path==='/'},{to:'/monitor',label:'盯盘',icon:Activity,active:monitor},{to:'/market-observation',label:'复盘',icon:History,active:review},{to:'/watchlist',label:'我的股票',icon:Star,active:stocks}];
 return <>{mobile&&<motion.nav className="mobile-bottom-nav" aria-label="底部导航" data-tour="navigation" initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:uiMotion.normal,ease:uiMotion.ease}}>{items.map(({to,label,icon:Icon,active})=><Link key={to} to={to} data-tour={to==='/market-observation'?'review':to==='/watchlist'?'stocks':undefined} aria-current={active?'page':undefined} className={active?'active':''}><Icon size={20}/><span>{label}</span></Link>)}<button type="button" data-tour="more" aria-haspopup="dialog" aria-expanded={panel!==null} className={panel||(!items.some(i=>i.active))?'active':''} onClick={()=>setPanel('menu')}><Grid2X2 size={20}/><span>更多</span></button></motion.nav>}
  <Drawer open={panel!==null} onOpenChange={open=>!open&&setPanel(null)} title={panel==='settings'?'界面偏好':panel==='help'?'关于与使用说明':'全部功能'} className="mobile-menu-drawer">
   {panel==='menu'&&<div className="mobile-feature-menu">
    <Link to="/agent" className="mobile-ask-entry"><AiIcon/><span><strong>问观澜</strong><small>带着问题研究，确认发送后才调用模型</small></span></Link>
    <LocalAIStatus mobile/>
    {groups.map(group=><section key={group.title}><h3>{group.title}</h3><div className="mobile-menu-grid">{group.links.map(([to,label,Icon])=><Link key={to} to={to} aria-current={path===to?'page':undefined}><Icon size={20}/><span>{label}</span></Link>)}</div></section>)}
    <section><h3>我的与设置</h3><div className="mobile-menu-grid">
     <Link to={user?'/account':'/login'}><UserRound size={20}/><span>{user?'我的账号':'登录'}</span></Link>
     {user&&<Link to="/account/usage"><ChartNoAxesCombined size={20}/><span>用量与额度</span></Link>}
     <Link to="/updates"><History size={20}/><span>版本更新</span></Link>
     <button type="button" onClick={()=>setPanel('settings')}><Settings2 size={20}/><span>界面偏好</span></button>
     <button type="button" onClick={()=>setPanel('help')}><HelpCircle size={20}/><span>使用说明</span></button>
     {user?.isAdmin===true&&<Link to="/admin"><Settings2 size={20}/><span>管理后台</span></Link>}
    </div><div className="mobile-menu-privacy"><PrivacyToggle/></div></section>
   </div>}
   {panel==='settings'&&<><button type="button" className="outline-button mobile-menu-back" onClick={()=>setPanel('menu')}><ChevronLeft size={16}/>全部功能</button><PersonalSettings onClose={()=>setPanel(null)}/></>}
   {panel==='help'&&<><button type="button" className="outline-button mobile-menu-back" onClick={()=>setPanel('menu')}><ChevronLeft size={16}/>全部功能</button><HelpCenter onRestart={()=>{setPanel(null);guide.start();}}/></>}
  </Drawer>
 </>;
}
