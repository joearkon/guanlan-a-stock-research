import {useState} from 'react';
import {useQuery,useMutation} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {publicQuery,queryClient} from './api';
import {Widget,Drawer} from './components';
import {shortcuts,shortcutEntries} from '../../web/v2/home-personal.mjs';
const labels={review:'每日观测',emotion:'情绪观测',stock:'个股档案'};
const href=(entry:any)=>({home:'/',watchlist:'/watchlist',review:'/review',emotion:'/emotion',live:'/monitor',relay:'/relay',auction:'/auction',stock:'/stock',agent:'/agent'}[entry.key]||null);
export default function HomeShortcuts(){
 const q=useQuery(publicQuery('/api/preferences',300000)),[open,setOpen]=useState(false),[selected,setSelected]=useState<string[]>([]);
 const entries=shortcutEntries(q.data?.preferences?.shortcuts).filter((entry):entry is NonNullable<typeof entry>=>!!entry);
 const save=useMutation({mutationFn:async()=>{const r=await fetch('/api/preferences',{method:'PUT',credentials:'same-origin',headers:{'content-type':'application/json','x-gl':'1'},body:JSON.stringify({shortcuts:selected})});if(!r.ok)throw Error('快捷入口保存失败，原设置未更改');return r.json();},onSuccess:data=>{queryClient.setQueryData(['resource','/api/preferences'],data);setOpen(false);}});
 function move(i:number,delta:number){const next=[...selected],j=i+delta;if(j<0||j>=next.length)return;[next[i],next[j]]=[next[j],next[i]];setSelected(next);}
 return <><Widget title="常用功能" subtitle="按自己的研究习惯设置快捷入口" error={q.error?.message} retry={()=>q.refetch()} actions={<button className="home-text-button" aria-label="管理常用功能" disabled={!q.data} onClick={()=>{setSelected(entries.map(e=>e.key));setOpen(true);}}>管理</button>}><div className="home-shortcuts">{entries.map(e=>href(e)?<Link className="outline-button" key={e.key} to={href(e)!}>{labels[e.key]||e.label}</Link>:<a className="outline-button" key={e.key} href={e.href}>{labels[e.key]||e.label}</a>)}{!entries.length&&<p className="empty">还没有设置常用功能，点击管理添加。</p>}</div></Widget><Drawer open={open} onOpenChange={setOpen} title="管理常用功能"><div className="stack-form"><p>选择并排序后同步至当前账号。尚未完成迁移的功能保留原版入口。</p>{shortcuts.map(e=><label className="shortcut-choice" key={e.key}><input type="checkbox" checked={selected.includes(e.key)} onChange={event=>setSelected(old=>event.target.checked?[...old,e.key]:old.filter(k=>k!==e.key))}/>{labels[e.key]||e.label}</label>)}<div>{selected.map((key,i)=><div className="shortcut-order" key={key}><span>{labels[key]||shortcuts.find(e=>e.key===key)?.label}</span><button className="quiet-button" disabled={i===0} aria-label={'上移'+key} onClick={()=>move(i,-1)}>↑</button><button className="quiet-button" disabled={i===selected.length-1} aria-label={'下移'+key} onClick={()=>move(i,1)}>↓</button></div>)}</div>{save.error&&<p className="local-error" role="status">{save.error.message}</p>}<button className="primary" disabled={save.isPending} onClick={()=>save.mutate()}>保存快捷入口</button></div></Drawer></>;
}
