import './research-version-notice.css';
import {useMemo,useState,useSyncExternalStore} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {publicQuery} from './api';
import {usePreferences} from './personal-preferences';
import {Drawer} from './components';
import {semiconductorLayers,semiconductorChildPath} from './semiconductor-directory';
import {semiconductorLayerPath} from './semiconductor-companies';
import IndustryAccessNotice from './IndustryAccessNotice';
type Update={id:string;nodeId:string;text:string;publishedAt:string;versionId:string;evidenceIds:string[]};
const event='guanlan:industry-updates-read';
function subscribe(cb:()=>void){window.addEventListener(event,cb);window.addEventListener('storage',cb);return()=>{window.removeEventListener(event,cb);window.removeEventListener('storage',cb);};}
export function useIndustryUpdates(industryId='semiconductors',enabled=true){
 const {account}=usePreferences(),key='guanlan.industry-read.v1.'+encodeURIComponent(account);
 const raw=useSyncExternalStore(subscribe,()=>{try{return localStorage.getItem(key)||'';}catch{return '';}},()=>''),seen=useMemo(()=>{try{const ids=JSON.parse(raw);return new Set<string>(Array.isArray(ids)?ids.filter(id=>typeof id==='string'):[]);}catch{return new Set<string>();}},[raw]);
 const query=useQuery({...publicQuery('/api/research/industry/updates?industry='+encodeURIComponent(industryId),300000),refetchInterval:300000,enabled});
 const updates=useMemo(()=>[...new Map<string,Update>((Array.isArray(query.data?.updates)?query.data.updates:[]).filter((u:any)=>u&&typeof u.id==='string'&&typeof u.nodeId==='string'&&typeof u.text==='string'&&u.evidenceIds?.length).map((u:Update)=>[u.id,u] as const)).values()].filter(u=>!seen.has(u.id)),[query.data,seen]);
 const [selection,setSelection]=useState<{name:string;ids:string[]}|null>(null),[error,setError]=useState('');
 const forNode=(id:string)=>updates.filter(u=>id===industryId||u.nodeId===id||industryId==='semiconductors'&&semiconductorLayers.find(l=>l.id===id)?.children.some(c=>c[0]===u.nodeId));
 const dot=(id:string,name:string)=>{const rows=forNode(id);return rows.length?<button type="button" className="research-update-dot" aria-label={name+'有'+rows.length+'条未读更新'} title="查看有证据的已发布变化" onClick={()=>{setError('');setSelection({name,ids:rows.map(u=>u.id)});}}><span aria-hidden="true"/></button>:null;};
 const badge=dot;
 const selected=selection?updates.filter(u=>selection.ids.includes(u.id)):[];
 function markRead(){try{localStorage.setItem(key,JSON.stringify([...new Set([...seen,...selected.map(u=>u.id)])]));window.dispatchEvent(new Event(event));setSelection(null);}catch{setError('已读状态保存失败，更新角标保留。');}}
 const href=(u:Update)=>{if(industryId==='ai-compute')return u.nodeId==='liquid-cooling'?'/industry/ai-compute/liquid-cooling':'/industry/ai-compute?stage='+encodeURIComponent(u.nodeId);if(industryId!=='semiconductors')return '/industry/'+industryId+(u.nodeId==='overview'?'':'/'+u.nodeId);const layer=semiconductorLayers.find(l=>l.id===u.nodeId||l.children.some(c=>c[0]===u.nodeId));return !layer?'/industry/semiconductors':layer.id===u.nodeId?semiconductorLayerPath(layer.id):semiconductorChildPath(layer.id,u.nodeId);};
 return {badge,dot,status:query.isError?<IndustryAccessNotice error={query.error} kind="updates"><button className="industry-updates-retry" onClick={()=>void query.refetch()}>更新状态读取失败 · 重试</button></IndustryAccessNotice>:null,panel:<Drawer open={!!selection} onOpenChange={open=>{if(!open)setSelection(null);}} title={(selection?.name||'产业研究')+' · 更新'}><h3>{selected.length} 条未读研究更新</h3><p className="provenance">只统计有证据的已发布变化；采集重试不计数。已读状态按当前账号保存在此浏览器。</p><ul className="industry-update-list">{selected.map(u=><li key={u.id}><Link to={href(u)} onClick={()=>setSelection(null)}>{u.text}</Link><small>发布 {u.publishedAt.slice(0,10)} · 版本 {u.versionId} · {u.evidenceIds.length}项证据</small></li>)}</ul>{error&&<p role="alert">{error}</p>}<button className="outline-button" onClick={markRead}>标记这些更新为已读</button></Drawer>};
}
