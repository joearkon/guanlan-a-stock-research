import {useMemo,useState,useSyncExternalStore} from 'react';
import {Link} from 'react-router-dom';
import {Drawer} from './components';
import {usePreferences} from './personal-preferences';
import {researchReleases} from './research-versions';
import './research-version-notice.css';
const event='guanlan:research-version-read';
function subscribe(notify:()=>void){window.addEventListener(event,notify);window.addEventListener('storage',notify);return()=>{window.removeEventListener(event,notify);window.removeEventListener('storage',notify);};}
export function useResearchVersionNotice(){
 const {account}=usePreferences(),key='guanlan.research-versions-read.v1.'+encodeURIComponent(account);
 const raw=useSyncExternalStore(subscribe,()=>{try{return localStorage.getItem(key)||'';}catch{return '';}},()=>''),seen=useMemo(()=>{try{const v=JSON.parse(raw);return new Set<string>(Array.isArray(v)?v.filter(x=>typeof x==='string'):[]);}catch{return new Set<string>();}},[raw]);
 const unread=researchReleases.filter(r=>!seen.has(r.id+'|'+r.version)),[selection,setSelection]=useState<{account:string;name:string;ids:string[]}|null>(null),[error,setError]=useState('');
 const selected=selection?.account===account?unread.filter(r=>selection.ids.includes(r.id)):[];
 function dot(id:string,name:string){const versions=unread.filter(r=>r.id===id||r.industryId===id);return versions.length?<button type="button" className="research-update-dot" aria-label={name+'有未读研究版本'} title="有未读研究版本，点击查看" onClick={()=>{setError('');setSelection({account,name,ids:versions.map(r=>r.id)});}}><span aria-hidden="true"/></button>:null;}
 function markRead(){try{localStorage.setItem(key,JSON.stringify([...new Set([...seen,...selected.map(r=>r.id+'|'+r.version)])]));window.dispatchEvent(new Event(event));setSelection(null);}catch{setError('已读状态保存失败，更新提示保留。');}}
 return {dot,panel:<Drawer open={!!selected.length} onOpenChange={open=>{if(!open)setSelection(null);}} title={(selection?.name||'产业研究')+' · 研究版本'}><p className="provenance">显示你尚未标记已读的已发布研究版本，首次阅读也会提示；不代表今天刚更新。行情刷新、采集重试和个人 AI 追问不计入平台研究更新。</p><ul className="research-version-list">{selected.map(r=><li key={r.id}><h3>{r.title}</h3><small>版本 {r.version} · 研究核对 {r.reviewedOn}</small><p>{r.summary}</p><Link className="outline-button" to={r.path} onClick={()=>setSelection(null)}>查看{r.title}研究</Link></li>)}</ul><p className="provenance">已读状态按账号保存在当前浏览器，暂不跨设备同步。查看研究不会调用模型。</p>{error&&<p role="alert" className="local-error">{error}</p>}<button type="button" className="outline-button" onClick={markRead}>标记这些研究版本为已读</button></Drawer>};
}
