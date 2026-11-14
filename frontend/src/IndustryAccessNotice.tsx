import {useLocation} from 'react-router-dom';
import type {ReactNode} from 'react';
import './industry-access.css';
export default function IndustryAccessNotice({error,kind='shared',children}:{error:any;kind?:'shared'|'updates'|'reports';children:ReactNode}){
 const location=useLocation(),status=error?.status;
 if(status!==401&&status!==403)return children;
 const returnTo='/next'+location.pathname+location.search,login='/next/login?returnTo='+encodeURIComponent(returnTo),local=['localhost','127.0.0.1','[::1]'].includes(window.location.hostname);
 if(kind==='updates')return <div className="industry-access-compact" role="status">{status===401?<a href={login}>登录后查看更新</a>:<span>当前账号无权读取更新</span>}</div>;
 return <div className="industry-access" role="status"><p>{status===401?(local?'本地预览尚未登录，无法读取'+(kind==='reports'?'研报目录':'共享资料')+'。本地与线上登录状态不互通。':'登录状态已失效，请重新登录后读取'+(kind==='reports'?'研报目录':'共享资料')+'。'):'当前账号暂无权限读取'+(kind==='reports'?'研报目录':'共享资料')+'，这不是来源采集失败。'} 已显示的公开披露和原日期保留。</p><div>{status===401&&<a className="outline-button" href={login}>{kind==='reports'?'登录查看研报目录':'登录读取共享资料'}</a>}{local&&kind==='shared'&&<a className="outline-button" href={'https://guanlan.gdjustwuxia.workers.dev'+returnTo} target="_blank" rel="noopener noreferrer">打开线上版本</a>}</div></div>;
}
