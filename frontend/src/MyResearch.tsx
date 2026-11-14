import {useEffect,useRef,useState,lazy,Suspense} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {useInfiniteQuery,useQuery,useQueryClient} from '@tanstack/react-query';
import {Plus,Search,RefreshCw,NotebookPen,History,FileText} from 'lucide-react';
import {getJSON,publicQuery,retryRead} from './api';
import {Drawer,Skeleton} from './components';
import {PrivacyGuard,PrivateValue} from './Privacy';
import ResearchCreate from './ResearchCreate';
import FixedReport from './FixedReport';
import AgentAnswer from './AgentAnswer';
import {AiAction} from './AiAction';
import './my-research.css';
import './research-workspace.css';
const Legacy=lazy(()=>import('./ResearchRecordDetail'));
const types:any={company:'公司价值研究',industry:'产业价值研究',topic:'专题深挖',note:'文字笔记','company-four':'公司四问'};
const statuses:any={starting:'待核对启动',queued:'等待执行',running:'研究中',complete:'已归档',failed:'未完成',stopped:'已停止',needs_attention:'待核对',expired:'状态过期'};
const time=(v:any)=>v&&Number.isFinite(new Date(v).getTime())?new Date(v).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未提供';
export const researchHref=(input:Record<string,string>)=>'/my-research?'+new URLSearchParams({create:'1',...input});
export default function MyResearch(){
 const me=useQuery({...publicQuery('/api/me',300000),retry:false});
 if(me.isPending)return <Skeleton label="研究账号"/>;
 if(!me.data?.user)return <section><h1>我的研究</h1><p>登录后查看个人研究档案、报告版本和文字笔记。打开历史不调用模型。</p><a className="outline-button" href="/next/login?returnTo=%2Fnext%2Fmy-research">前往登录</a></section>;
 return <Workspace key={me.data.user.id} account={String(me.data.user.id)}/>;
}
function Workspace({account}:{account:string}){
 const client=useQueryClient(),[params,setParams]=useSearchParams(),[search,setSearch]=useState(''),[term,setTerm]=useState(''),[kind,setKind]=useState(''),[create,setCreate]=useState(params.get('create')==='1'),[seed,setSeed]=useState<Record<string,string>>(()=>Object.fromEntries(params)),[selected,setSelected]=useState(params.get('archive')||''),[message,setMessage]=useState('');
 useEffect(()=>{if(params.get('create')==='1'){setSeed(Object.fromEntries(params));setCreate(true);}},[params]);
 const code=/^\d{6}$/.test(params.get('code')||'')?params.get('code')!:'';
 const url='/api/research/library?'+new URLSearchParams({search:term||code,kind});
 const q=useInfiniteQuery({queryKey:['personal-research',account,url],initialPageParam:0,queryFn:({pageParam,signal})=>getJSON(url+'&offset='+pageParam,signal),getNextPageParam:(p:any)=>p.nextOffset??undefined,staleTime:30000,retry:retryRead(1),refetchInterval:query=>query.state.data?.pages.some((p:any)=>p.archives?.some((x:any)=>['queued','running','starting'].includes(x.status)))?12000:false,refetchIntervalInBackground:false});
 const rows=q.data?.pages.flatMap(p=>p.archives||[])||[];
 function refresh(){void client.invalidateQueries({queryKey:['personal-research',account]});void client.invalidateQueries({queryKey:['research-archive',account]});void client.invalidateQueries({queryKey:['account-research',account]});}
 function close(){setCreate(false);setParams(p=>{p.delete('create');return p;},{replace:true});}
 return <div className="my-research-page"><header className="research-page-heading"><div><h1>我的研究</h1><p className="provenance">个人判断、证据与历次版本。平台案例只是起点，可研究名单以外的公司、产业和专题。</p></div><button className="primary" onClick={()=>{setSeed(code?{code}:{});setCreate(true);}}><Plus size={16}/>新建研究</button></header>
 <div className="research-ledger-note"><FileText size={18}/><span>资料更新不自动改写结论。报告完成后归入本档案；查看、检索、恢复历史不调用模型。</span><Link to="/industry">浏览平台产业研究</Link></div>
 <form className="research-ledger-toolbar" onSubmit={e=>{e.preventDefault();setTerm(search.trim());}}><label><Search size={16}/><input aria-label="检索我的研究" value={search} onChange={e=>setSearch(e.target.value)} placeholder="公司、代码、产业或专题"/></label><select aria-label="档案类型" value={kind} onChange={e=>setKind(e.target.value)}><option value="">全部类型</option>{Object.entries(types).slice(0,3).map(([k,v])=><option key={k} value={k}>{v as string}</option>)}</select><button className="outline-button">检索</button><button type="button" className="outline-button" disabled={q.isFetching} onClick={()=>void q.refetch()}><RefreshCw size={15} className={q.isFetching?'spin':''}/>刷新台账</button></form>
 {code&&<p className="research-company-scope">公司范围 {code}<button className="outline-button" onClick={()=>setParams(p=>{p.delete('code');return p;})}>查看全部研究</button></p>}{message&&<p role="status">{message}</p>}
 {q.error&&<p className="local-error" role="alert">台账读取失败，保留已有内容。<button className="outline-button" onClick={()=>void q.refetch()}>重试读取</button></p>}
 {q.isPending?<Skeleton label="研究台账" kind="table"/>:<div className="research-ledger-scroll" tabIndex={0}><table className="research-ledger" aria-label="个人研究台账"><thead><tr><th>研究对象</th><th>类型 / 产业</th><th>最近结论</th><th>状态</th><th>资料截止</th><th>最近研究 / 版本</th><th>操作</th></tr></thead><tbody>{rows.map((r:any)=><tr key={r.key}><td><button className="research-object" aria-label={'打开'+r.name+'研究档案'} onClick={()=>setSelected(r.key)}><strong>{r.name}</strong>{r.code&&<small>{r.code}</small>}</button></td><td>{types[r.kind]}<small>{r.industry||'独立研究'}</small></td><td className="research-summary"><PrivateValue>{r.summary||'打开档案查看笔记、旧报告与研究进展'}</PrivateValue>{r.summaryAsOf&&<small>有效报告资料日 {r.summaryAsOf}</small>}</td><td><span className={'research-state '+r.status}>{statuses[r.status]||r.status}</span></td><td>{r.asof||'未提供'}</td><td>{time(r.updated_at)}<small>{r.versions} 个版本 / 记录</small></td><td><button className="outline-button" onClick={()=>setSelected(r.key)}><History size={15}/>打开档案</button></td></tr>)}</tbody></table>{!rows.length&&<div className="research-library-empty"><h2>{term?'暂无匹配的研究档案':'从一个对象开始，形成自己的研究记录'}</h2><p>选择任意公司、产业或专题。AI 报告与文字笔记共同留档，不限定平台示例或公司市值。</p><button className="outline-button" onClick={()=>setCreate(true)}>建立研究档案</button></div>}</div>}
 {q.hasNextPage&&<button className="outline-button" disabled={q.isFetchingNextPage} onClick={()=>void q.fetchNextPage()}>读取更多档案</button>}
 <Drawer open={create} onOpenChange={open=>open?setCreate(true):close()} title="新建个人研究">{create&&<PrivacyGuard><ResearchCreate seed={seed} onSaved={run=>{close();refresh();setSelected(run.key);setMessage(run.template==='note'?'文字记录已归档':'研究任务已建立，完成后自动归档；无需停留本页。');}}/></PrivacyGuard>}</Drawer>
 <Drawer open={!!selected} onOpenChange={open=>{if(!open)setSelected('');}} title="研究档案与历史" className="research-archive-drawer">{selected&&<PrivacyGuard><Archive key={selected} subjectKey={selected} account={account} onChanged={refresh} onCreate={s=>{setSelected('');setSeed(s);setCreate(true);}}/></PrivacyGuard>}</Drawer>
 </div>;
}
function Archive({subjectKey,account,onChanged,onCreate}:{subjectKey:string;account:string;onChanged:()=>void;onCreate:(s:Record<string,string>)=>void}){
 const [id,setId]=useState('');const query=useInfiniteQuery({queryKey:['research-archive',account,subjectKey],initialPageParam:'',queryFn:({pageParam,signal})=>getJSON('/api/research/library?subject='+encodeURIComponent(subjectKey)+(pageParam?'&before='+pageParam:''),signal),getNextPageParam:(p:any)=>p.nextCursor??undefined,staleTime:10000,retry:retryRead(1)});
 const runs=query.data?.pages.flatMap(p=>p.runs||[])||[],current=runs.find((r:any)=>r.id===id)||runs[0];
 if(query.isPending)return <Skeleton label="研究版本"/>;
 if(!current)return <p className="local-error" role="alert">{query.error?'档案读取失败，请重试。':'本档案暂无可见记录。'}<button className="outline-button" onClick={()=>void query.refetch()}>重新读取</button></p>;
 return <div className="research-archive"><header className="research-archive-head"><div><h2>{current.name}</h2><p>{types[current.kind]} · 个人档案，平台研究不会被修改</p></div><div className="research-button-row">{current.code&&<Link className="outline-button" to={'/stock?code='+current.code+'&tab=overview'}>个股档案</Link>}<AiAction onClick={()=>onCreate({kind:current.kind,name:current.name,code:current.code||'',industry:current.industry||'',focus:current.focus||'',snapshotId:current.snapshotId||''})}>新一轮研究</AiAction><button className="outline-button" onClick={()=>onCreate({kind:current.kind,name:current.name,code:current.code||'',mode:'note'})}><NotebookPen size={15}/>写笔记</button></div></header>
 <div className="research-archive-grid"><aside className="research-version-list" aria-label="历次研究版本"><h3>研究时间线</h3>{runs.map((r:any,i:number)=><button key={r.id} className={current.id===r.id?'active':''} onClick={()=>setId(r.id)}><strong>{r.template==='note'||r.legacy&&r.record.origin==='manual'?'文字记录':types[r.template]||types[r.kind]}</strong><span>{time(r.createdAt)}</span><small>{statuses[r.status]} · {r.report?.status==='partial'?'有证据缺口':r.asof||'日期未提供'}{i===0?' · 最近':''}</small></button>)}{query.hasNextPage&&<button disabled={query.isFetchingNextPage} onClick={()=>void query.fetchNextPage()}>读取更早版本</button>}</aside><main className="research-version-content">{current.legacy?<Suspense fallback={<Skeleton label="原研究记录"/>}>{current.report?<FixedReport report={current.report} text={current.answer}/>:null}<Legacy record={current.record} onSaved={()=>{onChanged();void query.refetch();}}/></Suspense>:<Run key={current.id} initial={current} account={account} onFinished={()=>{onChanged();void query.refetch();}}/>}</main></div></div>;
}
function Run({initial,account,onFinished}:{initial:any;account:string;onFinished:()=>void}){
 const [visible,setVisible]=useState(!document.hidden),[busy,setBusy]=useState(false),[error,setError]=useState(''),finished=useRef(false);
 useEffect(()=>{const update=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 const query=useQuery({queryKey:['research-run',account,initial.id],queryFn:({signal})=>getJSON('/api/research/library?run='+initial.id,signal),initialData:{run:initial},staleTime:0,enabled:visible,retry:retryRead(1),refetchInterval:q=>visible&&['queued','running','starting'].includes(q.state.data?.run?.status)?5000:false,refetchIntervalInBackground:false});
 const r=query.data.run||initial;
 useEffect(()=>{if(!['queued','running','starting'].includes(r.status)&&!finished.current){finished.current=true;onFinished();}},[r.status,onFinished]);
 async function control(action:string){if(busy)return;setBusy(true);setError('');try{const response=await fetch('/api/research/library?run='+r.id+'&action='+action,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-gl':'1'},body:'{}'});const result=await response.json();if(!response.ok)throw Error(result.error||'操作未确认，请核对原任务');await query.refetch();onFinished();}catch(e:any){setError(e.message);}finally{setBusy(false);}}
 return <section><div className="research-run-status"><strong>{statuses[r.status]}</strong><span>创建 {time(r.createdAt)} · 截止 {r.asof} · 深度思考{r.deepThinking?'开启':'关闭'}</span>{['queued','running'].includes(r.status)&&<button className="outline-button" disabled={busy} onClick={()=>void control('stop')}>停止研究</button>}{r.status==='stopped'&&<button className="outline-button" disabled={busy} onClick={()=>void control('resume')}>确认继续原任务</button>}{r.status==='starting'&&<button className="outline-button" disabled={busy} onClick={()=>void control('start')}>核对并恢复启动</button>}</div>
 {['queued','running','starting'].includes(r.status)&&<><Skeleton label="研究任务"/><p className="provenance">后台取证、研判与校验，完成后自动留档。可离开页面；不会因刷新重复运行。</p></>}
 {(error||r.error||query.error)&&<p role="alert" className="local-error">{error||r.error||'状态读取失败，保留已保存报告。'} 不会自动重新调用模型。<button className="outline-button" onClick={()=>void query.refetch()}>核对状态</button></p>}
 {r.report?.localHarness?<AgentAnswer text={r.answer} result={r.report}/>:r.report?<FixedReport report={r.report} expected={{type:r.template,asof:r.asof,snapshotId:r.snapshotId}} text={r.answer}/>:r.note?<article className="research-note-body"><h3>已保存的文字笔记</h3><p>{r.note}</p></article>:r.answer?<details><summary>已完成阶段 · 非完整报告</summary><pre>{r.answer}</pre></details>:!['queued','running','starting'].includes(r.status)&&<p>本轮没有通过校验的研究报告；之前的版本仍保留在左侧时间线。</p>}
 <p className="provenance">原始报告不被覆盖。新资料需要新一轮明确研究，失败不会替代之前的结论。</p></section>;
}
