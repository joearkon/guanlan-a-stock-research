import {Cpu}from'lucide-react';import {Link,useInRouterContext}from'react-router-dom';import {useLocalConnection}from'./LocalAIStatus';import {engineName}from'./local-engines';import './local-agent-entry.css';
export function useAgentConnection(account?:string){const query=useLocalConnection(account);return{...query,ready:!query.error&&query.data?.kind==='verified'};}
export default function LocalAgentEntry({account,onConfigure}:{account?:string,onConfigure?:()=>void}){
 const query=useAgentConnection(account),router=useInRouterContext(),label=query.ready?'更换 AI Agent':'使用自己的 AI Agent',props={className:'outline-button',onClick:onConfigure};
 return <aside className="local-agent-entry" data-connection-state={query.error?'unknown':query.data?.kind||'checking'}><Cpu size={17}/><div><strong>{query.data?.engine?'当前 Agent：'+engineName(query.data.engine):'本地版使用你自己的 AI Agent'}</strong><small>{query.ready?'已连接 · 使用本人供方额度，不使用观澜平台 AI':query.isPending?'正在确认连接状态，尚未运行模型':query.error?'连接状态读取失败，不能发起 AI 分析':(query.data?.label||'未配置')+' · 连接通过后才能分析，本地版没有平台 AI 兜底'}</small></div>{router?<Link to="/local-ai" {...props}>{label}</Link>:<a href="/next/local-ai" {...props}>{label}</a>}</aside>;
}
