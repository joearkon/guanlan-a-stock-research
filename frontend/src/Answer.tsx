import {memo} from 'react';
import Renderer from '../../web/v2/agent-answer-render.mjs';
import '../../web/shared/agent-answer-render.css';
export default memo(function Answer({text}:{text:string}){return <div className="saved-answer" dangerouslySetInnerHTML={{__html:Renderer.render(text)}}/>;});
