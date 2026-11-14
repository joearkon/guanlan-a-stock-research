import {useEffect,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {LoaderCircle,Smartphone,ShieldCheck} from 'lucide-react';
import {publicQuery} from './api';
import {normalizeSmsPhone,validSmsCode,validSmsChallenge} from '../../web/shared/sms-auth-contract.mjs';

type Props={initialPurpose?:'login'|'register';onSuccess:()=>Promise<void>;onBusyChange:(busy:boolean)=>void};
export default function SmsAuth({initialPurpose='login',onSuccess,onBusyChange}:Props){
 const config=useQuery({...publicQuery('/api/auth/sms/config',0),retry:false,refetchOnWindowFocus:false});
 const [purpose,setPurpose]=useState(initialPurpose),[phone,setPhone]=useState(''),[code,setCode]=useState(''),[accepted,setAccepted]=useState(false),[challenge,setChallenge]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[cooldown,setCooldown]=useState(0),[expires,setExpires]=useState(0),[now,setNow]=useState(Date.now());
 const lock=useRef(false),request=useRef<AbortController|null>(null);
 const ready=config.data?.enabled===true&&config.data?.state==='ready',seconds=Math.max(0,Math.ceil((cooldown-now)/1000)),expired=!!expires&&now>=expires;
 useEffect(()=>{onBusyChange(busy);},[busy,onBusyChange]);
 useEffect(()=>()=>{request.current?.abort();onBusyChange(false);},[onBusyChange]);
 useEffect(()=>{if(!cooldown&&!expires)return;const t=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(t);},[cooldown,expires]);
 function clearChallenge(){setChallenge('');setCode('');setExpires(0);setMessage('');}
 function switchPurpose(){if(lock.current)return;setPurpose(p=>p==='login'?'register':'login');setAccepted(false);clearChallenge();}
 async function post(action:string,body:any){
  request.current=new AbortController();
  const response=await fetch('/api/auth/sms/'+action,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-gl':'1'},signal:AbortSignal.any([request.current.signal,AbortSignal.timeout(20000)]),body:JSON.stringify(body)});
  const value=await response.json().catch(()=>({}));if(!response.ok)throw Error(value.error||'短信服务暂不可用，请稍后手动重试');return value;
 }
 function input(){
  const normalized=normalizeSmsPhone(phone);if(!normalized){setMessage('请输入有效的中国内地手机号码');return null;}
  if(purpose==='register'&&!accepted){setMessage('请先阅读并同意使用说明与隐私说明');return null;}
  return {phone:normalized,purpose,acceptedTerms:purpose==='register'&&accepted};
 }
 async function send(){
  if(lock.current||!ready||Date.now()<cooldown)return;const body=input();if(!body)return;
  lock.current=true;setBusy(true);clearChallenge();setMessage('正在发送短信验证码…');
  // An uncertain timeout must not immediately allow another paid delivery.
  setCooldown(Date.now()+60000);setNow(Date.now());
  try{
   const result=await post('request',body);
   if(!validSmsChallenge(result.challengeId))throw Error('未确认验证码发送结果，请勿连续发送；稍后再试');
   setChallenge(result.challengeId);setExpires(Date.now()+300000);setMessage('验证码已发送，5分钟内有效。请勿向他人透露。');
  }catch(error:any){setMessage(error.name==='TimeoutError'?'发送结果尚未确认，请检查手机短信；不会自动重发':error.message);}
  finally{lock.current=false;setBusy(false);}
 }
 async function verify(event:React.FormEvent){
  event.preventDefault();if(lock.current||!ready)return;const body=input();if(!body)return;
  if(!challenge||expired){setMessage('请先获取有效的短信验证码');return;}if(!validSmsCode(code)){setMessage('请输入6位短信验证码');return;}
  lock.current=true;setBusy(true);setMessage('正在验证…');
  try{const result=await post('verify',{...body,challengeId:challenge,code});if(result.ok!==true)throw Error('尚未确认登录结果，请手动重试');setCode('');await onSuccess();}
  catch(error:any){setMessage(error.name==='TimeoutError'?'验证请求超时，尚未确认登录结果；不会自动重试':error.message);}
  finally{lock.current=false;setBusy(false);}
 }
 return <>
  <h2>{purpose==='register'?'用手机号创建账号':'手机验证码登录'}</h2>
  <p>{purpose==='register'?'验证手机号码后创建观澜账号，研究功能按账号额度开放。':'仅登录已绑定此号码的账号，不会自动创建新账号。'}</p>
  <div className={'auth-sms-status'+(ready?' is-ready':'')} role="status">
   {config.isPending?<LoaderCircle size={18} className="spin"/>:ready?<ShieldCheck size={18}/>:<Smartphone size={18}/>}
   <div><strong>{config.isPending?'正在检查短信通道':config.error?'短信状态读取失败':ready?'短信验证':'短信通道待开通'}</strong><p>{config.isPending?'不会发送短信，请稍候。':config.error?'暂不能发送验证码，可重试或切换邮箱。':ready?'当前支持中国内地 +86 手机号。':config.data?.message||'短信通道尚未开通，请使用邮箱登录或注册。'}</p>{config.error&&<button type="button" className="outline-button" onClick={()=>void config.refetch()}>重试读取状态</button>}</div>
  </div>
  <form onSubmit={verify} aria-label={purpose==='register'?'手机验证码注册':'手机验证码登录'} noValidate aria-busy={busy}>
   <label htmlFor="auth-phone">手机号码</label><div className="auth-phone-input"><span aria-hidden="true">+86</span><input id="auth-phone" type="tel" inputMode="tel" autoComplete="tel-national" maxLength={24} placeholder="请输入11位手机号码" value={phone} disabled={busy} readOnly={!!challenge} onChange={e=>{setPhone(e.target.value);clearChallenge();}}/></div>
   <label htmlFor="auth-sms-code">短信验证码</label><div className="auth-sms-code"><input id="auth-sms-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6位验证码" value={code} disabled={busy||!challenge||expired} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/><button className="outline-button" type="button" disabled={!ready||busy||seconds>0} onClick={()=>void send()}>{seconds?seconds+' 秒后重新发送':busy?'正在发送…':'获取短信验证码'}</button></div>
   {!!challenge&&<div className="auth-sms-session"><small>{expired?'验证码已过期，请重新获取':'验证码5分钟内有效'}</small><button type="button" disabled={busy} onClick={clearChallenge}>更换手机号</button></div>}
   {purpose==='register'&&<label className="auth-consent"><input type="checkbox" checked={accepted} disabled={busy} onChange={e=>setAccepted(e.target.checked)}/><span>我已阅读并同意<a href="/legal/terms.html" target="_blank" rel="noreferrer">使用说明</a>与<a href="/legal/privacy.html" target="_blank" rel="noreferrer">隐私说明</a></span></label>}
   <p className="auth-feedback" role="status" aria-live="polite">{message}</p><button type="submit" className="primary auth-submit" disabled={!ready||busy||!challenge||expired}>{busy?'正在处理…':purpose==='register'?'验证并注册':'验证并登录'}</button>
  </form>
  <p className="auth-switch">{purpose==='login'?'首次使用？':'已有手机号账号？'} <button type="button" disabled={busy} onClick={switchPurpose}>{purpose==='login'?'手机号注册':'返回手机号登录'}</button></p>
  <p className="auth-sms-footnote">已用邮箱注册？请继续使用邮箱账号。手机号绑定开放后可关联原账号，研究和持仓无需另建。</p>
 </>;
}
