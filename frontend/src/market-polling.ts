import {useEffect,useState} from 'react';
const cnTime=(now:Date)=>new Date(now.getTime()+8*3600000);
export function marketSession(calendar:any,now=new Date()){
 const valid=Number.isFinite(now.getTime()),stamp=valid?cnTime(now).toISOString():'',day=stamp.slice(0,10),hm=stamp.slice(11,16);
 const known=valid&&/^\d{4}-\d{2}-\d{2}$/.test(calendar?.from||'')&&/^\d{4}-\d{2}-\d{2}$/.test(calendar?.through||'')&&day>=calendar.from&&day<=calendar.through&&Array.isArray(calendar.open_days);
 const state=(kind:string,label:string,detail:string)=>({kind,label,detail,day,hm});
 if(!known)return state('unknown','待核验','共享交易日历未覆盖今日，不能确认开市或休市');
 if(!calendar.open_days.includes(day))return state('closed','休市','共享交易日历确认今日非交易日');
 if(hm<'09:15')return state('pre','盘前','开盘前');
 if(hm<'09:30')return state('auction','集合竞价','开盘集合竞价及开盘准备时段');
 if(hm<'11:30')return state('morning','盘中','上午连续竞价');
 if(hm<'13:00')return state('lunch','午间休市','午间休市，13:00恢复连续竞价');
 if(hm<'14:57')return state('afternoon','盘中','下午连续竞价');
 if(hm<'15:00')return state('closing_auction','收盘竞价','收盘集合竞价');
 return state('after','已收盘','当日已收盘');
}
// Initial entry and explicit refresh still read once. This gates timers only.
export function marketReadInterval(cadence:number,calendar?:any,now=new Date(),selectedDay='',hidden=false,online=true):number|false{
 if(hidden||!online||!Number.isFinite(now.getTime()))return false;
 const cn=cnTime(now),stamp=cn.toISOString(),day=stamp.slice(0,10),hm=stamp.slice(11,16);
 if(selectedDay&&selectedDay!==day)return false;
 const days=Array.isArray(calendar?.open_days)?calendar.open_days:[],from=calendar?.from||days[0],through=calendar?.through||days.at(-1),covered=from&&through&&day>=from&&day<=through;
 if(covered?!days.includes(day):[0,6].includes(cn.getUTCDay()))return false;
 return (hm>='09:20'&&hm<'11:31'||hm>='13:00'&&hm<'15:11')?cadence:false;
}
export function nextMarketBoundary(now:Date){
 const cn=cnTime(now),midnight=Date.UTC(cn.getUTCFullYear(),cn.getUTCMonth(),cn.getUTCDate())-8*3600000;
 return [555,560,570,690,691,780,897,900,911,1440].map(minute=>midnight+minute*60000).find(at=>at>now.getTime())!;
}
export function useMarketClock(){
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{let timer:ReturnType<typeof setTimeout>;
  const tick=()=>{clearTimeout(timer);const at=new Date();setNow(at);timer=setTimeout(tick,Math.max(1,nextMarketBoundary(at)-at.getTime()));};tick();
  document.addEventListener('visibilitychange',tick);window.addEventListener('online',tick);window.addEventListener('offline',tick);
  return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',tick);window.removeEventListener('online',tick);window.removeEventListener('offline',tick);};
 },[]);return now;
}
export function useMarketReadInterval(cadence:number,calendar?:any,selectedDay=''){
 return marketReadInterval(cadence,calendar,useMarketClock(),selectedDay,document.hidden,navigator.onLine!==false);
}
