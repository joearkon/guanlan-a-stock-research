import {useEffect,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {motion} from 'motion/react';
import {PanelLeftClose,PanelLeftOpen} from 'lucide-react';
import {usePreferences,useUiReducedMotion} from './personal-preferences';
import {uiMotion} from './motion-tokens';
import './sidebar.css';
const preference='guanlan.sidebar.pinned';
export default function Sidebar({children,brand}:{children:ReactNode;brand?:ReactNode}){
 const {preferences,save}=usePreferences(),[error,setError]=useState('');
 const [narrow,setNarrow]=useState(()=>window.matchMedia?.('(max-width:1100px)').matches??false);
 useEffect(()=>{const media=window.matchMedia?.('(max-width:1100px)');if(!media)return;const sync=()=>setNarrow(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
 const pinned=preferences.sidebar==='auto'?!narrow:preferences.sidebar==='expanded';
 const setPinned=(value:boolean)=>{try{save({sidebar:value?'expanded':'collapsed'});try{localStorage.setItem(preference,String(value));}catch{}setError('');}catch{setError('导航状态未保存，请检查浏览器存储设置');}};
 const [tip,setTip]=useState<{label:string;top:number;left:number}|null>(null),reduced=useUiReducedMotion();
 const expanded=pinned;
 const showTip=(target:EventTarget|null)=>{const link=target instanceof Element?target.closest<HTMLElement>('nav>a'):null;if(pinned||!link){setTip(null);return;}const rect=link.getBoundingClientRect();setTip({label:link.getAttribute('aria-label')||link.textContent||'',top:rect.top+rect.height/2,left:rect.right+12});};
 useEffect(()=>{document.documentElement.dataset.sidebarMode=pinned?'pinned':'rail';setTip(null);return()=>{delete document.documentElement.dataset.sidebarMode;};},[pinned]);
 return <><motion.aside layout={!reduced} initial={false} animate={expanded?'expanded':'collapsed'} transition={{layout:{duration:reduced?0:uiMotion.panel,ease:uiMotion.ease}}} className="sidebar" data-expanded={expanded} onMouseOver={e=>showTip(e.target)} onMouseLeave={()=>setTip(null)} onFocusCapture={e=>showTip(e.target)} onBlurCapture={()=>setTip(null)} onKeyDown={e=>{if(e.key==='Escape')setTip(null);}}>
  <div className="sidebar-header">{brand}</div>
  <motion.div layout={reduced?false:'position'} className="sidebar-content" onScroll={()=>setTip(null)}>{children}</motion.div>
  <div className="sidebar-controls"><button type="button" aria-label={pinned?'收起导航':'展开导航'} aria-expanded={expanded} title={pinned?'收起为图标栏':'展开导航'} onClick={()=>{setPinned(!pinned);setTip(null);}}>{pinned?<PanelLeftClose size={18}/>:<PanelLeftOpen size={18}/>}<SidebarLabel>{pinned?'收起导航':'展开导航'}</SidebarLabel></button></div>
 {error&&<p role="alert" className="sr-only">{error}</p>}</motion.aside>{tip&&createPortal(<div className="sidebar-tooltip" role="tooltip" style={{top:tip.top,left:tip.left}}>{tip.label}</div>,document.body)}</>;
}
// Motion's installed hook captures the initial preference; subscribe so an OS
// preference change also applies without requiring a page reload.
export function SidebarLabel({children}:{children:ReactNode}){const reduced=useUiReducedMotion();return <motion.span className="sidebar-label" variants={{expanded:{opacity:1,x:0},collapsed:{opacity:0,x:-8}}} transition={{duration:reduced?0:uiMotion.normal,ease:uiMotion.ease}}>{children}</motion.span>;}
