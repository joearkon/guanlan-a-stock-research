import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {BellRing} from 'lucide-react';
import {publicQuery} from './api';
import {Drawer,Skeleton} from './components';
import {AlertNotificationSettings} from './AlertToasts';
import {usePreferences} from './personal-preferences';
function RuleCount(){
 const {account}=usePreferences(),q=useQuery({...publicQuery('/api/notifications/rules',30000),enabled:account!=='guest'});
 if(account==='guest')return <p className="provenance">登录后可管理个人规则。</p>;
 return <div className="alert-rule-count" aria-live="polite">{q.isPending?<Skeleton label="提醒规则数量"/>:q.error?<p className="local-error">规则数量读取失败，不能确认监测状态。<button className="outline-button" onClick={()=>q.refetch()}>重试规则数量</button></p>:<p>已启用 {(q.data?.rules||[]).filter((r:any)=>r.enabled).length} 条规则 · 已保存 {q.data?.rules?.length||0} 条<span className="provenance">启用不代表最近检查成功，请在规则管理核对时间和数据状态。</span></p>}</div>;
}
export default function MonitorAlertButton(){
 const {account}=usePreferences(),[open,setOpen]=useState(false);
 return <><button type="button" className="outline-button monitor-alert-button" aria-label="盯盘提示" onClick={()=>setOpen(true)}><BellRing size={16}/><span className="monitor-alert-wide">盯盘提示</span><span className="monitor-alert-small" aria-hidden="true">提示</span></button><Drawer open={open} onOpenChange={setOpen} title="盯盘提示设置">{open&&<><RuleCount/><AlertNotificationSettings account={account}/></>}</Drawer></>;
}
