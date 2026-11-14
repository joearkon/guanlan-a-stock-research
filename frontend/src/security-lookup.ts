import type {QueryClient} from '@tanstack/react-query';
import {getJSON} from './api';
import {findAssets} from './portfolio-data';
export type SecurityAsset={code:string,name:string,kind:string,source:string,asof?:string,verified?:boolean,checkedAt?:number};
export function checkedIdentity(value:any,code:string,kind:string):SecurityAsset{
 const item=value?.identity;if(!item||item.code!==code||item.kind!==kind||item.verified!==true||typeof item.name!=='string'||!item.name.trim()||item.name.length>40||/[\u0000-\u001f\ufffd]/.test(item.name)||typeof item.source!=='string'||!item.source)throw Error('来源尚未确认证券名称，请核对后重试');return item;
}
export const identityQuery=(code:string,kind='stock')=>{const url='/api/v2/quotes?codes='+encodeURIComponent(code)+'&resolve=1&kind='+encodeURIComponent(kind);return {queryKey:['resource',url],queryFn:async({signal}:{signal:AbortSignal})=>{try{return checkedIdentity(await getJSON(url,signal),code,kind);}catch(e:any){if([400,422].includes(e.status))throw Error('未能确认该证券，请核对完整代码后重试');if(e.status===503)throw Error('证券来源暂不可用；已保留输入，可稍后重试');throw e;}},staleTime:3600000,retry:false as const};};
export function rememberSecurity(client:QueryClient,item:SecurityAsset){client.setQueryData<SecurityAsset[]>(['security-identities'],old=>[item,...(old||[]).filter(x=>x.code!==item.code||x.kind!==item.kind)].slice(0,100));}
export function securities(free:any,extra:SecurityAsset[],term:string,kind='stock',initials?:ReadonlyMap<string,readonly string[]>){
 const q=term.trim().toLocaleLowerCase(),local=findAssets(free,q,kind,initials),seen=new Set(local.map(x=>x.code));return [...local,...extra.filter(x=>x.kind===kind&&!seen.has(x.code)&&(x.code.includes(q)||x.name.toLocaleLowerCase().includes(q)||initials?.get(x.name)?.some(alias=>alias.includes(q))))].sort((a,b)=>Number(b.code===q||b.name.toLocaleLowerCase()===q)-Number(a.code===q||a.name.toLocaleLowerCase()===q)).slice(0,12);
}
export async function resolveSecurity(client:QueryClient,free:any,term:string,kind='stock'){
 const exact=securities(free,client.getQueryData<SecurityAsset[]>(['security-identities'])||[],term,kind).filter(x=>x.code===term||x.name===term);if(exact.length===1)return exact[0];if(!/^\d{6}$/.test(term)||!['stock','etf'].includes(kind))throw Error('无法唯一匹配 '+term+'；请补全六位代码核验');const item=await client.fetchQuery(identityQuery(term,kind));rememberSecurity(client,item);return item;
}
export function catalogWithSecurity(free:any,item:SecurityAsset|undefined){return item?.kind==='stock'&&item.verified===true?{...free,uni:{...free?.uni,[item.code]:[item.name]}}:free;}
