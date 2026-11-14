import {useEffect,useState} from 'react';
import {validDate} from './portfolio-data';
import './market-history.css';
export default function MarketHistoryControls({label,days,through,max,onDays,onThrough,busy=false}:{label:string;days:number;through:string;max:string;onDays:(days:number)=>void;onThrough:(date:string)=>void;busy?:boolean}){
 const [draft,setDraft]=useState(through);
 useEffect(()=>setDraft(through),[through]);
 return <form className="market-history-controls" aria-label={label+'历史筛选'} onSubmit={e=>{e.preventDefault();if(validDate(draft)&&draft<=max)onThrough(draft);}}>
  <label>交易日窗口<select aria-label={label+'历史天数'} value={days} onChange={e=>onDays(Number(e.target.value))}>{[10,15,30,60].map(n=><option key={n} value={n}>近{n}日</option>)}</select></label>
  <label>历史截止<input type="date" required aria-label={label+'历史截止日期'} max={max||undefined} value={draft} onChange={e=>setDraft(e.target.value)}/></label>
  <button type="submit" className="outline-button" aria-label="查看历史" disabled={busy&&draft===through||!max||!validDate(draft)||draft>max}>{busy&&draft===through?'加载中…':'查看历史'}</button>
  {through&&through!==max&&<button type="button" className="outline-button" onClick={()=>onThrough('')}>返回最近</button>}
 </form>;
}
export function HistoryRange({data,window,pending}:{data:{date:string}[];window?:{days:number;through:string};pending:boolean}){
 if(!window)return null;
 return <p className="provenance" role="status">{pending?'当前仍显示':'显示'}近{window.days}个交易日 · 截至 {window.through} · 已取得 {data.length} 个日期{data.length?`（${data[0].date} 至 ${data.at(-1)!.date}）`:''}。{pending?'所选范围尚未读取成功，保留以上已取得数据。':'两块共用筛选，缺失不补零。'}</p>;
}
