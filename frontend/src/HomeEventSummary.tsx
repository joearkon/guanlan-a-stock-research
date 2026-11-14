import {safeSource} from './urls';
import './home-event-source.css';
export default function HomeEventSummary({event,onOpen}:{event:any;onOpen:()=>void}){const source=safeSource(event.sourceUrl);return <div className="home-event-copy"><button className="announcement-title" aria-label={'查看相关事件：'+event.title} onClick={onOpen}><strong>{event.title}</strong><small>{event.detail||'仅有披露记录，正文或摘要未取得。'}</small></button>{source&&<a className="home-event-source" href={source} target="_blank" rel="noopener noreferrer">{event.sourceLabel||'查看来源记录'} ↗</a>}</div>;}
