import {NavLink}from'react-router-dom';import {useQuery}from'@tanstack/react-query';import {Cpu}from'lucide-react';import {getJSON}from'./api';import {usePreferences}from'./personal-preferences';import './local-ai-status.css';
import {engineNames as names,shortEngineName}from'./local-engines';
import {useState}from'react';import {useLocation,Link}from'react-router-dom';import {AlertCircle,X}from'lucide-react';
export const localStatusKey=(account:string)=>['local-ai-status',account];
export function useLocalConnection(override?:string){const preferences=usePreferences(),account=override??preferences.account;return useQuery({queryKey:localStatusKey(account),queryFn:({signal})=>getJSON('/api/local-ai/status',signal),enabled:account!=='guest',retry:false,staleTime:10000,refetchInterval:60000,refetchIntervalInBackground:false});}
export default function LocalAIStatus({mobile=false,topbar=false}:{mobile?:boolean;topbar?:boolean}){
 const {account}=usePreferences(),query=useLocalConnection(),value=query.data;
 const kind=account==='guest'?'signed_out':query.error?'unknown':query.isPending?'checking':value?.kind||'unknown',label=account==='guest'?'登录后配置':query.error?'状态未确认':query.isPending?'正在检测':value?.label||'状态未确认',name=names[value?.engine]||'尚未配置';
 const title=[name,label,value?.billingSource,query.error?'本机服务状态读取失败，未自动调用模型。':value?.detail,value?.verifiedAt?'验证时间 '+new Date(value.verifiedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):''].filter(Boolean).join(' · ');
 return <NavLink to="/local-ai" className={'local-ai-status'+(mobile?' mobile-local-ai-status':'')+(topbar?' topbar-local-ai-status':'')} aria-label={'本地 AI Agent · '+name+' · '+label+'，打开配置'} title={title} data-connection-state={kind}>
  <span className="local-ai-status-icon"><Cpu size={19}/><i aria-hidden="true"/></span>{topbar?<span className="topbar-local-ai-name">{shortEngineName(value?.engine)}</span>:<span className="local-ai-status-copy"><span className="local-ai-status-heading">本地 AI Agent<span className="local-ai-status-label">{label}</span></span><small>{name}</small></span>}
 </NavLink>;
}
export function LocalAIStartup(){
 const {account}=usePreferences(),query=useLocalConnection(),location=useLocation(),[dismissed,setDismissed]=useState('');
 const kind=query.error?'unknown':query.data?.kind||'unknown',identity=account+':'+kind+':'+query.data?.engine+':'+query.data?.detail;
 if(account==='guest'||query.isPending||kind==='verified'||location.pathname==='/local-ai'||dismissed===identity)return null;
 const label=query.error?'本机服务读取失败':query.data?.label||'状态未确认',name=names[query.data?.engine]||'本地 AI Agent';
 return <aside className="local-ai-startup" role="status"><AlertCircle size={18}/><div><strong>{name} · {label}</strong><p>{query.error?'请确认本机服务仍在运行，再重新检测。':query.data?.detail||'请打开配置查看安装、登录和密钥状态。'}不会自动调用模型、重跑任务或切换计费来源。</p><div className="local-ai-startup-actions"><Link to="/local-ai">打开本地 AI Agent 配置</Link><button className="outline-button" disabled={query.isFetching} onClick={()=>void query.refetch()}>{query.isFetching?'正在检测…':'重新检测'}</button></div></div><button className="local-ai-startup-close" aria-label="关闭连接提示" onClick={()=>setDismissed(identity)}><X size={16}/></button></aside>;
}
