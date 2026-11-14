const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const shortcuts=[['home','今日研究台','/v2/'],['live','实时动态','/v2/monitor'],['relay','异动接力','/v2/relay'],['auction','竞价盘中','/v2/auction'],['review','每日复盘','/v2/review'],['emotion','情绪复盘','/v2/emotion'],['watchlist','自选与持仓','/v2/watchlist'],['stock','个股深挖','/v2/stock'],['agent','问观澜','/v2/agent']].map(([key,label,href])=>({key,label,href}));
const defaults=['home','live','review','watchlist','agent'];
export function shortcutEntries(keys){return [...new Set(Array.isArray(keys)?keys:defaults)].map(k=>shortcuts.find(x=>x.key===k)).filter(Boolean);}
export function shortcutGroups(keys){const entries=shortcutEntries(keys),map={home:'首页',live:'盯盘',relay:'盯盘',auction:'盯盘',review:'复盘',emotion:'复盘',watchlist:'我的股票',stock:'我的股票',agent:'问观澜'};const groups=[];for(const item of entries){const label=map[item.key];let group=groups.find(x=>x.label===label);if(!group){group={label,items:[]};groups.push(group);}group.items.push(item);}return groups;}
export function quoteTiming(values,marketDay=''){
 const times=[...new Set(values.filter(t=>/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(t)))].sort();
 const detail=!times.length?'暂无有效报价时间':times.length===1?'报价时间 '+times[0]:'报价时间不一致 · '+times[0]+' 至 '+times.at(-1);
 let warning='';
 if(times.length&&times[0].slice(0,10)!==times.at(-1).slice(0,10))warning='含跨交易日报价，请核对';
 else if(times.length&&/^\d{4}-\d{2}-\d{2}$/.test(marketDay)&&times[0].slice(0,10)<marketDay)warning='含历史报价，请核对';
 else if(times.length>1&&Date.parse(times.at(-1).replace(' ','T')+'+08:00')-Date.parse(times[0].replace(' ','T')+'+08:00')>300000)warning='部分报价相差超过 5 分钟';
 return {detail,warning};
}
export function personalSections({pool=[],positions=[],quotes={},marketDay=''}={}){
 const list=(items,mode)=>{
  if(!items.length)return `<div class="hp-empty">${mode==='holdings'?'还没有持仓记录':'还没有自选'} · <a href="/v2/${mode}?editor=add">去添加 →</a></div>`;
  const rows=items.slice(0,10),timing=quoteTiming(rows.map(x=>quotes[x.code]).filter(q=>Number.isFinite(q?.price)&&q.asof&&q.time).map(q=>q.asof+' '+q.time),marketDay);
  return `<div class="hp-list">${timing.warning?`<div class="hp-table-time" role="status" title="${e(timing.detail)}">${e(timing.warning)}</div>`:''}<div class="hp-table-head" title="${e(timing.detail)}"><span>名称</span><span>现价</span><span>涨跌幅</span></div>${rows.map(item=>{
   const q=quotes[item.code],price=Number.isFinite(q?.price)?q.price:null,change=price!==null&&Number.isFinite(q.prev)&&q.prev>0?(price/q.prev-1)*100:null;
   return `<a class="hp-row" title="${e(q?.asof&&q?.time?'报价时间 '+q.asof+' '+q.time:'暂无有效报价时间')}" href="${item.kind&&item.kind!=='stock'?'/v2/watchlist':`/v2/stock?code=${encodeURIComponent(item.code)}&from=${mode}`}"><span><strong>${e(item.name||item.code)}</strong><small>${e(item.code)}${mode==='holdings'&&Number.isFinite(item.shares)?' · '+e(item.shares)+' 股':''}</small></span><span class="hp-price">${price===null?'—':price.toFixed(2)}</span><span class="hp-change ${change>0?'up':change<0?'down':''}">${change===null?'—':(change>0?'+':'')+change.toFixed(2)+'%'}</span></a>`;
  }).join('')}${items.length>10?'<div class="hp-table-time">仅展示前 10 条，可进入管理查看全部</div>':''}</div>`;
 };
 return `<div class="hp-personal"><section class="panel hp-box"><div class="panel-heading"><h2>我的自选 <small>(${pool.length})</small></h2><a href="/v2/watchlist">管理自选 →</a></div>${list(pool,'watchlist')}</section><section class="panel hp-box"><div class="panel-heading"><h2>我的持仓 <small>(${positions.length})</small></h2><a href="/v2/holdings">管理持仓 →</a></div>${list(positions,'holdings')}</section></div>`;
}
