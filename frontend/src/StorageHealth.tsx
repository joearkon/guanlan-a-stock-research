import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Database} from 'lucide-react';
import {publicQuery} from './api';
import {Drawer,Widget,RefreshButton} from './components';
import './storage-health.css';
const bytes=(v:any)=>Number.isFinite(v)?(v/1048576).toLocaleString('zh-CN',{minimumFractionDigits:1,maximumFractionDigits:1})+' MB':'未取得';
const time=(v:any)=>v?new Date(v).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未记录';
export default function StorageHealth(){
 const [open,setOpen]=useState(false);return <><button className="outline-button" onClick={()=>setOpen(true)}><Database size={16}/>存储与增长</button><Drawer className="storage-health" open={open} onOpenChange={setOpen} title="存储与增长">{open&&<Status/>}</Drawer></>;
}
function Status(){
 const q=useQuery({...publicQuery('/api/ops/storage',300000),retry:false,refetchOnWindowFocus:false}),d=q.data,latest=d?.daily?.[0];
 return <><p>公共历史压缩分层，账号资料独立保护。这里仅查看状态，不启动迁移、不扫描历史正文、不调用AI。</p><RefreshButton label="刷新存储状态" busy={q.isFetching} onClick={()=>q.refetch()}/><Widget title="容量与增长" loading={q.isPending} refreshing={!!d&&q.isFetching} error={q.error?.message} retry={()=>q.refetch()}>{d&&<><p className="provenance">{d.enabled?'自动维护已启用':'自动维护未启用'} · 测量时间 {time(latest?.measuredAt)}</p><div className="ops-metrics"><div><span>D1物理容量</span><strong>{bytes(latest?.d1Bytes)}</strong><small>包含可能可复用的空闲页</small></div><div><span>冷存正文</span><strong>{bytes(latest?.archiveBytes)}</strong><small>{latest?.archiveObjects??0} 个已校验对象</small></div><div><span>原始正文</span><strong>{bytes(latest?.archiveRawBytes)}</strong><small>仅对应已迁入的冷存对象</small></div><div><span>较上次日观测</span><strong>{bytes(d.deltaBytes)}</strong><small>{d.deltaBytes==null?'积累两个日期后计算':'D1实际文件大小差额'}</small></div></div>{!latest&&<p className="empty">尚未完成首次后台测量；不将未知容量显示成0。</p>}{(d.warnings||[]).map((w:string)=><p className="local-error" role="alert" key={w}>{w}</p>)}{(d.jobs||[]).map((j:any)=><article className="ops-notes" key={j.name}><strong>{j.name}</strong><p>已检查 {j.scanned} 条，已迁入 {j.moved} 条。最近成功 {time(j.lastSuccessAt)}。</p>{j.lastError&&<p className="local-error">{j.lastError} · 旧数据保留，后续从已提交断点继续</p>}</article>)}<details className="ops-notes"><summary>最近30个观测日</summary><div className="ops-table-scroll"><table className="ops-table" style={{minWidth:480}}><thead><tr><th>日期</th><th>D1</th><th>冷存正文</th><th>对象数</th></tr></thead><tbody>{(d.daily||[]).map((row:any)=><tr key={row.day}><td>{row.day}</td><td>{bytes(row.d1Bytes)}</td><td>{bytes(row.archiveBytes)}</td><td>{row.archiveObjects}</td></tr>)}</tbody></table></div></details><details className="ops-notes"><summary>保留与恢复规则 · {d.policy?.version}</summary><p>{d.policy?.hot}；{d.policy?.cold}。公共历史、昨日基线和个人研究不自动删除；无引用的孤立对象先闲置7天、再隔离7天才回收。损坏或读取失败不混入当前报价、不自动重跑研究。</p><p>{d.note}</p></details></>}</Widget></>;
}
