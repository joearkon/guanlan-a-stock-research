import {useSyncExternalStore} from 'react';
import {usePreferences} from './personal-preferences';
import {useState} from 'react';
import {Sun,Moon} from 'lucide-react';
type Theme='dark'|'light';
const event='guanlan:theme';
export function initializeTheme(){let theme:Theme='dark';try{if(localStorage.getItem('guanlan.theme')==='light')theme='light';}catch{/* Storage may be unavailable; do not block rendering. */}applyTheme(theme,false);}
function applyTheme(theme:Theme,persist=true){document.documentElement.dataset.theme=theme;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#121212':'#f8fafc');if(persist)try{localStorage.setItem('guanlan.theme',theme);}catch{}window.dispatchEvent(new Event(event));}
const snapshot=():Theme=>document.documentElement.dataset.theme==='light'?'light':'dark';
function subscribe(notify:()=>void){window.addEventListener(event,notify);return()=>window.removeEventListener(event,notify);}
export function useTheme(){return useSyncExternalStore(subscribe,snapshot,()=> 'dark' as Theme);}
export function ThemeToggle(){const theme=useTheme(),{save}=usePreferences(),[error,setError]=useState('');return <><span className="sr-only" role={error?'alert':undefined}>{error}</span> <button type="button" className="icon-button theme-toggle" aria-label={theme==='dark'?'切换为白天模式':'切换为黑夜模式'} title={theme==='dark'?'白天模式':'黑夜模式'} onClick={()=>{try{const next=theme==='dark'?'light':'dark';save({theme:next});applyTheme(next,false);setError('');}catch{setError('主题未保存，请检查浏览器存储设置');}}}>{theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button></>;}
