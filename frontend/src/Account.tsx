import {useEffect,useRef,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Link,useNavigate} from 'react-router-dom';
import {publicQuery,clearResourceCache} from './api';
import {Widget} from './components';
import {LoaderCircle} from 'lucide-react';
import './account.css';
import {signalSessionChange}from'./AccountScope';
export default function Account({mode}:{mode:'account'|'logout'}){
 const client=useQueryClient(),navigate=useNavigate(),me=useQuery({...publicQuery('/api/me',300000),retry:false});
 const [busy,setBusy]=useState(''),[message,setMessage]=useState(''),locked=useRef(false),request=useRef<AbortController|null>(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 useEffect(()=>{if(mode!=='logout')return;const timer=setTimeout(()=>void write('logout','/api/auth/logout','POST'),0);return()=>clearTimeout(timer);},[mode]);
 async function write(kind:string,url:string,method:string,body?:any){
  if(locked.current)return;
  if(kind==='logout'&&client.isMutating()>0){setMessage('资料仍在保存，请等待保存完成后退出');return;}
  locked.current=true;setBusy(kind);setMessage('');request.current=new AbortController();
  try{
   const r=await fetch(url,{method,credentials:'same-origin',headers:{'content-type':'application/json','x-gl':'1'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.any([request.current.signal,AbortSignal.timeout(20000)])});
   const value=await r.json().catch(()=>({}));if(!r.ok)throw Error(value.error||'操作未成功，请重试');
   if(kind==='logout'){
    await client.cancelQueries();clearResourceCache();client.clear();
    try{sessionStorage.removeItem('guanlan.agent.pending-job');sessionStorage.removeItem('guanlan.agent.handoff');}catch{/* Server logout succeeded; unavailable browser storage must not block leaving. */}
    navigate('/login',{replace:true});signalSessionChange();return;
   }
   clearResourceCache();
   client.setQueryData(['resource','/api/me'],(old:any)=>({...old,devices:old.devices.filter(d=>String(d.id)!==kind)}));setMessage('该设备已退出');
   await client.invalidateQueries({queryKey:['resource','/api/me']});
  }catch(e:any){if(e.name!=='AbortError')setMessage(e.name==='TimeoutError'?'请求超时，退出结果尚未确认。请检查网络后重试。':e.message);}
  finally{locked.current=false;setBusy('');}
 }
 if(mode==='logout')return <section className="account-exit" aria-live="polite"><h1>{message?'退出尚未完成':'正在退出登录'}</h1>{message?<><p role="alert">{message}</p><button className="outline-button" disabled={!!busy} onClick={()=>write('logout','/api/auth/logout','POST')}>重试退出</button></>:<p role="status"><LoaderCircle size={18} className="spin"/>正在安全退出当前设备，即将返回登录页…</p>}</section>;
 if(me.data&&!me.data.user)return <div className="account-page"><h1>我的账号</h1><Widget title="请先登录"><p>登录后可以管理密码、安全邮箱和登录设备。</p><a className="primary" href="/next/login?returnTo=%2Fnext%2Faccount">前往登录</a></Widget></div>;
 return <div className="account-page"><div className="page-heading"><h1>我的账号</h1><p className="muted">管理登录方式、安全邮箱与设备，不影响持仓和研究记录。</p></div>
 <Widget title="账号概况" loading={me.isPending} refreshing={me.isFetching&&!me.isPending} error={me.error?.message} retry={()=>me.refetch()}>{me.data?.user&&<div className="account-facts"><p>账号编号 <strong>{me.data.user.id}</strong></p><p>当前权益 <strong>{me.data.plan==='expert'?'专家':me.data.plan?'会员':'无有效权益'}</strong>{me.data.expires&&<span>有效期至 {me.data.expires}</span>}</p><p>安全邮箱 <strong>{me.data.user.email||'尚未绑定'}</strong></p></div>}</Widget>
 {me.data?.user&&<Widget title="登录与安全"><div className="account-setting-row"><div><h3>登录密码</h3><p>修改需验证当前密码，成功后其他设备会退出登录。</p></div><Link className="outline-button" to="/account/security#password">修改密码</Link></div><div className="account-setting-row"><div><h3>安全邮箱</h3><p>{me.data.user.email||'尚未绑定'}；需验证目标邮箱，邮箱验证码不能代替密码。</p></div><Link className="outline-button" to="/account/security#email">{me.data.user.email?'更换邮箱':'绑定邮箱'}</Link></div></Widget>}
 <Widget title="已登录设备" loading={me.isPending} error={me.error?.message} retry={()=>me.refetch()}>{(me.data?.devices||[]).map(d=><div className="account-device" key={d.id}><span>{d.device}{d.current?' · 当前设备':''}</span>{!d.current&&<button className="outline-button" disabled={!!busy} aria-label={'退出此设备 '+d.device} onClick={()=>write(String(d.id),'/api/auth/sessions/'+encodeURIComponent(d.id),'DELETE')}>退出此设备</button>}</div>)}{me.data&&!me.data.devices?.length&&<p className="empty">暂无设备信息。</p>}</Widget>
 {message&&<p role="status" className="account-message">{message}</p>}<div className="account-actions"><Link className="outline-button" to="/logout">退出登录</Link></div></div>;
}
