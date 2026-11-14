import {memo} from 'react';
import '../../web/shared/dragon-card.js';
import '../../web/shared/dragon-card.css';
import Answer from './Answer';
import NativeAnswer from './NativeAnswer';
import FixedReport from './FixedReport';
import {engineName}from'./local-engines';
export default memo(function AgentAnswer({text,result}:{text:string;result?:any}){
 const local=result?.localHarness?result:result?.report?.localHarness?result.report:null;
 if(local)return <section>
  <p className="provenance">本地 AI Agent · {engineName(local.engine)} · {local.billingSource||'本人供方账号额度，具体费用请在供方核对'} · 不使用平台 AI 额度</p>
  <NativeAnswer text={text}/>
  {local.citations?.length>0&&<details className="native-provider-sources"><summary>供方返回的引用来源 · {local.citations.length}</summary><ul>{local.citations.filter((c:any)=>/^https?:\/\//i.test(c.url||'')).map((c:any,i:number)=><li key={i}><a href={c.url} target="_blank" rel="noopener noreferrer">{c.title||c.url}</a></li>)}</ul></details>}
  {local.runtimeWarnings?.length>0&&<aside className="local-error" role="note"><h4>运行提示</h4><ul>{local.runtimeWarnings.map((item:string)=><li key={item}>{item}</li>)}</ul></aside>}
  {local.missing?.length>0&&<aside className="local-error" role="note"><h4>本轮数据缺口</h4><ul>{local.missing.map((item:string)=><li key={item}>{item}</li>)}</ul></aside>}
  <p className="provenance">仅供研究参考，不构成投资建议；未知用量不补零。</p></section>;
 if(result?.report)return <FixedReport report={result.report} expected={result.requestedReport} text={text}/>;
 if(result?.requestedReport)return <div><p className="local-error" role="alert">固定报告尚未完成，以下仅为已有返回内容，不是完整研究。</p><details><summary>查看阶段原文</summary><pre>{text}</pre></details></div>;
 const global:any=globalThis,renderer=global.window?.GLDragonCard||global.GLDragonCard,html=renderer?.render(text);
 return html?<div className="agent-structured-answer" dangerouslySetInnerHTML={{__html:html}}/>:<Answer text={text}/>;
});
