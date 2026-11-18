// A screener changes the observation range, never a trading or theme rule.
export const observationDefaults={mode:'close',board:'all',basis:'current',excludeST:'1',aboveOpen:'any',sealed:'any',sort:'pct',direction:'desc'};
export const observationRanges=[['Pct','涨幅（%）'],['Amount','成交额（亿元）'],['Turnover','换手率（%）'],['VolumeRatio','量比'],['MarketCap','总市值（亿元）'],['Price','价格（元）'],['Pullback','较日内高点回撤（%）']];
export const observationTechnicals=[['aboveMa5','收盘价高于5日均线'],['aboveMa10','收盘价高于10日均线'],['aboveMa20','收盘价高于20日均线'],['crossMa5','当日上穿5日均线'],['crossMa10','当日上穿10日均线'],['crossMa20','当日上穿20日均线'],['ma5Rising','5日均线向上'],['maBull','均线多头排列（5＞10＞20）'],['macdGolden','MACD当日金叉'],['difCrossZero','DIF当日上穿零轴'],['macdRedGrowing','MACD红柱增强']];
export const observationPresets=[
 {id:'low-turn-observe',name:'转强观察（测试）',description:'低位转强：60个完整交易日日线，确认低点抬高、短均线改善，尚未收盘突破；不要求涨停，不是买点',criteria:{mode:'close',structure:'turning'}},
 {id:'low-turn-breakout',name:'突破确认（测试）',description:'低位转强结构后，最近5个交易日内收盘超过区间阻力1%；只确认规则突破，不代表回踩确认或趋势反转',criteria:{mode:'close',structure:'breakout'}},
 {id:'main-limit',name:'主板涨停',description:'主板、排除ST；按来源涨停价核对当前封板',criteria:{board:'main',sealed:'yes'}},
 {id:'main-strong',name:'主板强势 >5%',description:'当前涨幅严格超过5%，不要求封板',criteria:{board:'main',minPct:5}},
 {id:'main-active',name:'主板放量',description:'涨幅超过3%、成交额至少2亿、量比至少2',criteria:{board:'main',minPct:3,minAmount:2,minVolumeRatio:2}},
 {id:'chinext10',name:'创业板 >10%',description:'当前涨幅严格超过10%，不要求封板',criteria:{board:'chinext',minPct:10}},
 {id:'growth15',name:'双创 >15%',description:'创业板和科创板，当前涨幅严格超过15%',criteria:{board:'growth',minPct:15}},
 {id:'pullback10',name:'冲高后回落',description:'日内最高涨幅超过10%，较高点回撤至少3%',criteria:{board:'growth',basis:'peak',minPct:10,minPullback:3}},
 {id:'active',name:'放量活跃',description:'成交额至少2亿元、量比至少2；缺量比单列',criteria:{minAmount:2,minVolumeRatio:2,minPct:0}},
 {id:'down',name:'明显回落',description:'当前跌幅至少5%，不推断后续走势',criteria:{maxPct:-5,sort:'pct',direction:'asc'}}
];
export function cleanObservationCriteria(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('筛选条件格式不正确');
 const out={...observationDefaults},enums={mode:['close','live'],board:['all','main','chinext','star','growth','bse'],basis:['current','peak'],excludeST:['0','1'],aboveOpen:['any','yes','no'],sealed:['any','yes','no'],sort:['pct','peakPct','amount','turnover','volumeRatio','marketCap','price','pullback','code'],direction:['asc','desc']};
 for(const [key,value]of Object.entries(input)){
  if(key==='structure'){if(value==null||value==='')continue;if(!['turning','breakout'].includes(value))throw Error('结构条件无效');out.structure=value;continue;}
  if(key==='technical'){if(value==null||value==='')continue;if(typeof value!=='string'||value.length>200)throw Error('技术指标条件无效');const selected=value.split(',');if(selected.some(k=>!observationTechnicals.some(([id])=>id===k))||new Set(selected).size!==selected.length)throw Error('技术指标条件无效');out.technical=observationTechnicals.filter(([id])=>selected.includes(id)).map(([id])=>id).join(',');continue;}
  if(key in enums){if(!enums[key].includes(String(value)))throw Error('筛选条件无效：'+key);out[key]=String(value);continue;}
  if(key==='groupProvider'||key==='groupCode'){if(value==null)continue;if(typeof value!=='string'||(key==='groupProvider'?!['','sw','ths','dc','sina'].includes(value):!/^[-\w.:~]{0,100}$/.test(value)))throw Error('板块身份无效');if(value)out[key]=value;continue;}
  if(key==='search'){if(typeof value!=='string'||value.length>40||/[<>\x00-\x1f]/.test(value))throw Error('检索文字不正确');out.search=value.trim();continue;}
  const match=/^(min|max)(Pct|Amount|Turnover|VolumeRatio|MarketCap|Price|Pullback)$/.exec(key);
  if(!match)throw Error('不支持的筛选条件：'+key);
  if(value===''||value==null)continue;
  const n=Number(value);if(typeof value==='boolean'||!Number.isFinite(n)||Math.abs(n)>1e9||(match[2]!=='Pct'&&n<0))throw Error('筛选数值不正确：'+key);out[key]=n;
 }
 for(const [key]of observationRanges)if(out['min'+key]!=null&&out['max'+key]!=null&&out['min'+key]>out['max'+key])throw Error('下限不能大于上限');
 if(!!out.groupProvider!==!!out.groupCode)throw Error('请选择完整行业或概念身份');
 if(out.technical&&out.mode!=='close')throw Error('技术指标仅支持盘后收盘，请切换收盘口径或取消技术条件');
 if(out.structure&&out.mode!=='close')throw Error('结构筛选仅支持盘后收盘，请切换收盘口径或取消结构条件');
 return out;
}
