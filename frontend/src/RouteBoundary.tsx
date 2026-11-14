import {Component,Fragment,type ReactNode} from 'react';
import {buildErrorDiagnostic,reportClientError} from './client-errors';
export default class RouteBoundary extends Component<{children:ReactNode},{error:Error|null,revision:number}>{
 state:{error:Error|null,revision:number}={error:null,revision:0};
 static getDerivedStateFromError(error:Error){return {error};}
 componentDidCatch(error:Error){this.reportId=reportClientError(error,/dynamically imported module|Loading chunk|module script|Importing a module script|CSS chunk/i.test(error.message||'')?'resource':'render');this.forceUpdate();}
 reportId:string|null=null;
 render(){
  const error=this.state.error;
  if(!error)return <Fragment key={this.state.revision}>{this.props.children}</Fragment>;
  const chunk=/dynamically imported module|Loading chunk|module script|Importing a module script|CSS chunk/i.test(error.message||'');
  const diagnostic=buildErrorDiagnostic(error,chunk?'resource':'render');
  return <section className="widget" role="alert"><h2>{chunk?'页面文件加载失败':'当前页面显示异常'}</h2><p className="muted">{chunk?'可能是网络中断，或更新后旧页面引用的文件已变更。重新加载以读取最新页面。':'本页渲染发生异常，可以重试；如果仍失败，请重新加载页面。'}侧栏与顶栏仍可使用，账户记录不会因此更改。</p>{!chunk&&<button className="outline-button" onClick={()=>this.setState(s=>({error:null,revision:s.revision+1}))}>重新显示当前页面</button>} <a className="outline-button" href={window.location.href}>重新加载最新页面</a><details><summary>查看技术诊断</summary><p className="muted">仅尝试上报脱敏故障元信息，不含账户内容、网址参数或原始错误正文，不会调用 AI。离线或上报失败不重试。</p><pre aria-label="页面错误诊断" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify({...diagnostic,id:this.reportId||'未提交'},null,2)}</pre></details></section>;
 }
}
