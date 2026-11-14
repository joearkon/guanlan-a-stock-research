import {useEffect,useState,type ReactNode}from'react';import {useQuery,useQueryClient}from'@tanstack/react-query';import {publicQuery,clearResourceCache}from'./api';import {PreferenceProvider}from'./personal-preferences';import PageLoading from'./PageLoading';
import {Navigate,useLocation}from'react-router-dom';
import {sessionExpiredSignal}from'./api';
export const sessionSignalKey='guanlan.local.session-change';
export function signalSessionChange(){window.dispatchEvent(new Event(sessionSignalKey));try{localStorage.setItem(sessionSignalKey,crypto.randomUUID());}catch{/* Memory-only event still works in this tab. */}}
export default function AccountScope({children}:{children:ReactNode}){
 const client=useQueryClient(),[generation,setGeneration]=useState(0);
 useEffect(()=>{const change=()=>{clearResourceCache();void client.cancelQueries().catch(()=>{});client.clear();try{sessionStorage.removeItem('guanlan.agent.pending-job');sessionStorage.removeItem('guanlan.agent.handoff');}catch{}setGeneration(g=>g+1);},storage=(e:StorageEvent)=>{if(e.key===sessionSignalKey)change();};window.addEventListener(sessionSignalKey,change);window.addEventListener(sessionExpiredSignal,change);window.addEventListener('storage',storage);return()=>{window.removeEventListener(sessionSignalKey,change);window.removeEventListener(sessionExpiredSignal,change);window.removeEventListener('storage',storage);};},[client]);
 return <Identity key={generation}>{children}</Identity>;
}
function Identity({children}:{children:ReactNode}){const me=useQuery({...publicQuery('/api/me',300000),retry:false});if(me.isPending&&!me.isFetched)return <PageLoading/>;return <PreferenceProvider account={String(me.data?.user?.id||'guest')}>{children}</PreferenceProvider>;}
export function LocalSessionGate({children}:{children:ReactNode}){
 const location=useLocation(),me=useQuery({...publicQuery('/api/me',0),retry:false,refetchOnMount:'always',refetchInterval:60000,refetchIntervalInBackground:false});
 if(me.isPending||me.isFetching&&!me.isFetchedAfterMount)return <PageLoading/>;
 const login='/login?'+new URLSearchParams({returnTo:'/next'+location.pathname+location.search+location.hash});
 if((me.error as any)?.status===401||!me.isError&&!me.data?.user)return <Navigate replace to={login}/>;
 if(me.isError)return <main className="empty" role="alert"><h1>暂时无法确认登录状态</h1><p>本机服务或网络读取失败，未显示账号内容，也不会自动运行 AI。</p><button className="outline-button" disabled={me.isFetching} onClick={()=>void me.refetch()}>重新检查登录</button></main>;
 return children;
}
