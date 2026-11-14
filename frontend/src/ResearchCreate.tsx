import {useEffect,useRef,useState} from 'react';
import {useQuery}from'@tanstack/react-query';
import SecurityAutocomplete from './SecurityAutocomplete';
import type {SecurityAsset} from './security-lookup';
import {AiAction} from './AiAction';
import {calendarDay} from '../../web/shared/fixed-research-contract.mjs';
import {submitResearch} from './api';
import LocalAgentEntry,{useAgentConnection}from'./LocalAgentEntry';
import {engineName}from'./local-engines';
import {identityQuery}from'./security-lookup';
function shanghaiDay(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(type=>parts.find(p=>p.type===type)?.value).join('-');}
export default function ResearchCreate({seed,onSaved}:{seed:Record<string,string>;onSaved:(r:any)=>void}){
 const agent=useAgentConnection(),today=shanghaiDay();
 const [kind,setKind]=useState(['company','industry','topic'].includes(seed.kind)?seed.kind:'company'),[input,setInput]=useState(seed.code||''),[identity,setIdentity]=useState<SecurityAsset|null>(null),[name,setName]=useState(seed.name||''),[industry,setIndustry]=useState(seed.industry||''),[focus,setFocus]=useState(seed.focus||''),[asof,setAsof]=useState(shanghaiDay),[deep,setDeep]=useState(false),[mode,setMode]=useState(seed.mode==='note'?'note':'ai'),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[submitted,setSubmitted]=useState(false);
 const seededIdentity=useQuery({...identityQuery(seed.code||''),enabled:kind==='company'&&/^\d{6}$/.test(seed.code||'')&&input===seed.code&&!identity});
 useEffect(()=>{if(kind==='company'&&input===seed.code&&seededIdentity.data)setIdentity(seededIdentity.data);},[seededIdentity.data,input,kind,seed.code]);
 const requestId=useRef(crypto.randomUUID()),lock=useRef(false),frozen=useRef<any>(null);
 const formIssue=kind==='company'&&!identity?(seededIdentity.isFetching?'正在核验预填公司的证券身份…':'请从候选中选择并确认研究公司；仅填写代码或名称还未确认身份。'):kind!=='company'&&!name.trim()?'请填写研究对象。':!calendarDay(asof)?'请选择有效的资料截止日期。':asof>today?'资料截止日期不能晚于今天。':mode==='note'&&!note.trim()?'请填写笔记正文。':'';
 const valid=!formIssue,canStart=valid&&(mode==='note'||submitted||agent.ready);
 async function save(){if(lock.current||!canStart)return;lock.current=true;setBusy(true);setError('');setSubmitted(true);
  frozen.current??={requestId:requestId.current,subject:{kind,name:kind==='company'?identity!.name:name.trim(),...(kind==='company'?{code:identity!.code}:{})},asof,deepThinking:deep,industry,focus,snapshotId:seed.snapshotId||null,...(mode==='note'?{note}:{})};
  try{const data=await submitResearch(frozen.current);onSaved(data.run);}catch(e:any){setError(e.message);}finally{lock.current=false;setBusy(false);}
 }
 return <div className="stack-form personal-research-create"><p className="provenance">个人研究独立保存，不限制平台案例或公司市值。只带公开对象与研究范围，不读取个人持仓成本。</p>{mode==='ai'&&<LocalAgentEntry/>}<fieldset disabled={submitted}><label>研究类型<select value={kind} onChange={e=>{setKind(e.target.value);setIdentity(null);}}><option value="company">公司价值研究</option><option value="industry">产业价值研究</option><option value="topic">专题深挖</option></select></label>
 {kind==='company'?<><SecurityAutocomplete label="选择研究公司" value={input} onChange={v=>{setInput(v);setIdentity(null);}} onSelect={setIdentity}/>{identity&&<p className="research-create-identity"><strong>{identity.name}</strong>{identity.code} · {identity.source}</p>}</>:<label>研究对象<input value={name} maxLength={80} onChange={e=>setName(e.target.value)} placeholder={kind==='industry'?'例如 工业洁净室、液冷系统':'例如 订单增长能否转为经营现金'}/></label>}
 <label>关联产业 / BOM 环节（可选）<input value={industry} maxLength={80} onChange={e=>setIndustry(e.target.value)} placeholder="作为待核验线索，不视为受益证明"/></label><label>研究重点<textarea value={focus} maxLength={1000} onChange={e=>setFocus(e.target.value)} rows={3} placeholder="希望重点核对的赚钱业务、壁垒、订单或风险"/></label><label>资料截止日期<input type="date" value={asof} max={today} onChange={e=>setAsof(e.target.value)}/></label>
 <label>记录方式<select value={mode} onChange={e=>setMode(e.target.value)}><option value="ai">本地 AI Agent 研究报告</option><option value="note">文字研究笔记</option></select></label>{mode==='note'?<label>笔记正文<textarea value={note} maxLength={8000} rows={7} onChange={e=>setNote(e.target.value)}/></label>:<label className="research-thinking"><input type="checkbox" checked={deep} onChange={e=>setDeep(e.target.checked)}/>深度思考</label>}
 </fieldset>{mode==='ai'&&<div className="research-cost-notice"><strong>{agent.ready?'将使用你的 '+engineName(agent.data?.engine)+' Agent 生成研究':'请先配置并连接自己的 AI Agent'}</strong><p>{agent.ready?(agent.data?.billingSource||'费用由本人所选供方账号承担')+'；不使用观澜平台 AI 额度。':'未连接时不能生成 AI 研究；也可以选择“文字研究笔记”，不调用 AI。'}</p><p>提问和选定公开资料交给所选 Agent 自主研究，保留原生回答。失败保留已有报告，不自动重跑、不切其他引擎或平台扣费。</p></div>}{formIssue&&!submitted&&<p className="research-validation" role="status">{formIssue}</p>}{error&&<p className="local-error" role="alert">{error} 研究参数已锁定，重试只核对同一请求，不新建任务。</p>}{mode==='ai'?<AiAction intent="run" disabled={!canStart||busy} title={!canStart?(formIssue||'请先连接自己的 AI Agent'):undefined} onClick={()=>void save()}>{busy?'正在核对任务…':submitted?'核对并恢复同一请求':'确认并开始研究'}</AiAction>:<button className="primary" disabled={!canStart||busy} onClick={()=>void save()}>{busy?'正在保存…':submitted?'核对并恢复同一请求':'保存文字记录'}</button>}
 </div>;
}
