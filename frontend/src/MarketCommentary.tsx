import {AiAction} from './AiAction';
import {useEffect,useRef,useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {publicQuery,retryRead} from './api';
import {sessionStore} from './session-store';
import {Widget,Skeleton} from './components';
import AgentAnswer from './AgentAnswer';
import './market-commentary.css';
import {engineName}from'./local-engines';
import LocalAgentEntry,{useAgentConnection}from'./LocalAgentEntry';
const version='market-commentary-v1';
const validResult=(r:any,day?:string)=>r?.localHarness===true&&r.asof===day&&typeof r.answer==='string'&&!!r.answer.trim();
async function post(url:string,body:any){const r=await fetch(url,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-gl':'1'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)}),v=await r.json();if(!r.ok)throw Object.assign(Error(v.error||'请求未确认，请核对原任务'),{status:r.status});return v;}
export default function MarketCommentary({day}:{day?:string}){
 const account=useQuery(publicQuery('/api/me',300000)),owner=account.data?.user?.id;
 return <CommentaryPanel key={String(owner)+':'+day} day={day} owner={owner}/>;
}
function CommentaryPanel({day,owner}:{day?:string,owner?:number}){
 const client=useQueryClient();
 const agent=useAgentConnection(String(owner||'guest'));
 const settings=useQuery({queryKey:['local-ai-settings',String(owner)],queryFn:({signal})=>publicQuery('/api/local-ai/settings').queryFn({signal}),enabled:!!owner,retry:false,staleTime:0});
 const selection=settings.data?.selection;
 const thinkingKey='guanlan.commentary-thinking:'+owner,[deep,setDeep]=useState(()=>sessionStore.getItem(thinkingKey)!=='false');
 const storageKey=owner&&day?'guanlan.market-commentary:'+owner+':'+day:null;
 const [jobId,setJobId]=useState(''),[lastId,setLastId]=useState(''),[sending,setSending]=useState(false),[feedback,setFeedback]=useState(''),[control,setControl]=useState(false),lock=useRef(false);
 const resultKey=['market-commentary-result',owner,day];
 const [saved,setSaved]=useState<any>(()=>client.getQueryData(resultKey)||null);
 useEffect(()=>{setJobId('');setLastId('');setSaved(client.getQueryData(resultKey)||null);if(!storageKey)return;const id=sessionStore.getItem(storageKey),last=sessionStore.getItem(storageKey+':complete');if(/^[0-9a-f-]{36}$/i.test(id||''))setJobId(id!);if(/^[0-9a-f-]{36}$/i.test(last||''))setLastId(last!);},[storageKey]);
 const job=useQuery({...publicQuery('/api/agent/jobs/'+jobId,0),enabled:!!jobId&&!!owner,retry:retryRead(1),refetchInterval:q=>q.state.error||['complete','failed','stopped','needs_attention'].includes(q.state.data?.status)?false:5000});
 const previous=useQuery({...publicQuery('/api/agent/jobs/'+lastId,300000),enabled:!!owner&&!!lastId&&lastId!==jobId,retry:retryRead(1)});
 const state=job.data?.status,terminal=['complete','failed','stopped','needs_attention'].includes(state),busy=sending||!!jobId&&!terminal;
 const output=job.data?.result,report=validResult(saved?.result,day)?saved.result:null;
 useEffect(()=>{
  const current=state==='complete'&&validResult(output,day)?job.data:previous.data?.status==='complete'&&validResult(previous.data?.result,day)?previous.data:null;
  if(!current)return;
  setSaved(current);client.setQueryData(resultKey,current);
  if(current===job.data){setLastId(jobId);if(storageKey)sessionStore.setItem(storageKey+':complete',jobId);}
 },[state,output,day,owner,jobId,previous.data]);
 async function generate(){
  if(lock.current||busy||!day||!owner||!selection||!agent.ready)return;lock.current=true;setSending(true);setFeedback('');
  const id=crypto.randomUUID(),payload={question:`请研究 ${day} 的全市场收盘盘面。可自主组织步骤与回答，结合指数、量能、广度、风格、板块与风险证据，区分事实、推断和后续验证条件。共享资料有缺口就明确说明；联网补证须核对资料日期，不将后续信息冒充当日已知信息。`,turnId:id,agentRole:'professional',deepThinking:deep,outputMode:'native',context:{page:'全市场观测',section:version,asof:day}};
  if(storageKey&&!sessionStore.setItem(storageKey,id))setFeedback('浏览器无法保存恢复编号，请保留本页任务编号。');
  try{const value=await post('/api/agent/jobs',payload);setJobId(id);client.setQueryData(['resource','/api/agent/jobs/'+id],value);}
  catch(e:any){if([400,401,403,409,422,429].includes(e.status)){if(storageKey)sessionStore.setItem(storageKey,jobId);setFeedback(e.message+'；未切换平台或重新提交。');}else{setJobId(id);setFeedback('提交结果尚未确认，正在核对同一任务，不自动重复生成。');}}
  finally{setSending(false);lock.current=false;}
 }
 async function manage(action:'stop'|'revalidate'){
  if(control)return;setControl(true);setFeedback('');
  try{const v=await post('/api/agent/jobs/'+jobId+'/'+action,{});if(action==='stop'&&v.stopped!==true)throw Error('任务可能已完成，请核对状态');if(action==='revalidate'){if(v.id!==jobId||v.status!=='complete')throw Error('原回执恢复尚未确认');setFeedback('已恢复原模型回执，未重新调用模型。');client.setQueryData(['resource','/api/agent/jobs/'+jobId],v);}await job.refetch();}
  catch(e:any){setFeedback(e.message+'；原结果保留，不自动新建。');}finally{setControl(false);}
 }
 return <Widget title="AI 盘面点评" subtitle={(day?day+' · ':'')+'所选业务日收盘分析，非实时 · 本地 AI Agent 原生回答'} actions={<AiAction intent="run" className="primary" disabled={!day||!owner||!selection||!agent.ready||settings.isError||busy||control} onClick={()=>void generate()}>{sending?'正在提交…':report?'重新生成点评':'生成盘面点评'}</AiAction>}>
  <div className="market-commentary">
   <LocalAgentEntry account={String(owner||'guest')}/>
   <label className="commentary-thinking"><input type="checkbox" aria-label="盘面点评深度思考" checked={deep} disabled={busy||control} onChange={e=>{setDeep(e.target.checked);sessionStore.setItem(thinkingKey,String(e.target.checked));}}/>深度思考 <span className="provenance">沿用所选引擎能力，可能增加等待时间与本人额度消耗；不强制固定模板或 JSON。</span></label>
   <p className="provenance">只在主动生成时调用你配置的本地 AI Agent。不读取个人持仓；失败不自动重跑、不切换平台扣费。原生回答未作逐项事实校验，资料缺口与来源仍需复核。</p>
   {busy&&<div role="status" className="commentary-progress"><p>{sending?'正在提交任务':job.data?.stage||'正在核对本机任务'}；其他事实模块可继续使用。</p>{!report&&<Skeleton label="盘面点评"/>}{jobId&&<button disabled={control} onClick={()=>void manage('stop')}>停止生成</button>}</div>}
   {jobId&&<p className="provenance">任务 {jobId} · {state||'待核对'}</p>}
   {feedback&&<p role="status" className="local-status">{feedback}</p>}
   {job.error&&<p role="alert" className="local-error">进度读取失败，保留原任务和已有点评，不自动重复调用。<button onClick={()=>void job.refetch()}>核对原任务</button>{(job.error as any).status===404&&<button onClick={()=>{if(storageKey)sessionStore.removeItem(storageKey);setJobId('');setFeedback('任务编号已失效；可主动生成新任务。');}}>清除失效编号</button>}</p>}
   {['failed','needs_attention','stopped'].includes(state)&&<div role="alert" className="local-error"><p>{job.data?.error||'本轮未完成'} {report?'下方保留上次已完成的点评，并非本次新结果。':'本轮没有发布点评；不会自动重跑或切平台。'}</p><button type="button" className="outline-button" disabled={control} onClick={()=>void manage('revalidate')}>{control?'正在核对原回执…':'核对已保存回执（不重新生成）'}</button><p className="provenance">仅恢复已保存的模型回执；无回执时保持原状态。主动点击生成会发起新任务并消耗本人供方额度。</p></div>}
   {state==='complete'&&!validResult(output,day)&&<p role="alert" className="local-error">{output?.asof!==day?'点评日期不匹配，未作为当前业务日结果展示。':'没有可显示的本机原生点评，原回执保留，请核对任务。'}</p>}
   {!report&&!busy&&<div className="commentary-empty"><strong>先看事实，再读分析。</strong><p>点击生成后，由所选本地 AI Agent 自主研究并保留原生回答；阅读、刷新和恢复已有结果不重新调用模型。</p></div>}
   {report&&<>
    {(busy||saved.id!==jobId)&&<p className="provenance">以下保留上次已完成点评，不是本次新结果。</p>}
    <p className="provenance">分析日期 {report.asof} · 任务发起于 {new Date(saved.createdAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})}（北京时间）</p>
    <AgentAnswer text={report.answer} result={report}/>
    <details className="commentary-input"><summary>提供给本轮的共享资料来源 · {report.dataSources?.length||0} 项</summary><p>这是提交时提供的资料，不代表模型已逐项核验；自主联网来源以原文为准。缺项不补零。</p>{report.dataSources?.length?<ul>{report.dataSources.map((f:any,i:number)=><li key={i}>{f.source||'来源未提供'}<small>{f.dataDate||'日期未提供'}</small></li>)}</ul>:<p>未取得可用的共享资料，请结合原文核验联网依据与缺口。</p>}</details>
   </>}
  </div>
 </Widget>;
}
