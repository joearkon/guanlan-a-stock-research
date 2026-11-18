import {QueryClient} from '@tanstack/react-query';
export const retryRead=(limit=2)=>(n:number,e:any)=>n<limit&&!['AbortError','TimeoutError'].includes(e?.name)&&!(e?.status>=400&&e?.status<500);
export const queryClient=new QueryClient({defaultOptions:{queries:{staleTime:60000,gcTime:1800000,retry:retryRead(),retryDelay:n=>Math.min(1000*2**n,10000),refetchOnWindowFocus:true,refetchIntervalInBackground:false},mutations:{retry:false}}});
const versions=new Map<string,{etag:string,value:any}>();
export const sessionExpiredSignal='guanlan.local.session-expired';
let accountGeneration=0;
type StartupRead={at:number;controller:AbortController;promise:Promise<Response|null>;error?:unknown};
declare global{interface Window{__guanlanStartupV1?:StartupRead}}
const startupControllers=new Set<AbortController>();
function discardStartup(){if(typeof window!=='undefined'){window.__guanlanStartupV1?.controller.abort();delete window.__guanlanStartupV1;}for(const c of startupControllers)c.abort();startupControllers.clear();}
function startupResponse(url:string,signal?:AbortSignal):Promise<Response|null>|null{
 if(url!=='/api/me'||typeof window==='undefined')return null;const read=window.__guanlanStartupV1;if(!read)return null;delete window.__guanlanStartupV1;
 if(!Number.isFinite(read.at)||Date.now()-read.at>15000||Date.now()<read.at||signal?.aborted){read.controller.abort();return null;}
 startupControllers.add(read.controller);const abort=()=>read.controller.abort();signal?.addEventListener('abort',abort,{once:true});
 return read.promise.then(response=>{if(read.error)throw read.error;return response;}).finally(()=>{startupControllers.delete(read.controller);signal?.removeEventListener('abort',abort);});
}
export function clearResourceCache(){accountGeneration++;versions.clear();discardStartup();}
export async function getJSON(url:string,signal?:AbortSignal){
 const generation=accountGeneration,cached=versions.get(url),startup=startupResponse(url,signal),early=startup?await startup:null;
 if(generation!==accountGeneration||signal?.aborted)throw new DOMException('账号已切换或读取已取消','AbortError');
 const r=early||await fetch(url,{credentials:'same-origin',headers:cached?{'If-None-Match':cached.etag}:{},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)});
 if(generation!==accountGeneration)throw new DOMException('账号已切换，未读取旧账户回执','AbortError');
 if(r.status===304&&cached)return cached.value;
 if(!r.ok){if(r.status===401&&url!=='/api/me'&&typeof window!=='undefined')window.dispatchEvent(new Event(sessionExpiredSignal));const e:any=Error(r.status===401?'登录已过期，请重新登录':'资料读取失败，可单独重试');e.status=r.status;throw e;}
 const value=await r.json(),etag=r.headers.get('etag');if(generation!==accountGeneration)throw new DOMException('账号已切换，未读取旧账户回执','AbortError');versions.delete(url);
 // Only retain complete validators permitted by the latest response. Bound the
 // in-memory HTTP cache independently from Query's observer lifecycle.
 const privateProfile=url==='/api/profile'&&r.headers.get('x-gl-memory-validator')==='profile-v1'&&/^(?:W\/)?"profile-\d+-\d+"$/.test(etag||'');
 if(etag&&(privateProfile||!/\bno-store\b/i.test(r.headers.get('cache-control')||''))){versions.set(url,{etag,value});while(versions.size>256)versions.delete(versions.keys().next().value!);}
 return value;
}
export const publicQuery=(url:string,ttl=60000)=>({queryKey:['resource',url],queryFn:({signal}:{signal:AbortSignal})=>getJSON(url,signal),staleTime:ttl});
export async function submitResearch(body:any){
 try{
  const response=await fetch('/api/research/library',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-gl':'1'},signal:AbortSignal.timeout(15000),body:JSON.stringify(body)});
  const data=await response.json();if(!response.ok)throw Error(data.error||'请求未确认，请核对原任务');return data;
 }catch(e:any){if(['TimeoutError','AbortError'].includes(e?.name))throw Error('请求超时，受理状态尚未确认；请核对原任务，不要新建重复请求');throw e;}
}
export async function saveProfile(profile:any,version:number){
 const generation=accountGeneration;
 try{
  const r=await fetch('/api/profile',{method:'PUT',credentials:'same-origin',signal:AbortSignal.timeout(15000),headers:{'content-type':'application/json','x-gl':'1'},body:JSON.stringify({profile,version})});
  if(!r.ok)throw Error('账户资料已变化或保存失败，请重新读取后重试');const value=await r.json();if(generation!==accountGeneration)throw Error('账号已切换，未回填旧账户保存结果');versions.delete('/api/profile');return value;
 }catch(e:any){if(['TimeoutError','AbortError'].includes(e?.name))throw Error('保存结果尚未确认，请重新读取账户资料核对；不要重复提交。');throw e;}
}
export const number=(n:any,d=2)=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
export const pct=(n:any)=>typeof n==='number'&&Number.isFinite(n)?(n>0?'+':'')+number(n)+'%':'—';
export const tone=(n:any)=>n>0?'up':n<0?'down':'';
