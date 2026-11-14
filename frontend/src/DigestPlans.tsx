import {useState} from 'react';
import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {Widget,RefreshButton} from './components';
import {publicQuery} from './api';
const base='/api/notifications/plans',names:Record<string,string>={pre:'盘前核验摘要',close:'收盘事实摘要',research:'研究复核摘要'},times:Record<string,string>={pre:'09:05',close:'15:45',research:'16:30'};
const status:Record<string,string>={scheduled:'尚未到执行时间',not_checked:'尚未检查',waiting_data:'等待完整资料',complete:'站内摘要已生成',no_content:'本轮无需要发送的内容',missed:'已过执行窗口，未补造摘要',failed:'生成失败，将在窗口内重试',closed:'休市跳过',calendar_missing:'交易日历未覆盖',paused:'已暂停',superseded:'计划已变更，等待新版本'};
const stamp=(v:any)=>v?new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',dateStyle:'short',timeStyle:'medium'}).format(new Date(v)):'未提供';
export function DigestPlanEditor({type,initial}:{type:string,initial?:any}){
 const defaults=()=>({id:crypto.randomUUID(),digestType:type,time:times[type],enabled:false,channels:['inbox'],quietStart:'22:00',quietEnd:'08:00',timezone:'Asia/Shanghai'});
 const [value,setValue]=useState<any>(()=>initial||defaults()),client=useQueryClient(),push=useQuery(publicQuery('/api/notifications/push',30000)),canPush=push.data?.configured&&push.data?.subscriptions?.some((s:any)=>s.active);
 const mutation=useMutation({retry:false,mutationFn:async(remove:boolean)=>{const response=await fetch(base+(initial?'/'+initial.id:''),{method:remove?'DELETE':initial?'PUT':'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-gl':'1'},body:JSON.stringify(remove?{version:value.version}:value),signal:AbortSignal.timeout(20000)}),data=await response.json();if(!response.ok)throw Error(data.error||'计划保存未确认，请刷新后重试');return data;},onSuccess:data=>{if(data.plan)setValue(data.plan);if(data.deleted)setValue(defaults());client.setQueryData<any>(['resource',base],old=>old?{...old,plans:data.deleted?old.plans.filter((p:any)=>p.id!==initial.id):[data.plan,...old.plans.filter((p:any)=>p.id!==data.plan.id)]}:old);void client.invalidateQueries({queryKey:['resource',base]});}});
 const set=(key:string,v:any)=>setValue((old:any)=>({...old,[key]:v})),job=initial?.lastJob;
 return <Widget title={names[type]} subtitle={initial?'账号已保存计划 · '+(initial.enabled?'启用':'暂停'):'未保存建议 · 不会自动运行'}>
 <form className="stack-form" onSubmit={e=>{e.preventDefault();mutation.mutate(false);}}>
 <label>北京时间<input type="time" required min={type==='close'?'15:35':'06:00'} max={type==='pre'?'09:25':'21:55'} value={value.time} onChange={e=>set('time',e.target.value)}/></label>
 <p className="provenance">Asia/Shanghai · 仅官方交易日。{type==='pre'?'保留上一交易日收盘日期，汇总已订阅提醒。':type==='close'?'等待当日收盘资料，不拿昨日数字代替。':'只整理已保存的到期任务和待处理重点消息。'}</p>
 <label className="check-line"><input type="checkbox" checked={value.enabled} onChange={e=>set('enabled',e.target.checked)}/>启用摘要计划</label>
 <label className="check-line"><input type="checkbox" checked={value.channels.includes('webpush')} disabled={!canPush} onChange={e=>set('channels',e.target.checked?['inbox','webpush']:['inbox'])}/>额外浏览器推送</label>
 {!canPush&&<Link to="/notifications?tab=channels">先授权浏览器渠道 →</Link>}
 <div className="two-column"><label>免打扰开始<input type="time" value={value.quietStart} onChange={e=>set('quietStart',e.target.value)}/></label><label>免打扰结束<input type="time" value={value.quietEnd} onChange={e=>set('quietEnd',e.target.value)}/></label></div>
 {initial?.version!==undefined&&initial.version!==value.version&&<p role="status">计划版本已变化，当前草稿保留。<button type="button" onClick={()=>setValue(initial)}>放弃草稿并载入服务器版本</button></p>}
 <div className="notice-actions"><button className="primary" disabled={mutation.isPending}>{mutation.isPending?'正在保存…':'保存摘要计划'}</button>{initial&&<button type="button" disabled={mutation.isPending} onClick={()=>{if(window.confirm('删除这个摘要计划？已有消息和执行记录仍保留。'))mutation.mutate(true);}}>删除计划</button>}</div>
 {mutation.error&&<p role="status" className="local-error">{mutation.error.message}</p>}{mutation.isSuccess&&!mutation.data?.deleted&&<p role="status">计划已保存，以当前账号与版本执行。</p>}
 </form>
 <div className="digest-execution"><h3>真实执行状态</h3><p>{job?(status[job.status]||job.status):initial?(status[initial.lastStatus]||initial.lastStatus||'尚未检查'):'尚未保存，未创建执行任务'}</p>{job?.reason&&<p className="local-error">{job.reason}</p>}{initial?.lastError&&!job?.reason&&<p className="local-error">{initial.lastError}</p>}<p className="provenance">调度最近检查 {stamp(initial?.lastCheckedAt)}{job?' · 资料检查 '+stamp(job.checkedAt)+' · 尝试 '+job.attempts+' 次':''}</p>{job?.notificationId&&<Link to={'/notifications?message='+job.notificationId}>打开该次摘要 →</Link>}</div>
 </Widget>;
}
export default function DigestPlans(){const q=useQuery({...publicQuery(base,30000),refetchInterval:60000});return <><Widget title="摘要计划" loading={q.isPending} error={q.error?.message} retry={()=>q.refetch()} actions={<RefreshButton busy={q.isFetching} onClick={()=>q.refetch()} label="刷新摘要状态"/>}><p>建议时间不代表已订阅。保存并启用后由云端运行，关闭网页不影响；没有需要复核的内容时不生成演示消息。缺数据会等待并有限窗口重试。</p><p className="provenance">每账号每类一个计划；同一交易日同类摘要只生成一次。保存时间或版本变化不会重复发送已生成的当日摘要。外部服务接收状态请到推送渠道查看。</p></Widget>{q.data?.available?<div className="digest-grid">{['pre','close','research'].map(type=>{const initial=q.data.plans.find((p:any)=>p.digestType===type);return <DigestPlanEditor key={type} type={type} initial={initial}/>;})}</div>:q.data&&<Widget title="调度状态"><p className="empty">摘要调度尚未开启，站内消息与个股规则仍可使用。</p></Widget>}</>;}
