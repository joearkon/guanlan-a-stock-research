import {AiIcon} from './AiAction';
import {usePreferences} from './personal-preferences';
import {sessionStore} from './session-store';
import {useEffect,useRef,useState,useSyncExternalStore,useId} from 'react';
import {History,Plus,FileSearch,Settings2,ArrowUp,Square,RefreshCw} from 'lucide-react';
import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {Link,useSearchParams} from 'react-router-dom';
import {publicQuery,getJSON,number,retryRead} from './api';
import {Widget,Drawer} from './components';
import Session from '../../web/v2/agent-session.mjs';
import Answer from './AgentAnswer';
import {safeSource} from './urls';
import './agent.css';
import LocalAgentEntry,{useAgentConnection}from'./LocalAgentEntry';
const pendingKey='guanlan.agent.pending-job';
const uuid=(v:any)=>/^[0-9a-f-]{36}$/i.test(String(v||''));
const compactQuery='(max-width:900px)',subscribeCompact=(fn:()=>void)=>{const m=window.matchMedia?.(compactQuery);m?.addEventListener('change',fn);return()=>m?.removeEventListener('change',fn);};
function handoff(){try{const v=JSON.parse(sessionStore.getItem('guanlan.agent.handoff')||'null');return v&&typeof v==='object'?v:null;}catch{return null;}}
function safeReturn(value:any){try{const u=new URL(value,location.origin),industry=['/next/industry/ai-compute','/next/industry/semiconductors','/next/industry/semiconductors/advanced-process'].includes(u.pathname)||/^\/next\/industry\/ai-compute\/liquid-cooling(?:\/companies\/\d{6})?$/.test(u.pathname);return u.origin===location.origin&&(industry||/^\/(?:next|v2)\/(?:stock|watchlist|holdings|my-research|review|market-observation|funding-observation|emotion|radar-observation|monitor|relay|auction|industry)(?:$|\?)/.test(u.pathname+u.search))?u.pathname+u.search:null;}catch{return null;}}
async function post(url:string,body:any){const response=await fetch(url,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-gl':'1'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const value=await response.json();if(!response.ok)throw Object.assign(Error(value.error||'请求未确认，请核对任务状态'),{status:response.status});return value;}
const prompts=[['A股研究','市场强弱，先看哪些线索？','梳理今天市场的强弱结构，说明需要观察哪些证据。'],['题材研究','题材热度，如何验证持续性？','如何从题材热度、产业进展和公司兑现三个层面研究一个主题？'],['产业研究','搭建一份产业链研究框架','人形机器人产业链，如何建立一份可验证的研究框架？'],['个股研究','从公告与财报开始研究公司','帮我建立一份个股研究清单，区分已知事实、研究判断和待核验信息。']];
const experts=[{id:'funds',name:'资金雷达',note:'问题模板 · 本地 AI Agent 自主研究，不冒充平台资金雷达规则输出',modes:[['板块资金双榜','运行资金雷达，查看最近已发布交易日的行业资金流入与流出'],['窗口背离','资金雷达，查看近5日为正但近3日转负的板块']]},{id:'qinlong',name:'擒龙九维',note:'问题模板 · 不预置平台九维评分引擎；由本地 AI Agent 说明自己的方法和依据',modes:[['模式A · 个股九维评分','用擒龙九维给意华股份 002897 做个股评分','兆易创新 打分','用擒龙九维看看 600487 现在几档'],['模式B · 题材梯队研究','给存储芯片出龙头梯队','擒龙给机器人板块出龙头梯队','固态电池的龙头梯队长什么样'],['模式C · 今日热点精选','扫今天的热点，出擒龙候选榜','今天擒龙候选有哪些','用擒龙九维看看今日候选']]},{id:'quant',name:'个股量化诊断',note:'仅预填问题；不宣称已加载本人 CLI 的全部 Skill',modes:[['量价与资金诊断','对 002897 做量价结构与主力资金诊断']]},{id:'sentiment',name:'舆情分析',note:'本机原生研究 · 来源和覆盖以实际检索为准',modes:[['舆情与风险扫描','梳理意华股份近期公告与舆情风险点']]}];
function Diagnostics({value}:{value:any}){if(!value)return null;const tokens=value.turnTokens||value.tokens||{};return <details className="agent-diagnostics">
<summary>本轮运行统计 · Token {tokens.total??'未提供'} · 调用 {value.turnAttempts??value.attempts??'未提供'}</summary>
<p>耗时 {value.elapsedMs==null?'未提供':number(value.elapsedMs/1000,1)+' 秒'} · 输入 {tokens.input??'未提供'} · 输出 {tokens.output??'未提供'} · 推理 {tokens.reasoning??'未提供'}（包含于输出，不重复相加）</p>
<p>联网请求 {value.search?.interfaceRequests??'未提供'} · 实际搜索 {value.search?.actualCalls??'未提供'}。未返回用量不代表未计费。</p>{(value.logs||[]).map((x,i)=>
<p key={i}>{x.provider} · {x.status} · {x.elapsedMs??'—'}ms {x.httpStatus||''} {x.errorType||''}</p>)}</details>;}
function Evidence({result}:{result:any}){const rows=result?.dataSources?.length?[...result.dataSources]:(result?.report?.evidence||[]).map(e=>({source:e.source,dataDate:e.asof,sourceUrl:e.url,status:'published'})),names=new Set(rows.map(x=>x.source));for(const source of new Set(result?.used||[]) as Set<string>)if(!names.has(source))rows.push({source,status:'published',dataDate:result?.asof});return <Widget title={'研究依据 · '+rows.length+'项'}>{rows.length?rows.map((r,i)=>
<article className="agent-source" key={i}>
<small>{r.tool||'发布资料'} · {({ok:'已取得',unavailable:'暂不可用',stale:'历史缓存',published:'已发布资料',provided:'本轮提供资料，非逐条引用确认'})[r.status]||r.status||'状态未提供'}</small>
<h3>{r.source||'来源未提供'}</h3>
<p>数据日期 {r.dataDate||'未提供'}</p>{r.fetchedAt&&<p>抓取 {r.fetchedAt}</p>}{safeSource(r.sourceUrl)&&<a href={safeSource(r.sourceUrl)!} target="_blank" rel="noopener noreferrer">核对来源 ↗</a>}</article>):<div className="empty">
<h3>结论背后，也要看证据</h3>
<p>本轮返回的来源与数据日期将在此展示。历史会话接口未提供逐条依据时不补造。</p>
</div>}</Widget>;}
export default function Agent({embedded=false,handoffValue}:{embedded?:boolean,handoffValue?:any}={}){
 const questionId=useId();
 const agent=useAgentConnection();
 const {preferences}=usePreferences();
 const narrow=useSyncExternalStore(subscribeCompact,()=>window.matchMedia?.(compactQuery).matches??false,()=>false),compact=!embedded&&narrow;
 const [historyOpen,setHistoryOpen]=useState(false),[evidenceOpen,setEvidenceOpen]=useState(false);
 const [params,setParams]=useSearchParams(),client=useQueryClient(),[initial]=useState(()=>handoffValue||handoff()),[question,setQuestion]=useState(()=>String(initial?.question||'').slice(0,500)),[context,setContext]=useState(()=>Session.context(initial?.context||{page:'研究工作台'})),[back,setBack]=useState(()=>safeReturn(initial?.returnTo)),[conversation,setConversation]=useState((!embedded&&params.get('conversation'))||initial?.conversationId||''),[jobId,setJobId]=useState(()=>{const id=sessionStore.getItem(pendingKey);return !initial&&uuid(id)?id||'':'';}),[turns,setTurns]=useState<{id:string,question:string}[]>([]),[filter,setFilter]=useState(''),[deep,setDeep]=useState(true),[role,setRole]=useState('professional'),[expert,setExpert]=useState(false),[expertId,setExpertId]=useState('qinlong'),[expertMode,setExpertMode]=useState(0),[status,setStatus]=useState(''),[steps,setSteps]=useState<string[]>([]),posting=useRef(false),input=useRef<HTMLTextAreaElement>(null),finalized=useRef('');
 const [historyId,setHistoryId]=useState(conversation);
 const [settingsOpen,setSettingsOpen]=useState(false);
 const history=useQuery(publicQuery('/api/agent/conversations',60000)),messages=useQuery({...publicQuery('/api/agent/conversations/'+encodeURIComponent(historyId),60000),enabled:!!historyId&&!turns.length,refetchOnWindowFocus:false}),job=useQuery({...publicQuery('/api/agent/jobs/'+encodeURIComponent(jobId),0),enabled:!!jobId,retry:retryRead(2),refetchOnWindowFocus:false,refetchInterval:q=>q.state.error||['complete','stopped','failed','needs_attention'].includes(q.state.data?.status)?false:Math.min(30000,3000*Math.max(1,q.state.fetchFailureCount))});
 const terminal=['complete','stopped','failed','needs_attention'].includes(job.data?.status),busy=!!jobId&&!terminal,result=job.data?.result,skill=experts.find(x=>x.id===expertId)||experts[0],histories=(history.data?.conversations||[]).filter(c=>!filter||String(c.title||'').toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
 const restoringFailed=!!jobId&&!!job.error&&!turns.some(t=>t.id===jobId);
 const create=useMutation({retry:false,mutationFn:(payload:any)=>post('/api/agent/jobs',payload)}),control=useMutation({retry:false,mutationFn:async({action,id}:{action:string,id:string})=>{const value=await post('/api/agent/jobs/'+encodeURIComponent(id)+'/'+action,{});if(action==='stop'&&value.stopped!==true)throw Error('研究已完成或停止未确认，请重新核对任务');return value;},onSuccess:(value,vars)=>{setStatus(vars.action==='stop'?'停止已确认；已保存阶段仍在本机':'继续执行已确认，复用原任务编号');client.setQueryData(['resource','/api/agent/jobs/'+vars.id],(old:any)=>({...old,...value,status:vars.action==='stop'?'stopped':'running'}));void job.refetch();}});
 useEffect(()=>{sessionStore.removeItem('guanlan.agent.handoff');},[]);
 useEffect(()=>{if(!job.data)return;const terminalNotice=({complete:'本轮已完成，原生回答已保存到本机。',failed:'本轮未完成，未自动重跑或切换平台。',stopped:'本轮已停止；已有回执保留，不自动重跑。',needs_attention:'本轮等待核对；不会自动重跑或切换平台。'} as Record<string,string>)[job.data.status];if(terminalNotice)setStatus(terminalNotice);const current=(job.data.stage||job.data.status)+' · '+(job.data.stageStatus||'');setSteps(old=>old.at(-1)===current?old:[...old.slice(-23),current]);if(job.data.status==='complete'&&finalized.current!==jobId){finalized.current=jobId;if(turns.some(t=>t.id===jobId)&&typeof initial?.onComplete==='function')initial.onComplete({jobId,result:job.data.result});if(sessionStore.getItem(pendingKey)===jobId)sessionStore.removeItem(pendingKey);if(job.data.result?.conversationId)setConversation(job.data.result.conversationId);void history.refetch();void client.invalidateQueries({queryKey:['account-research']});const code=context.stock?.code||job.data.result?.report?.subject?.code;if(/^\d{6}$/.test(code||''))void client.invalidateQueries({queryKey:['resource','/api/research/records?code='+code]});}},[job.data,jobId]);
 async function submit(){if(posting.current||busy)return;if(!agent.ready){setStatus('请先配置并连接自己的 AI Agent，当前草稿保留；本地版不使用平台 AI。');return;}const text=question.trim();if(!text||text.length>500){setStatus('请输入1至500字的问题');return;}posting.current=true;const id=crypto.randomUUID(),payload={question:text,context:Session.context(context),conversationId:conversation||null,turnId:id,deepThinking:deep,agentRole:role,responseDetail:preferences.reportDetail,debug:false};if(typeof initial?.onStarted==='function')initial.onStarted({jobId:id});setStatus('正在提交本机任务，任务编号用于去重');if(!sessionStore.setItem(pendingKey,id))setStatus('浏览器禁止保存恢复编号，请保留本页任务编号；当前提交仍只运行一次。');try{await create.mutateAsync(payload);setTurns(old=>[...old,{id,question:text}]);setJobId(id);setQuestion('');setSteps([]);}catch(e:any){if([400,401,403,409,422].includes(e.status)){if(typeof initial?.onRejected==='function')initial.onRejected({jobId:id});sessionStore.removeItem(pendingKey);setStatus(e.message+'；提交被拒绝，草稿保留。');return;}setJobId(id);setTurns(old=>[...old,{id,question:text}]);setStatus(e.message+'；只核对同一任务，不自动重复提交。');}finally{posting.current=false;}}
 function newResearch(){if(busy&&!restoringFailed||create.isPending)return;const previous=restoringFailed?jobId:'';if(previous&&sessionStore.getItem(pendingKey)===previous)sessionStore.removeItem(pendingKey);setHistoryOpen(false);setConversation('');setHistoryId('');if(!embedded)setParams({});setJobId('');setTurns([]);setQuestion('');setContext(Session.context({page:'研究工作台'}));setBack(null);setStatus(previous?'新的研究草稿已准备好，未停止本机任务、未重新提交。原任务编号 '+previous:'新的研究已准备好，历史记录仍保留');setSteps([]);input.current?.focus();}
 function load(id:string){if(busy||create.isPending)return;setHistoryOpen(false);setContext(Session.context({page:'研究工作台'}));setQuestion('');setBack(null);setConversation(id);setHistoryId(id);if(!embedded)setParams({conversation:id});setJobId('');setTurns([]);setSteps([]);setStatus('读取原账号历史会话');}
 function detachRecovery(){if(!job.error||!jobId||turns.some(t=>t.id===jobId))return;const id=jobId;if(sessionStore.getItem(pendingKey)===id)sessionStore.removeItem(pendingKey);setJobId('');setSteps([]);setStatus('已离开本地恢复，未停止本机任务、未重新提交。原任务编号 '+id+'，可保留编号后继续核对。');}
 const disabled=busy||create.isPending,visibleResult=result||[...turns].reverse().map(t=>client.getQueryData<any>(['resource','/api/agent/jobs/'+t.id])?.result).find(Boolean)||((messages.data?.messages||[]).filter(m=>m.role==='assistant'&&m.report).at(-1)?.report?{report:(messages.data?.messages||[]).filter(m=>m.role==='assistant'&&m.report).at(-1).report}:null);
 const empty=!conversation&&!turns.length&&!jobId;
 const historyPanel=<Widget title="历史研究" loading={history.isPending} error={history.error?.message} retry={()=>history.refetch()} actions={<button type="button" className="icon-button agent-history-refresh" aria-label="刷新历史" title={history.isFetching?'正在刷新历史':'刷新历史'} aria-busy={history.isFetching} disabled={history.isFetching} onClick={()=>void history.refetch()}><RefreshCw size={16}/></button>}>
<button className="primary" disabled={disabled&&!restoringFailed} onClick={newResearch}>新建研究</button>
<label className="agent-history-filter">检索历史<input aria-label="检索历史" type="search" value={filter} onChange={e=>setFilter(e.target.value)}/>
</label>{histories.map(c=>
<button className="agent-history-row" disabled={disabled} aria-pressed={conversation===c.id} key={c.id} onClick={()=>load(c.id)}>{c.title||'研究会话'}<small>原账号历史</small>
</button>)}{history.data&&!histories.length&&<p className="empty">暂无匹配的研究记录</p>}</Widget>;
 return <div className={'agent-page'+(embedded?' is-embedded':'')+(compact?' is-compact':'')+(restoringFailed?' recovery-failed':'')+(empty?' is-empty':'')}>
<div className="page-heading"><h1>问观澜</h1><span className="muted">用本地 AI Agent 核验事实、研究公司与市场</span></div>
<LocalAgentEntry onConfigure={()=>{if(!busy&&question.trim())sessionStore.setItem('guanlan.agent.handoff',JSON.stringify({question,context,returnTo:back,conversationId:conversation||null}));}}/>
{compact&&<div className="agent-mobile-toolbar" aria-label="研究工具"><button className="outline-button" onClick={()=>setHistoryOpen(true)}><History size={16}/>历史会话</button><button className="outline-button" disabled={disabled&&!restoringFailed} onClick={newResearch}><Plus size={16}/>新建研究</button><button className="outline-button" onClick={()=>setEvidenceOpen(true)}><FileSearch size={16}/>研究依据</button></div>}
<div className="agent-columns">
{!compact&&<aside className="agent-history">{historyPanel}</aside>}
<section className="agent-conversation">
<Widget title={conversation?'研究会话':'新的研究'} loading={messages.isPending&&!!historyId} error={messages.error?.message} retry={()=>messages.refetch()}>{embedded&&<div className="agent-embedded-toolbar">
<button className="outline-button" disabled={disabled} onClick={newResearch}>新建研究</button>
<Link to={conversation?"/agent?conversation="+encodeURIComponent(conversation):"/agent"} onClick={()=>{if(!busy&&question.trim())sessionStore.setItem("guanlan.agent.handoff",JSON.stringify({question,context,returnTo:back,conversationId:conversation||null}));}}>完整工作台</Link>
<label>历史会话<select aria-label="历史会话" value={historyId} disabled={disabled} onChange={e=>e.target.value&&load(e.target.value)}>
<option value="">选择历史</option>{histories.map(c=>
<option value={c.id} key={c.id}>{c.title||"研究会话"}</option>)}</select>
</label>
</div>}<div className="agent-message-scroll">{!conversation&&!turns.length&&!jobId&&<div className="agent-welcome">
<h2>这次，想核验什么？</h2>
<p>研究公司、题材，或核验一条市场判断。</p>
<details className="agent-prompt-details"><summary>看看提问示例</summary><div className="agent-prompts">{prompts.map(([label,title,prompt])=>
<button key={label} onClick={()=>{setQuestion(prompt);input.current?.focus();}}>
<small>{label}</small>
<strong>{title}</strong>
<span>填入提问框 ↗</span>
</button>)}<button type="button" className="agent-expert-shortcut ai-action" aria-label="打开问题模板" aria-haspopup="dialog" onClick={()=>setExpert(true)}>
<small>
<AiIcon/>问题模板
</small>
<strong>资金雷达 · 擒龙九维 · 量化诊断</strong>
<span>选择问题模板，仅预填问题，发送后才运行</span>
</button>
</div></details>
</div>}{(messages.data?.messages||[]).map((m,i)=>
<article key={m.id||i} className={m.role==='user'?'agent-message is-user':'agent-message'}>
<small>{m.role==='user'?'你的提问':'观澜 · 已保存'}</small>{m.role==='user'?<p>{m.content}</p>:<Answer text={m.report?.localHarness?String(m.content||''):String(m.content||'').split('\n').filter(s=>!s.startsWith('本轮用量：')).join('\n')} result={m.report?{report:m.report}:undefined}/>}</article>)}{turns.map(t=>{const value=t.id===jobId?job.data:client.getQueryData<any>(['resource','/api/agent/jobs/'+t.id]),answer=value?.result;return <div key={t.id}>
<article className="agent-message is-user">
<small>你的提问</small>
<p>{t.question}</p>
</article>
<article className="agent-message">
<small>观澜 · {({complete:'任务结束',failed:'任务未完成',stopped:'已停止',needs_attention:'等待核对',queued:'排队中',running:'研究中'})[value?.status]||'等待进度'}</small>{answer?<>
<Answer text={answer.answer||'尚未返回正文'} result={answer}/>{answer.disclaimer&&<p className="provenance">{answer.disclaimer}</p>}<Diagnostics value={answer.diagnostics}/>
</>:<p>{value?.status==='stopped'?'本轮已停止，阶段结果保留；可继续本轮。':value?.error||'正在核验资料，已显示的其他模块仍可使用。'}</p>}</article>
</div>;})}{jobId&&!turns.some(t=>t.id===jobId)&&<article className="agent-message">
<small>恢复原任务 · {job.data?.archived?'已从账户历史恢复':job.data?.status|| (job.error?'暂未找到可恢复结果':'正在核对')}</small>
<p>{job.data?.question||'任务编号 '+jobId}</p>{result&&<>
<Answer text={result.answer||'尚无正文'} result={result}/>
<Diagnostics value={result.diagnostics}/>
</>}</article>}</div>{steps.length>0&&<details className="agent-progress">
<summary>研究阶段 · {steps.at(-1)}</summary>
<ol>{steps.map((s,i)=>
<li key={i}>{s}</li>)}</ol>
<p>只展示取数、补证和校验阶段，不展示模型内部思考。</p>
</details>}{job.error&&<p className="local-error" role="status">暂时无法核对原任务；不会自动重新提交或调用模型。请保留任务编号后重试。<button className="outline-button" onClick={()=>job.refetch()}>重新核对任务</button>{!turns.some(t=>t.id===jobId)&&<button type="button" className="outline-button" onClick={detachRecovery}>暂不恢复此任务</button>}
</p>}{status&&<p role="status" className="local-status">{status}</p>}{jobId&&<p className="provenance">任务 {jobId} · {job.data?.status||'待核对'} · 数据 {result?.asof||'见各项证据时间'}</p>}<form className="agent-composer" onSubmit={e=>{e.preventDefault();submit();}}>{context.page!=='研究工作台'&&<div className="agent-context">来自 {context.page} {context.section||''} {context.stock?.name||''} {context.asof||''} {back&&<a className="accent" href={back}>返回来源</a>}<button type="button" className="outline-button" disabled={disabled} onClick={()=>{setContext(Session.context({page:'研究工作台'}));setBack(null);}}>清除上下文</button>
</div>}<div className="agent-composer-heading"><label htmlFor={questionId}>你的问题</label><small>{question.length} / 500</small></div>
<textarea ref={input} id={questionId} maxLength={500} rows={4} value={question} disabled={disabled} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(!narrow&&e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();submit();}}} placeholder="输入公司、题材，或你希望核验的问题…"/>
<div className="agent-composer-actions">
<div className="agent-compose-tools">
<button type="button" className="agent-template-trigger" disabled={disabled} aria-haspopup="dialog" onClick={()=>setExpert(true)}><AiIcon/>问题模板</button>
<details className="agent-research-settings" open={settingsOpen} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setSettingsOpen(false);e.currentTarget.querySelector('summary')?.focus();}}}>
<summary aria-label="研究设置" onClick={e=>{e.preventDefault();setSettingsOpen(v=>!v);}} title={(role==='legacy'?'原版解读':'专业投研')+'；深度思考'+(deep?'开启':'关闭')}><Settings2 size={16}/><span>设置</span></summary>
<div className="agent-settings-panel" hidden={!settingsOpen}><strong>研究设置</strong><label>解读风格<select aria-label="研究角色" disabled={disabled} value={role} onChange={e=>setRole(e.target.value)}><option value="professional">专业投研</option><option value="legacy">原版解读</option></select></label>
<label className="agent-thinking-option"><input type="checkbox" checked={deep} disabled={disabled} onChange={e=>setDeep(e.target.checked)}/>深度思考</label><p>本地 AI Agent 自主组织研究；深度思考可能增加等待时间和本人额度消耗。</p></div>
</details></div>
<div className="agent-send-actions">{busy?<button type="button" className="outline-button agent-stop-button" aria-label="停止本轮" disabled={control.isPending} onClick={()=>control.mutate({action:'stop',id:jobId})}><Square size={14}/>停止</button>:<button className="primary agent-send-button" disabled={disabled||!agent.ready||!question.trim()} aria-label="发送提问"><ArrowUp size={18}/><span>发送</span></button>}</div>
</div>{control.error&&<p className="local-error" role="status">操作未确认：{control.error.message}；请重新核对任务状态。</p>}</form><div className="agent-composer-note"><span>{narrow?'点击发送后才开始研究':'Enter 发送，Shift + Enter 换行'}</span><span>使用本地 AI Agent 账号额度</span></div>{job.data?.status==='stopped'&&<button type="button" className="outline-button" disabled={control.isPending} onClick={()=>control.mutate({action:'resume',id:jobId})}>继续本轮</button>}
</Widget>
</section>
{!compact&&<aside className="agent-evidence">
<Evidence result={visibleResult}/>
</aside>}
</div>
{compact&&<><Drawer className="agent-tools-drawer" open={historyOpen} onOpenChange={setHistoryOpen} title="历史研究">{historyPanel}</Drawer><Drawer className="agent-tools-drawer" open={evidenceOpen} onOpenChange={setEvidenceOpen} title="研究依据"><Evidence result={visibleResult}/></Drawer></>}
<Drawer open={expert} onOpenChange={setExpert} title="问题模板">
<div className="expert-catalog">{experts.map(s=>
<button key={s.id} aria-pressed={s.id===expertId} onClick={()=>{setExpertId(s.id);setExpertMode(0);}}>{s.name}</button>)}</div>
<h3>{skill.name}</h3>
<p>{skill.note}</p>
<div className="expert-catalog">{skill.modes.map((m,i)=>
<button key={m[0]} aria-pressed={expertMode===i} onClick={()=>setExpertMode(i)}>{m[0]}</button>)}</div>{(skill.modes[expertMode]||skill.modes[0]).slice(1).map(text=>
<button className="expert-example" key={text} onClick={()=>{setQuestion(text);setContext(Session.context(expertId==='funds'?{page:'研究工作台',section:'funds-radar-v1',funds:{mode:'report',kind:'industry',period:'today',boards:[]}}:expertId==='qinlong'&&expertMode===0?{page:'研究工作台',fixedReport:{type:'dragon-score',version:1}}:{page:'研究工作台'}));setExpert(false);input.current?.focus();}}>{text}<small>仅预填，不自动运行</small>
</button>)}</Drawer>
</div>;
}
