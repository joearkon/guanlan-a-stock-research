import Prices from './price-policy.mjs';
// Same equal-weight basket convention as engine/sw.py; never use tier examples as membership.
export function liveIndustries(f,live,membership={},now=new Date()){
 return (f.sw?.boards||[]).map(board=>{
  const codes=[...new Set(board.members||membership.boards?.[board.code]||[])].filter(c=>f.uni?.[c]);
  const rows=codes.map(code=>{const q=live?.quotes?.[code],v=Prices.stock(live,code,null,f.asof,now);return v.live&&Number.isFinite(v.pct)?{code,pct:v.pct,time:q.time,label:v.label}:null;}).filter(Boolean);
  const coverage={received:rows.length,expected:codes.length||board.agg?.n||0};
  if(!codes.length||codes.length<(board.agg?.n||codes.length)*.95||rows.length/codes.length<.95)return {...board,live:false,asof:f.meta?.sw?.asof||f.asof,coverage,label:`${f.meta?.sw?.asof||f.asof} 收盘篮子 · 实时报价覆盖不足 ${coverage.received}/${coverage.expected}`};
  const sorted=rows.slice().sort((a,b)=>a.pct-b.pct),n=rows.length,avg=Math.round(rows.reduce((sum,r)=>sum+r.pct,0)/n*100)/100,last=rows.reduce((a,b)=>a.time>b.time?a:b),asof=last.time.slice(0,4)+'-'+last.time.slice(4,6)+'-'+last.time.slice(6,8);
  return {...board,live:true,asof,time:last.time.slice(8,10)+':'+last.time.slice(10,12),coverage,chg:avg,label:`${last.label} · 行业篮子等权 · 覆盖 ${n}/${codes.length}`,agg:{n,up:rows.filter(r=>r.pct>0).length,down:rows.filter(r=>r.pct<0).length,flat:rows.filter(r=>r.pct===0).length,avg,med:(sorted[Math.floor((n-1)/2)].pct+sorted[Math.floor(n/2)].pct)/2,best:[sorted.at(-1).code,sorted.at(-1).pct],worst:[sorted[0].code,sorted[0].pct]}};
 }).sort((a,b)=>Number(b.live)-Number(a.live)||(b.chg??-Infinity)-(a.chg??-Infinity));
}
export function applyIndustries(home,f,live,membership){
 const sectors=liveIndustries(f,live,membership),fresh=sectors.filter(s=>s.live),top=fresh[0]||sectors[0];home.sectors=sectors;
 home.sources.sectors={...(f.meta?.sw||{}),asof:fresh[0]?.asof||f.meta?.sw?.asof||f.asof,source:fresh.length?'申万完整成分 + 腾讯共享行情 · 成分股等权均涨幅':'申万行业收盘篮子',live:fresh.length>0,time:fresh.map(s=>s.time).sort().at(-1),partial:fresh.length>0&&fresh.length<sectors.length};
 if(top){const signal={title:top.name+(top.chg>0?'领涨行业，关注内部强弱分化':'相对较强，关注内部强弱分化'),summary:`行业篮子均涨幅 ${top.chg}%，上涨 ${top.agg?.up??'—'} 家，下跌 ${top.agg?.down??'—'} 家。`,evidence:top.label,tag:'数据',kind:'sector',payload:top},index=home.signals.findIndex(s=>s.kind==='sector');if(index>=0)home.signals[index]=signal;else home.signals.unshift(signal);}
 return home;
}
