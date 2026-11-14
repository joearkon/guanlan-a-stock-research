import type {ButtonHTMLAttributes} from 'react';
import {Bot} from 'lucide-react';
import './ai-action.css';
export function AiIcon(){return <Bot size={18} aria-hidden="true" className="ai-action-icon"/>;}
export function AiAction({children,className='',intent='prepare',type='button',title,...props}:ButtonHTMLAttributes<HTMLButtonElement>&{intent?:'prepare'|'run'}){
 return <button {...props} type={type} className={'ai-action ai-action-'+intent+' '+className} title={title||(intent==='prepare'?'打开研究草稿，确认发送后才调用模型。':'确认后调用模型，沿用当前页面的深度思考选择。')}><AiIcon/>{children}</button>;
}
