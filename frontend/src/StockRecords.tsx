import {PrivacyGuard} from './Privacy';
import {useState} from 'react';
import {useInfiniteQuery,useMutation} from '@tanstack/react-query';
import {getJSON,retryRead} from './api';
import {validDate} from './portfolio-data';
import {safeSource} from './urls';
import {Widget} from './components';
import Answer from './Answer';

export function RecordEditor({code,evidence,record,draft,onSaved}:{code:string,evidence:any[],record?:any,draft?:{title:string;content:string;dataDate:string;evidenceRefs:any[]},onSaved:(record:any)=>void}){
 const initial=record||draft;
 const [title,setTitle]=useState(initial?.title||''),[content,setContent]=useState(initial?.content||''),[date,setDate]=useState(initial?.dataDate||''),[version,setVersion]=useState(record?.updatedAt),[latest,setLatest]=useState<any>(null);
 const choices=[...(initial?.evidenceRefs||[]),...evidence.filter(e=>safeSource(e.sourceUrl)&&validDate(e.dataDate)).map(e=>({title:e.title,url:e.sourceUrl,dataDate:e.dataDate}))].filter((r,i,all)=>all.findIndex(x=>x.url===r.url&&x.dataDate===r.dataDate)===i);
 const key=(r:any)=>r.url+'|'+r.dataDate;
 const [refs,setRefs]=useState<string[]>((initial?.evidenceRefs||[]).map(key));
 const mutation=useMutation({retry:false,mutationFn:async()=>{
  if(!title.trim()||title.trim().length>120||!content.trim()||content.trim().length>8000||(date&&!validDate(date))||(!record&&!date)||refs.length>10)throw Error('请填写有效标题、正文、资料日期；证据最多10条');
  const r=await fetch('/api/research/records',{method:record?'PUT':'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-gl':'1'},body:JSON.stringify({id:record?.id,updatedAt:version,stockCode:code,title:title.trim(),content:content.trim(),dataDate:date||null,evidenceRefs:choices.filter(e=>refs.includes(key(e)))})});
  const body=await r.json();
  if(!r.ok){if(r.status===409){try{setLatest((await getJSON('/api/research/records?id='+encodeURIComponent(record.id))).record);}catch{}}throw Error(body.error||'保存失败，记录未确认');}
  return body.record;
 },onSuccess:onSaved});
 return <PrivacyGuard><form className="stack-form" onSubmit={e=>{e.preventDefault();mutation.mutate();}}>
  <p>{record?'修订会保留旧版本；只修改手工记录，不改写 AI 原始回答。':'仅保存当前账号手工记录，不自动生成研究判断。'}</p>
  <label>标题<input maxLength={120} required value={title} onChange={e=>setTitle(e.target.value)}/></label>
  <label>正文<textarea aria-label="正文" maxLength={8000} rows={10} required value={content} onChange={e=>setContent(e.target.value)}/></label>
  <label>资料日期<input type="date" required={!record} value={date} onChange={e=>setDate(e.target.value)}/></label>
  <label>证据引用<select aria-label="证据引用" multiple value={refs} onChange={e=>setRefs([...e.target.selectedOptions].map(o=>o.value))}>{choices.map(e=><option key={key(e)} value={key(e)}>{e.title} · {e.dataDate}</option>)}</select></label>
  {mutation.error&&<p className="local-error" role="status">{mutation.error.message}。当前草稿仍保留，尚未保存。</p>}
  {latest&&<section><h3>服务器最新版本 · {latest.title}</h3><Answer text={latest.content}/><p className="provenance">修改时间 {latest.updatedAt}；请先对照差异，下面按钮不会自动合并正文。</p><button type="button" className="outline-button" onClick={()=>{setVersion(latest.updatedAt);setLatest(null);mutation.reset();}}>以最新版为基准，保留我的草稿</button></section>}
  <button className="primary" disabled={mutation.isPending||!!latest}>{mutation.isPending?'正在保存…':record?'保存修订':'保存研究记录'}</button>
 </form></PrivacyGuard>;
}

export function RecordHistory({id}:{id:string}){
 const q=useInfiniteQuery({queryKey:['record-history',id],initialPageParam:'',queryFn:({pageParam,signal})=>getJSON('/api/research/records?id='+encodeURIComponent(id)+(pageParam?'&before='+pageParam:''),signal),getNextPageParam:(page:any)=>page.nextCursor||undefined,staleTime:0,retry:retryRead(1)});
 const current=q.data?.pages[0]?.record,versions=q.data?.pages.flatMap(p=>p.revisions)||[];
 return <PrivacyGuard><Widget title="修订历史" loading={q.isPending} error={q.error?.message} retry={()=>q.refetch()} refreshing={q.isFetching&&!q.isPending}>
  <p className="provenance">仅展示这一份记录的已保存版本，不把其他研究记录称为它的旧版本。历史版本只读。</p>
  {current&&<article><h3>当前版本 · {current.title}</h3><p className="provenance">修改 {current.updatedAt} · 数据 {current.dataDate||'未提供'}</p><Answer text={current.content}/></article>}
  {versions.map(v=><article key={v.updatedAt}><h3>历史版本 · {v.title}</h3><p className="provenance">修改 {v.updatedAt} · 数据 {v.dataDate||'未提供'}</p><Answer text={v.content}/>{v.evidenceRefs.map((r:any,i:number)=><p key={i}>{r.title} · {r.dataDate} {safeSource(r.url)&&<a href={safeSource(r.url)!} target="_blank" rel="noopener noreferrer">引用原文</a>}</p>)}</article>)}
  {current&&!versions.length&&<p className="empty">尚无已保存修订；首次修改后会保留原稿。</p>}
  {q.hasNextPage&&<button className="outline-button" disabled={q.isFetchingNextPage} onClick={()=>q.fetchNextPage()}>读取更早版本</button>}
 </Widget></PrivacyGuard>;
}
