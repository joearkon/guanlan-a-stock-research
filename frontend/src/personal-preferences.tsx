import {PrivacyProvider} from './Privacy';
import {createContext,useContext,useEffect,useLayoutEffect,useState,useSyncExternalStore,type ReactNode} from 'react';
export type Preferences={theme:'dark'|'light';density:'comfortable'|'compact';fontScale:'small'|'standard'|'large';displayMode:'auto'|'mobile'|'desktop';sidebar:'auto'|'expanded'|'collapsed';motion:'system'|'reduced';defaultPage:string;reportDetail:'concise'|'standard'|'detailed';topics:string[]};
export const entryPages=[['/','今日研究台'],['/battle-dashboard','我的作战看板'],['/monitor','实时动态'],['/relay','异动接力'],['/market-observation','市场观测'],['/funding-observation','资金观测'],['/watchlist','我的自选'],['/holdings','我的持仓'],['/agent','问观澜'],['/industry','产业价值研究']];
export const defaultPreferences:Preferences={theme:'dark',density:'comfortable',fontScale:'standard',displayMode:'auto',sidebar:'auto',motion:'system',defaultPage:'/',reportDetail:'standard',topics:[]};
const event='guanlan:preferences',Scope=createContext('guest'),cache=new Map<string,{raw:string|null,value:Preferences}>();
export const preferenceKey=(account:string)=>'guanlan.preferences.v1.'+encodeURIComponent(account||'guest');
function normalize(v:any):Preferences{
 const pick=(key:keyof Preferences,allowed:string[])=>allowed.includes(v?.[key])?v[key]:defaultPreferences[key];
 return {theme:pick('theme',['dark','light']),density:pick('density',['comfortable','compact']),fontScale:pick('fontScale',['small','standard','large']),displayMode:pick('displayMode',['auto','mobile','desktop']),sidebar:pick('sidebar',['auto','expanded','collapsed']),motion:pick('motion',['system','reduced']),defaultPage:entryPages.some(([path])=>path===v?.defaultPage)?v.defaultPage:'/',reportDetail:pick('reportDetail',['concise','standard','detailed']),topics:[...new Set((Array.isArray(v?.topics)?v.topics:[]).filter(x=>typeof x==='string').map(x=>x.replace(/[<>\r\n]/g,' ').trim().slice(0,24)).filter(Boolean))].slice(0,8) as string[]};
}
export function readPreferences(account:string):Preferences{
 let raw:string|null=null;try{raw=localStorage.getItem(preferenceKey(account));if(raw===null&&account==='guest')raw=JSON.stringify({theme:localStorage.getItem('guanlan.theme')==='light'?'light':'dark',sidebar:localStorage.getItem('guanlan.sidebar.pinned')===null?'auto':localStorage.getItem('guanlan.sidebar.pinned')==='false'?'collapsed':'expanded'});}catch{}
 const old=cache.get(account);if(old&&old.raw===raw)return old.value;
 let parsed:any;try{parsed=JSON.parse(raw||'null');}catch{}const value=normalize(parsed);cache.set(account,{raw,value});return value;
}
export function savePreferences(account:string,value:Partial<Preferences>){
 const next=normalize({...readPreferences(account),...value});
 // A single atomic browser write. Never publish a state that failed to persist.
 localStorage.setItem(preferenceKey(account),JSON.stringify(next));window.dispatchEvent(new Event(event));
}
function subscribe(notify:()=>void){window.addEventListener(event,notify);window.addEventListener('storage',notify);return()=>{window.removeEventListener(event,notify);window.removeEventListener('storage',notify);};}
export function usePreferences(){const account=useContext(Scope);const preferences=useSyncExternalStore(subscribe,()=>readPreferences(account),()=>defaultPreferences);return {preferences,save:(value:Partial<Preferences>)=>savePreferences(account,value),account};}
export function PreferenceProvider({account,children}:{account:string;children:ReactNode}){return <Scope.Provider value={account}><ApplyPreferences/><PrivacyProvider account={account}>{children}</PrivacyProvider></Scope.Provider>;}
function subscribeViewport(notify:()=>void){const media=window.matchMedia?.('(max-width:767px)');media?.addEventListener('change',notify);return()=>media?.removeEventListener('change',notify);}
export function useMobileLayout(){const {preferences:p}=usePreferences();const narrow=useSyncExternalStore(subscribeViewport,()=>window.matchMedia?.('(max-width:767px)').matches??false,()=>false);return p.displayMode==='mobile'||(p.displayMode==='auto'&&narrow);}
function ApplyPreferences(){const {preferences:p}=usePreferences(),mobile=useMobileLayout();useLayoutEffect(()=>{document.documentElement.dataset.navigationLayout=mobile?'mobile':'desktop';},[mobile]);useEffect(()=>{const root=document.documentElement;root.style.setProperty('--user-font-scale',p.fontScale==='small'?'0.9':p.fontScale==='large'?'1.1':'1');root.dataset.fontScale=p.fontScale;root.dataset.theme=p.theme;root.dataset.density=p.density;root.dataset.uiMotion=p.motion;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',p.theme==='dark'?'#121212':'#f8fafc');window.dispatchEvent(new Event('guanlan:theme'));},[p.theme,p.density,p.motion,p.fontScale]);return null;}
export function useUiReducedMotion(){const {preferences}=usePreferences(),[system,setSystem]=useState(()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false);useEffect(()=>{const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!media)return;const sync=()=>setSystem(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);return system||preferences.motion==='reduced';}
