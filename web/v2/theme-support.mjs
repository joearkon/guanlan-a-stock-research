// Discovery candidates, not confirmed leaders or an investment signal.
// The caller supplies already time-validated quotes from its selected source.
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const byCode=(a,b)=>String(a.code).localeCompare(String(b.code));
const byStrength=(a,b)=>b.quote.pct-a.quote.pct||(b.quote.amount||0)-(a.quote.amount||0)||byCode(a,b);
const risk=s=>/^(?:\*?ST|S\*?ST)|退$/.test(s.name||'');
// Display-only name rule, not a provider taxonomy or an industry hierarchy.
// Keep every source group in storage and make these labels accessible separately.
export const conceptDisplayKind=name=>/(?:融资融券|转融券|央企|国企改革|中字头|并购重组|股权转让|参股金融|参股银行|养老金|社保重仓|信托重仓|含H股|HS300|深成500|标准普尔|大盘股|小盘股|中盘股|风格|中报预增|业绩预降|股权激励|低市盈率|破净股|沪股通|深股通|陆股通|样本股|指数成[份分]|上证\d|沪深\d|中证\d|科创\d|创业板指|专精特新|高股息|红利|证金持股|汇金持股|机构重仓|基金重仓|低价股|百元股|次新股|MSCI|富时罗素|标普道琼斯)|^昨日/.test(name||'')?'attribute':'theme';
function riseSeconds(s){
 const t=s.lastRiseTime,q=s.quote?.time;
 if(!/^\d{14}$/.test(t||'')||!/^\d{14}$/.test(q||'')||t.slice(0,8)!==q.slice(0,8)||t>q)return null;
 const h=Number(t.slice(8,10)),m=Number(t.slice(10,12)),sec=Number(t.slice(12,14));
 return h<24&&m<60&&sec<60?h*3600+m*60+sec:null;
}
export function themeSupport(members=[]){
 const unique=[...new Map(members.map(s=>[s.code,s])).values()],quoted=unique.filter(s=>s.quote?.price>0&&finite(s.quote.pct)),eligible=quoted.filter(s=>!risk(s));
 const strong=eligible.filter(s=>s.quote.pct>=3).sort(byStrength),coverageReady=unique.length>0&&quoted.length/unique.length>=.8;
 const liquid=eligible.filter(s=>finite(s.quote.amount)&&s.quote.amount>0).sort((a,b)=>b.quote.amount-a.quote.amount||byCode(a,b));
 const liquidityReady=eligible.length>0&&liquid.length/eligible.length>=.8;
 const liquidLeaders=new Set(liquid.slice(0,Math.max(1,Math.ceil(eligible.length*.2))).map(s=>s.code));
 const cores=liquidityReady?strong.filter(s=>liquidLeaders.has(s.code)).sort((a,b)=>b.quote.amount-a.quote.amount||byCode(a,b)).slice(0,2):[];
 const fronts=strong.slice(0,3),roles=new Map();
 const add=(s,role)=>{if(!roles.has(s.code))roles.set(s.code,{...s,roles:[],reason:[]});const r=roles.get(s.code);r.roles.push(role);r.reason.push(role==='强势前排'?'当日涨幅位于本来源题材强股前列':role==='成交核心候选'?'涨幅≥3%，成交额处于本题材有效样本前20%':'同题材其他涨幅≥3%的强股；不据此断言启动先后');};
 fronts.forEach(s=>add(s,'强势前排'));cores.forEach(s=>add(s,'成交核心候选'));
 const rest=strong.filter(s=>!roles.has(s.code)).sort((a,b)=>Number(riseSeconds(b)!==null)-Number(riseSeconds(a)!==null)||(riseSeconds(b)??-1)-(riseSeconds(a)??-1)||byStrength(a,b));
 rest.slice(0,Math.max(0,10-roles.size)).forEach(s=>add(s,'强势扩散'));
 const representatives=[...roles.values()],followCount=representatives.filter(s=>s.roles.includes('强势扩散')).length;
 const timed=strong.filter(s=>riseSeconds(s)!==null).sort((a,b)=>riseSeconds(a)-riseSeconds(b)||byCode(a,b));let syncCount=0,start=0,syncEvidence=[];
 for(let end=0;end<timed.length;end++){while(riseSeconds(timed[end])-riseSeconds(timed[start])>300)start++;if(end-start+1>syncCount){syncCount=end-start+1;syncEvidence=timed.slice(start,end+1).map(s=>({code:s.code,name:s.name,time:s.lastRiseTime}));}}
 const structural=coverageReady&&strong.length>=8&&cores.length>0&&followCount>=3;
 const tier=!coverageReady?0:structural?(syncCount>=3?3:2):strong.length>=2?1:0;
 return {version:'ladder-v1',tier,label:!coverageReady?'报价覆盖待核验':tier===3?'梯队支撑 · 有同窗异动':tier===2?'快照梯队支撑':tier===1?'局部强势 · 梯队不足':'强势支撑不足',covered:quoted.length,memberCount:unique.length,coverageReady,strongCount:strong.length,frontCount:fronts.length,coreCount:cores.length,followCount,syncCount,syncStartTime:syncEvidence[0]?.time||null,syncEndTime:syncEvidence.at(-1)?.time||null,syncEvidence,liquidityReady,excludedRiskCount:quoted.filter(risk).length,representatives,
  limitations:['前排仅指当日强度，不确认为龙头；成交核心仅为候选，缺多日趋势与流通市值验证','同窗为强股各自最近一条向上事件在5分钟内的可见下界，不证明完整启动顺序或因果','默认不选ST/退市风险名称，未核验新股历史和解禁；成员全表仍保留，候选不是买入建议']};
}
