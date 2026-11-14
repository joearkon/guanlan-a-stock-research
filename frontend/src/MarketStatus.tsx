import {useEffect,useRef}from'react';import{useQuery}from'@tanstack/react-query';import{publicQuery}from'./api';import{marketSession,useMarketClock}from'./market-polling';import'./market-status.css';
export default function MarketStatus({calendarUrl='/api/data/free?view=watch'}:{calendarUrl?:string}={}){
 const query=useQuery({...publicQuery(calendarUrl,300000),retry:false}),now=useMarketClock(),state=marketSession(query.data?.trading_calendar,now),lastDay=useRef(state.day);
 useEffect(()=>{if(lastDay.current!==state.day){lastDay.current=state.day;void query.refetch({cancelRefetch:false});}},[state.day]);
 const label=state.kind==='lunch'?'午休':state.kind==='auction'?'竞价':state.label;
 const title=state.day+' '+state.hm+'（北京时间） · '+state.detail+'。这是交易时段，不是报价时效；报价日期和采集时间以各模块为准。'+(query.error?' 日历读取失败，已取得且仍覆盖今日的日历可继续用于判断时段。':'');
 return <span className="market-session-badge" data-market-phase={state.kind} role="status" aria-label={'市场状态：'+state.label+'，'+state.detail} title={title}><i aria-hidden="true"/><span>{label}</span></span>;
}
