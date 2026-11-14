import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {publicQuery,saveProfile,retryRead} from './api';
import {readWatchQuotes,watchBaseline} from './watch-performance';
type Operation=(profile:any,version:number)=>any;
type Change=Operation|{operation:Operation;alertTarget:any};
export function useProfileActions(){
 const client=useQueryClient(),query=useQuery({...publicQuery('/api/profile',300000),retry:retryRead(1)});
 const mutation=useMutation({scope:{id:'account-profile-write'},retry:false,mutationFn:async(input:Change)=>{
  const operation=typeof input==='function'?input:input.operation;
  const old=client.getQueryData<any>(['resource','/api/profile']);if(!old?.profile||!Number.isInteger(old.version))throw Error('账户资料尚未读取完整，请先重新读取');
  const next=operation(structuredClone(old.profile),old.version);
  const fresh=(next.pool||[]).filter((r:any)=>!r.archived&&['stock','etf'].includes(r.kind||'stock')&&!old.profile.pool?.some((p:any)=>(p.kind||'stock')===(r.kind||'stock')&&p.code===r.code));
  if(fresh.length){const quotes=await readWatchQuotes(client,fresh.map((r:any)=>r.code)),now=new Date();for(const row of fresh)Object.assign(row,watchBaseline(quotes[row.code],now));}
  const data=await saveProfile(next,old.version);client.setQueryData(['resource','/api/profile'],data);
  const accountId=client.getQueryData<any>(['resource','/api/me'])?.user?.id,newRows=(data.profile?.pool||[]).filter((r:any)=>!r.archived&&!old.profile.pool?.some((p:any)=>!p.archived&&(p.kind||'stock')===(r.kind||'stock')&&p.code===r.code)),targets=newRows.filter((r:any)=>r.kind!=='etf').map((r:any)=>typeof input!=='function'&&input.alertTarget?input.alertTarget:(r.kind||'stock')==='stock'?{targetType:'stock',code:r.code,name:r.name}:r.kind==='industry'?{targetType:'board',provider:'sw',code:r.code,name:r.name}:{targetType:'board',name:r.name,choose:true,provider:r.code?.split(':')[0]});
  if(accountId&&targets.length)window.dispatchEvent(new CustomEvent('guanlan-follow-alert-offer',{detail:{accountId:String(accountId),targets}}));return data;
 }});
 const change=(operation:Operation,alertTarget?:any)=>mutation.mutateAsync(alertTarget?{operation,alertTarget}:operation),pool=()=>client.getQueryData<any>(['resource','/api/profile'])?.profile?.pool?.filter(r=>!r.archived)||[];
 async function update(code:string,patch:any,kind='stock'){
  const limits={reason:600,focus:120,category:40,status:40};for(const [key,value]of Object.entries(patch)){if(key==='tasks'){if(!Array.isArray(value)||value.length>8)throw Error('每个关注对象最多8条复核任务');}else if(!(key in limits)||typeof value!=='string'||value.length>limits[key])throw Error('研究字段无效或超出长度限制');}
  const data=await change(p=>{const row=p.pool.find(r=>(r.kind||'stock')===kind&&r.code===code&&!r.archived);if(!row)throw Error('该关注对象不存在，请重新读取');Object.assign(row,patch);return p;});return data.profile.pool.find(r=>(r.kind||'stock')===kind&&r.code===code);
 }
 async function toggleAsset(kind:string,code:string,name:string,alertTarget?:any){return change(p=>{if(!['stock','etf','theme','concept','industry'].includes(kind)||!code||!name||kind==='stock'&&!/^\d{6}$/.test(code))throw Error('关注对象身份不完整');p.pool??=[];const row=p.pool.find(r=>(r.kind||'stock')===kind&&r.code===code),active=p.pool.filter(r=>!r.archived).length;if(row&&!row.archived){row.archived=true;return p;}if(active>=30)throw Error('观察池最多30项');if(row){delete row.archived;return p;}p.pool.push({kind,code,name,added:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai'}).format(new Date()),addedAt:new Date().toISOString()});return p;},alertTarget);}
 async function remove(code:string,kind='stock'){let removed:any;await change(p=>{const index=p.pool.findIndex(r=>(r.kind||'stock')===kind&&r.code===code&&!r.archived);if(index<0)throw Error('该关注对象不在观察池');removed={...p.pool[index],restoreIndex:index};p.pool[index].archived=true;return p;});return removed;}
 async function restore(removed:any){const data=await change(p=>{const index=p.pool.findIndex(r=>r.archived&&(r.kind||'stock')===(removed.kind||'stock')&&r.code===removed.code);if(index<0)throw Error('已无法撤销此次移除，请重新添加');if(p.pool.filter(r=>!r.archived).length>=30)throw Error('观察池最多30项');const [row]=p.pool.splice(index,1);delete row.archived;p.pool.splice(Math.max(0,Math.min(removed.restoreIndex??index,p.pool.length)),0,row);return p;});return data.profile.pool.find(r=>(r.kind||'stock')===(removed.kind||'stock')&&r.code===removed.code);}
 return {query,mutation,change,update,toggleAsset,pool,remove,restore};
}
