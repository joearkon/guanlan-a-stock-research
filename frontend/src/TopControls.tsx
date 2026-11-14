import {PrivateValue,usePrivacy} from './Privacy';
import {useEffect,useRef,useState} from 'react';
import {AnimatePresence,motion} from 'motion/react';
import {Search,UserRound,ChevronDown,Eye,EyeOff,ChartNoAxesCombined,Settings2,BookOpen,GraduationCap,History,ShieldCheck,LogOut} from 'lucide-react';
import {Link} from 'react-router-dom';
import SecurityAutocomplete from './SecurityAutocomplete';
import type {SecurityAsset} from './security-lookup';
import {Drawer} from './components';
import PersonalSettings from './PersonalSettings';
import HelpCenter from './HelpCenter';
import {useOnboarding} from './Onboarding';
import {useUiReducedMotion} from './personal-preferences';
import {uiMotion} from './motion-tokens';
import './account-menu.css';
export function SiteSearch({onPick}:{onPick:(code:string)=>void}){
 const [text,setText]=useState(''),[recent,setRecent]=useState<SecurityAsset[]>([]),root=useRef<HTMLFormElement>(null);
 useEffect(()=>{const shortcut=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();root.current?.querySelector('input')?.focus();}};document.addEventListener('keydown',shortcut);return()=>document.removeEventListener('keydown',shortcut);},[]);
 return <form ref={root} data-tour="search" className="search" role="search" onSubmit={e=>e.preventDefault()}><Search size={16}/><SecurityAutocomplete label="搜索股票" hideLabel popoverStatus recent={recent} value={text} onChange={setText} onSelect={item=>{setRecent(old=>[item,...old.filter(x=>x.code!==item.code)].slice(0,8));onPick(item.code);setText('');}} placeholder="代码 / 名称 / 首字母"/><kbd>⌘ / Ctrl K</kbd></form>;
}
export function AccountMenu({user}:{user:any}){
 const reduced=useUiReducedMotion(),guide=useOnboarding(),privacy=usePrivacy();
 const [help,setHelp]=useState(false);
 const [open,setOpen]=useState(false),[preferences,setPreferences]=useState(false),root=useRef<HTMLDivElement>(null),button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;const close=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[open]);
 useEffect(()=>{if(open)root.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus();},[open]);
 if(!user)return <a className="user-button" href={'/next/login?returnTo='+encodeURIComponent(location.pathname+location.search)}><UserRound size={17}/>登录</a>;
 const close=()=>{setOpen(false);button.current?.focus();};
 return <><div className="account-control" data-tour="account" ref={root} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}}><button ref={button} className="user-button" aria-label="我的账号菜单" aria-haspopup="menu" aria-expanded={open} onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);}}} onClick={()=>setOpen(v=>!v)}><UserRound size={17}/><span>我的</span><ChevronDown size={12} className="account-chevron"/></button>
 <AnimatePresence>{open&&<motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:reduced?0:uiMotion.normal,ease:uiMotion.ease}} role="menu" className="account-menu" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const items=[...e.currentTarget.querySelectorAll<HTMLElement>('[role^=menuitem]')],i=items.indexOf(document.activeElement as HTMLElement),n=e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[n]?.focus();}}}>
 <div className="account-identity"><strong>{user.name||user.nickname||'已登录账号'}</strong><small><PrivateValue>{user.email||'已登录'}</PrivateValue></small></div>
 <div role="group" aria-label="账号与用量" className="account-menu-group">
  <Link role="menuitem" className="account-action" to="/account" onClick={close}><UserRound size={17}/><span>我的账号</span></Link>
  <Link role="menuitem" className="account-action" to="/account/usage" onClick={close}><ChartNoAxesCombined size={17}/><span>用量与额度</span></Link>
 </div>
 <div role="group" aria-label="个性化与隐私" className="account-menu-group">
  <Link role="menuitem" className="account-action" to="/local-ai" onClick={close}><Settings2 size={17}/><span>本地 AI Agent</span></Link>
  <button role="menuitem" className="account-action" onClick={()=>{close();setPreferences(true);}}><Settings2 size={17}/><span>个性化设置</span></button>
  {privacy.available&&<button type="button" role="menuitemcheckbox" aria-checked={privacy.hidden} className="account-action privacy-menu-item" onClick={privacy.toggle}>{privacy.hidden?<EyeOff size={17}/>:<Eye size={17}/>}<span className="privacy-menu-label">隐私模式</span><span className="privacy-menu-state">{privacy.hidden?'已开启':'已关闭'}</span><span className="privacy-menu-switch" aria-hidden="true"/></button>}
 </div>
 <div role="group" aria-label="帮助与版本" className="account-menu-group">
  <button role="menuitem" className="account-action" onClick={()=>{close();setHelp(true);}}><BookOpen size={17}/><span>关于与使用说明</span></button>
  <button role="menuitem" className="account-action" onClick={()=>{close();guide.start();}}><GraduationCap size={17}/><span>新手引导</span></button>
  <Link role="menuitem" className="account-action" to="/updates" onClick={close}><History size={17}/><span>版本更新</span></Link>
 </div>
 <div role="group" aria-label="管理与退出" className="account-menu-group account-menu-footer">
  {user.isAdmin===true&&<Link role="menuitem" className="account-action" to="/admin" onClick={close}><ShieldCheck size={17}/><span>管理后台</span></Link>}
  <Link role="menuitem" className="account-action account-signout" to="/logout" onClick={close}><LogOut size={17}/><span>退出登录</span></Link>
 </div>
 </motion.div>}</AnimatePresence></div><Drawer open={help} onOpenChange={setHelp} title="关于与使用说明">{help&&<HelpCenter onRestart={()=>{setHelp(false);guide.start();}}/>}</Drawer><Drawer open={preferences} onOpenChange={setPreferences} title="个性化设置" className="personal-settings-drawer">{preferences&&<PersonalSettings onClose={()=>setPreferences(false)}/>}</Drawer></>;
}
