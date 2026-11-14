// Shared snapshot presentation. A valid quote is an observed price, not a prediction.
const GLPrices = (() => {
  // One read on entry/transition obtains the shared final morning snapshot.
  // Subsequent timer ticks are local checks only; 13:00 resumes requests.
  const shouldPoll = (live, calendar, now=new Date()) => {
    if(!live)return true;
    const cn=new Date(now.getTime()+8*3600000).toISOString(),day=cn.slice(0,10),hm=cn.slice(11,16);
    const lunch=calendar && day>=calendar.from && day<=calendar.through && calendar.open_days?.includes(day) && hm>='11:31' && hm<'13:00';
    return !(lunch && live.session?.day===day && live.session?.label==='午间休市');
  };
  const chinaDay = now => new Date(now.getTime() + 8 * 3600000).toISOString().slice(0,10).replaceAll('-','');
  const valid = (q, now, live) => q && Number.isFinite(q.price) && q.price > 0 && /^\d{14}$/.test(q.time || '') && (live?.status==='historical' ? (q.fresh===true||q.closingSnapshot===true)&&q.time.slice(0,8)===String(live.snapshot_day||'').replaceAll('-','') : q.fresh===true&&q.time.slice(0,8)===chinaDay(now));
  const label = (live, q) => {
    const at = `${q.time.slice(0,4)}-${q.time.slice(4,6)}-${q.time.slice(6,8)} ${q.time.slice(8,10)}:${q.time.slice(10,12)}`;
    const phase = live?.session?.label;
    const prefix = live?.status==='historical'?'历史收盘快照':phase === '午间休市' ? '午间快照' : phase === '已收盘' || phase === '休市' ? '收盘快照' : live?.status === 'stale' ? '上次快照' : '盘中快照';
    return `${prefix} ${at}`;
  };
  const fallback = (price, pct, asof) => ({price, pct, label:`${asof} 收盘价`, live:false});
  const stock = (live, code, close, asof, now=new Date()) => {
    const q=live?.quotes?.[code];
    return valid(q,now,live) ? {price:q.price,pct:q.pct,label:label(live,q),live:true} : fallback(close?.price ?? null,close?.chg ?? null,asof);
  };
  const index = (live, close, asof, now=new Date()) => {
    const symbol=(String(close?.code||'').startsWith('399')?'sz':'sh')+close?.code;
    const q=live?.indices?.[symbol];
    return valid(q,now,live) ? {price:q.price,pct:q.pct,label:label(live,q),live:true,amount:q.amount,lastClose:q.lastClose} : fallback(close?.price ?? null,close?.chg_pct ?? null,asof);
  };
  const market = (live, now=new Date()) => {
    const expected=live?.expected;
    if(!Number.isInteger(expected) || expected<=0) return null;
    const values=Object.values(live.quotes||{}).filter(q=>valid(q,now,live) && Number.isFinite(q.pct));
    if(values.length/expected<0.95)return null;
    const buckets={'<-10':0,'-10~-7':0,'-7~-5':0,'-5~-3':0,'-3~0':0,'0':0,'0~3':0,'3~5':0,'5~7':0,'7~10':0,'>10':0};
    let up=0,down=0,flat=0,limit=0,limitRef=0,amountYuan=0,amountRef=0,last=null;
    for(const q of values){
      if(q.pct>0)up++;else if(q.pct<0)down++;else flat++;
      const p=q.pct,b=p<-10?'<-10':p<-7?'-10~-7':p<-5?'-7~-5':p<-3?'-5~-3':p<0?'-3~0':p===0?'0':p<=3?'0~3':p<=5?'3~5':p<=7?'5~7':p<=10?'7~10':'>10';buckets[b]++;
      if(Number.isFinite(q.limitUp) && q.limitUp>0){limitRef++;if(q.price>=q.limitUp-0.000001)limit++;}
      if(Number.isFinite(q.amount) && q.amount>=0){amountRef++;amountYuan+=q.amount;}
      if(!last || q.time>last.time)last=q;
    }
    return {total:values.length,expected,up,down,flat,buckets,limit,limitRef,amountYi:amountRef/expected>=0.95?Math.round(amountYuan/1e6)/100:null,amountRef,label:label(live,last)};
  };
  const limitSummary = (live, pool, now=new Date()) => {
    const codes=new Set((pool?.ladder||[]).map(x=>x.code).filter(Boolean));
    const count=Number.isInteger(pool?.zt)&&pool.zt>=0&&codes.size===pool.zt?pool.zt:null;
    const snapshot=market(live,now);
    const comparable=count!==null&&!!snapshot&&pool.date?.replaceAll('-','')===chinaDay(now);
    const quoteCodes=Object.entries(live?.quotes||{}).filter(([,q])=>valid(q,now,live)&&Number.isFinite(q.pct)&&Number.isFinite(q.limitUp)&&q.limitUp>0&&q.price>=q.limitUp-0.000001).map(([code])=>code);
    const observed=new Set(quoteCodes);
    return {count,date:pool?.date,quoteCount:snapshot?.limit??null,comparable,
      quoteOnly:comparable?quoteCodes.filter(code=>!codes.has(code)):[],
      poolOnly:comparable?[...codes].filter(code=>!observed.has(code)):[]};
  };
  return {stock,index,market,limitSummary,shouldPoll};
})();

export default GLPrices;
