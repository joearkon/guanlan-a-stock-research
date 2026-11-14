import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {Gauge,Info,Clock3} from 'lucide-react';
import {publicQuery,number} from './api';
import {Widget,Segmented,RefreshButton} from './components';
import './account-usage.css';
const n=(value:any)=>number(value,0);
const stamp=(ms:any)=>ms?new Date(ms).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未记录';
export default function AccountUsage(){
 const [days,setDays]=useState('1'),[offset,setOffset]=useState(0);
 const q=useQuery({...publicQuery('/api/account/usage?'+new URLSearchParams({days,offset:String(offset)}),30000),retry:false,placeholderData:p=>p,refetchOnWindowFocus:false}),d=q.data;
 const label=!d?'正在读取':!d.guardEnabled?'额度限制未启用':!d.serviceEnabled?'平台AI新调用已暂停':!d.policy.enabled?'本账号AI新调用已暂停':d.today.remainingTokens===0||d.today.remainingCalls===0?'今日额度已达上限':d.today.availableSlots===0?'已有调用占用中':'可发起AI研究';
 return <div className="account-usage"><header className="usage-heading"><div><h1><Gauge size={24}/>用量与额度</h1><p>查看本人AI资源使用情况。当前由平台承担模型费用，本页不是费用账单。</p></div><div className="usage-actions"><Link className="outline-button" to="/account">我的账号</Link><RefreshButton label="刷新用量" busy={q.isFetching} onClick={()=>q.refetch({cancelRefetch:false})}/></div></header>
 <Widget title="今日可用额度" subtitle={d?`${d.today.day} · 北京时间每日零点重置`:'正在读取本人额度'} loading={q.isPending} refreshing={!!d&&q.isFetching} error={q.error?.message} retry={()=>q.refetch()}>
 {d&&<><div className="usage-state" role="status" data-available={label==='可发起AI研究'}><span>{label}</span><small><Clock3 size={14}/>下次重置 {stamp(d.today.resetAt)}</small></div>
 <div className="usage-allowance"><div className="usage-primary"><span>剩余Token预留额度</span><strong>{n(d.today.remainingTokens)}</strong><p>今日已预留 {n(d.today.reservedTokens)} / 上限 {n(d.policy.dailyTokens)}</p><progress aria-label="今日Token预留额度使用比例" max={d.policy.dailyTokens} value={Math.min(d.today.reservedTokens,d.policy.dailyTokens)}/></div><div className="usage-secondary"><div><span>剩余模型 / 检索阶段</span><strong>{n(d.today.remainingCalls)}</strong><small>今日 {n(d.today.stageCalls)} / 上限 {n(d.policy.dailyCalls)} 次</small></div><div><span>当前占用并发</span><strong>{n(d.today.running)} <small>/ {n(d.policy.concurrency)}</small></strong><small>占用包含跨日未确认的调用</small></div></div></div>
 <p className="usage-hint"><Info size={16}/>一次研究可能包含多次模型和联网阶段。个人余量仍受平台共享容量约束，不能直接换算为报告份数；预留量也不等于实际Token消耗。</p></>}
 {!d&&(q.error as any)?.status===401&&<a className="outline-button" href="/next/login?returnTo=%2Fnext%2Faccount%2Fusage">前往登录</a>}
 </Widget>
 <Widget title="使用记录" subtitle={d?`${d.range.from} 至 ${d.range.to} · 北京时间 · 更新于 ${stamp(d.generatedAt)}`:undefined} loading={q.isPending} refreshing={!!d&&q.isFetching} actions={<Segmented label="用量统计范围" value={days} onChange={v=>{setDays(v);setOffset(0);}} options={[["1","今日"],["7","近7天"],["30","近30天"]]}/>}>
 {d&&<><div className="usage-totals"><div><span>已回执Token</span><strong>{n(d.summary.reportedTokens)}</strong><small>仅合计输入和输出均完整的回执</small></div><div><span>模型调用回执</span><strong>{n(d.summary.modelCalls)}</strong><small>失败回执 {n(d.summary.modelErrors)} 次</small></div><div><span>API请求</span><strong>{n(d.summary.apiRequests)}</strong><small>错误 {n(d.summary.apiErrors)} · 限流 {n(d.summary.apiLimited)}</small></div></div>
 {d.summary.unknownUsageCalls>0&&<p className="usage-warning" role="note">有 {n(d.summary.unknownUsageCalls)} 次模型回执用量未完整，未按0消耗处理；实际消耗需核对供方。</p>}
 <details className="usage-daily"><summary>每日用量明细</summary><div className="usage-table-scroll"><table><thead><tr><th>日期</th><th>已回执Token</th><th>模型回执</th><th>模型 / 检索阶段</th><th>用量未完整</th></tr></thead><tbody>{d.daily.map(r=><tr key={r.day}><td>{r.day}</td><td>{n(r.reportedTokens)}</td><td>{n(r.modelCalls)}</td><td>{n(r.stageCalls)}</td><td>{n(r.unknownUsageCalls)}</td></tr>)}</tbody></table></div></details>
 <h3 className="usage-log-title">模型调用记录</h3><p className="usage-subtle">供方返回成功不等于报告最终校验通过。这里只展示回执信息，不展示提问或研究正文。</p>
 {d.calls.length?<div className="usage-table-scroll"><table><thead><tr>{['调用时间 / 类型','模型 / 供方','回执状态','输入Token','输出Token','耗时'].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>{d.calls.map(r=><tr key={r.id}><td>{stamp(r.createdAt*1000)}<small>{r.task||'未记录'}</small></td><td>{r.model||'未记录'}<small>{r.provider||'未记录'}</small></td><td><span className={'usage-receipt '+(r.status==='ok'?'':'uncertain')}>{r.status==='ok'?'返回成功':'失败或未确认'}</span></td><td>{r.inputTokens==null?'未提供':n(r.inputTokens)}</td><td>{r.outputTokens==null?'未提供':n(r.outputTokens)}</td><td>{n(r.latencyMs)} ms</td></tr>)}</tbody></table></div>:<p className="empty">此区间没有已保存的模型调用回执。浏览资料和恢复历史报告不会自动调用模型。</p>}
 <div className="usage-pagination"><span>每页20条 · 共 {n(d.total)} 条</span><button className="outline-button" disabled={!offset||q.isFetching} onClick={()=>setOffset(v=>Math.max(0,v-20))}>上一页</button><button className="outline-button" disabled={offset+20>=d.total||q.isFetching} onClick={()=>setOffset(v=>v+20)}>下一页</button></div></>}
 </Widget>
 <details className="usage-notes"><summary>额度与统计口径</summary><p>额度由平台设置，本页不可自行更改。每日按北京时间零点分日，切换统计区间不改变今日额度。Token预留包含已结束阶段，不因失败或查看历史而清零；超时或中断不代表免费，未知调用不会自动释放并发。</p><p>模型用量来自供方已保存回执，尚未接入价格、折扣与账单对账，因此不显示推测金额。API统计异步写入，可能稍晚于操作，包含读取本页的请求；首次记录时间为 {stamp(d?.telemetry?.since?d.telemetry.since*1000:null)}，不补造此前历史。</p><p>浏览、切换范围、刷新用量和查看调用明细都只读取账本，不创建研究、不重跑模型，也不消耗AI额度。</p></details>
 </div>;
}
