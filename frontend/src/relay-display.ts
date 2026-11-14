export function relayDisplay(model:any,calendar:any,now:Date,archive=''){
 const today=new Date(now.getTime()+8*3600000).toISOString().slice(0,10),day=/^\d{4}-\d{2}-\d{2}$/.test(model?.day||'')?model.day:'';
 const days=Array.isArray(calendar?.open_days)?calendar.open_days:[],from=calendar?.from||days[0],through=calendar?.through||days.at(-1);
 const covered=!!from&&!!through&&today>=from&&today<=through,closedToday=covered&&!days.includes(today);
 const historical=!!day&&day<today,snapshot=!!archive||historical||!!model?.closed||['stale','historical'].includes(model?.status);
 const label=closedToday?'当前休市':historical||archive?'历史快照':model?.closed?'收盘快照':model?.status==='stale'?'保留快照':'';
 const notice=day&&snapshot?(label+' · 展示 '+day+(model?.closed?' 收盘快照':' 已保存快照')+'，非当前实时。卡片指标和异动记录以各自标注的日期、窗口为准。'+(!covered?' 当前交易日历未覆盖，不推断今日是否开市。':'')):closedToday?'当前休市；榜单日期尚待核验，不将旧数据标为今日。':'';
 return {today,day,snapshot,notice,dayText:(text:string)=>snapshot?text.replaceAll('当日','快照日'):text};
}
