import {createContext,useContext,lazy,Suspense,useState,useCallback,useEffect,type ReactNode} from 'react';
import {useLocation} from 'react-router-dom';
import {Drawer,Skeleton} from './components';
const Agent=lazy(()=>import('./Agent'));
const AskContext=createContext<((value:any)=>void)|null>(null);
export const useAsk=()=>useContext(AskContext);
export function AskProvider({children}:{children:ReactNode}){const location=useLocation(),[state,setState]=useState<{open:boolean,value:any,revision:number}>({open:false,value:null,revision:0}),open=useCallback((value:any)=>setState(s=>({open:true,value:value||{context:{page:'研究工作台'}},revision:s.revision+1})),[]);useEffect(()=>setState(s=>s.open?{...s,open:false}:s),[location.key]);return <AskContext.Provider value={open}>{children}<Drawer open={state.open} onOpenChange={open=>{if(!open)state.value?.onDismiss?.();setState(s=>({...s,open}));}} onEscapeKeyDown={event=>{if(event.target instanceof Element&&event.target.closest('.agent-research-settings[open]'))event.preventDefault();}} title="问观澜 · 当前页面研究"><Suspense fallback={<Skeleton label="按需研究控件"/>}>{state.open&&<Agent key={state.revision} embedded handoffValue={state.value}/>}</Suspense></Drawer></AskContext.Provider>;}
