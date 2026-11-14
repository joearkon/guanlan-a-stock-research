import {memo} from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './native-answer.css';
// Render native prose, not a platform report. Raw HTML stays text; external
// images remain explicit links so reading an answer cannot load a tracking URL.
export default memo(function NativeAnswer({text}:{text:string}){
 return <div className="saved-answer native-answer"><div className="agent-answer-text">
  <Markdown remarkPlugins={[remarkGfm]} components={{
   a:({node,...props})=><a {...props} target="_blank" rel="noopener noreferrer"/>,
   img:({src,alt})=>src?<a href={src} target="_blank" rel="noopener noreferrer">{alt||'查看图片'}（外部图片）</a>:<span>{alt||'图片地址不可用'}</span>,
   table:({node,...props})=><div className="native-table-scroll" role="region" aria-label="回答表格" tabIndex={0}><table {...props}/></div>
  }}>{text}</Markdown>
  <details className="agent-answer-full"><summary>完整原文</summary><pre className="agent-answer-full-pre">{text}</pre></details>
 </div></div>;
});
