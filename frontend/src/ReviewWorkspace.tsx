import {lazy,Suspense,useState,useEffect} from 'react';
import {useSearchParams,useLocation,Navigate} from 'react-router-dom';
import {Segmented,Skeleton} from './components';
import './funding-observation.css';
const TradeSeats=lazy(()=>import('./TradeSeats'));
const Market=lazy(()=>import('./Market'));
const DailyReview=lazy(()=>import('./DailyReview'));
const Emotion=lazy(()=>import('./Emotion'));
const Directions=lazy(()=>import('./CollectiveRelay'));
export {ReviewNavigation,LegacyReview} from './review-navigation';
export default function ReviewWorkspace(){
 const [params,setParams]=useSearchParams(),emotion=params.get('section')==='emotion',directions=params.get('section')==='directions';
 const location=useLocation(),[notes,setNotes]=useState(params.get('section')==='notes');
 useEffect(()=>{if(params.get('section')==='notes')setNotes(true);},[params.get('section')]);
 if(params.get('section')==='radar'){const next=new URLSearchParams(params);next.delete('section');return <Navigate replace to={'/radar-observation'+(next.size?'?'+next.toString():'')+location.hash}/>;}
 function choose(v:string){setParams(p=>{const next=new URLSearchParams(p);next.set('section',v);next.delete('tab');return next;});}
 return <div className="review-workspace"><div className="page-heading"><div><h1>市场观测</h1><p className="muted">市场环境与情绪接力 · 保留各项业务日期</p></div></div><div className="market-observation-tabs"><Segmented label="市场观测视图" value={params.get('section')==='trade-seats'?'trade-seats':directions?'directions':emotion?'emotion':'overview'} options={[['overview','市场全景'],['emotion','情绪与接力'],['directions','方向与支撑'],['trade-seats','成交与席位 Beta']]} onChange={choose}/></div>
 <Suspense fallback={<Skeleton label="市场观测"/>}>{params.get('section')==='trade-seats'?<TradeSeats/>:directions?<Directions directions/>:emotion?<Emotion integrated/>:<><Market integrated/>
 <section className="market-observation-extra"><button className="outline-button" aria-expanded={notes} onClick={()=>setNotes(v=>!v)}>每日记录与验证</button><p className="provenance">保留每日要点、广度历史、分歧共识、封板节奏、资讯、导出和账号验证清单；通用情绪读数已合并。</p>{notes&&<Suspense fallback={<Skeleton label="每日记录"/>}><DailyReview integrated/></Suspense>}</section>
 </>}</Suspense></div>;
}
