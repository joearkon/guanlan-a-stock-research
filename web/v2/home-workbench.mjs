const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list=x=>Array.isArray(x)?x:[];
const num=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0?x:null;
const day=x=>/^\d{4}-\d{2}-\d{2}$/.test(x||'')?x:'';
export function surveySource(x={}){let sourceUrl=null;try{const u=new URL(x.sourceUrl||x.url);if(u.protocol==='https:'&&!u.username&&!u.password)sourceUrl=u.href;}catch{}return sourceUrl?{sourceUrl,sourceLabel:'查看来源记录'}:/^\d{6}$/.test(x.code||'')?{sourceUrl:'https://data.eastmoney.com/jgdy/gsjsdy/'+x.code+'.html',sourceLabel:'查看该公司调研目录'}:{sourceUrl:null,sourceLabel:null};}
export function surveySummary(x={}){
 const count=typeof x.org_count==='number'&&Number.isFinite(x.org_count)&&x.org_count>=0?x.org_count+'家':'未提供';
 const facts=`调研日期：${day(x.survey_date)||'未提供'}；参与机构：${count}；方式：${x.survey_way||'未提供'}。`;
 const summary=x.reason||x.content||x.summary;
 return facts+(summary?` 来源摘要：${summary}`:' 仅有调研记录，正文未取得。');
}
export function marketOverview(home={},free={}){
 const live=home.market,stats=live||free.ustats||{},lu=free.lu||{};
 return {breadthDate:day(live?home.asof:free.asof),amountDate:day(home.amountAsOf||free.asof),poolDate:day(lu.date),items:[
  ['上涨家数',stats.up,'up'],['下跌家数',stats.down,'down'],['平盘家数',stats.flat,''],['两市成交额',home.amountYi??stats.amount_yi,''],['涨停池',lu.zt,'up'],['跌停池',lu.dt,'down']
 ].map(([label,value,tone])=>({label,value:num(value),tone}))};
}
export function overviewMarkup(m){const context=`广度 ${m.breadthDate||'未覆盖'} · 成交额 ${m.amountDate||'未覆盖'} · 涨跌停池 ${m.poolDate||'未覆盖'}；各项按业务日期，不同统计口径不混用`;return `<section class="hw-overview" aria-label="市场概览：${esc(context)}" title="${esc(context)}" tabindex="0"><div class="hw-metrics">${m.items.map((x,i)=>`<div title="${esc(x.label)} · ${esc((i<3?m.breadthDate:i===3?m.amountDate:m.poolDate)||'未覆盖')}"><span>${x.label}</span><strong class="${x.tone}">${x.value===null?'—':x.value.toLocaleString('zh-CN',{maximumFractionDigits:1})}${i===3&&x.value!==null?'<small> 亿</small>':''}</strong></div>`).join('')}</div></section>`;}
export function personalWorkbench({pool=[],positions=[],member={},today='',filter='all'}={}){
 const active=list(pool).filter(x=>!x.archived),held=new Set(list(positions).map(x=>x.code)),watched=new Set(active.map(x=>x.code));
 const names=new Map([...active,...list(positions)].map(x=>[x.code,x.name||x.code]));
 const tasks=active.flatMap(x=>list(x.tasks).filter(t=>!t.done).map(t=>({...t,code:x.code,kind:x.kind||'stock',name:x.name,overdue:!!day(t.dueDate)&&t.dueDate<today}))).sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
 const allowed=c=>/^\d{6}$/.test(c||'')&&(filter==='holdings'?held.has(c):filter==='watch'?watched.has(c):names.has(c));
 const ev=member.ev||{},events=[];
 for(const [key,dateKey,title] of [['earn','notice_date',x=>`${x.forecast_type||''}业绩预告`],['holder','notice_date',x=>`股东${x.direction||'变动'}披露`],['buyback','latest_notice',x=>`回购进展 ${x.progress||''}`],['survey','notice_date',()=> '机构调研披露']]){
  for(const x of list(ev[key])){const date=day(x[dateKey]);if(!allowed(x.code)||!date||date>today)continue;events.push({code:x.code,name:names.get(x.code),date,title:title(x),detail:key==='survey'?surveySummary(x):x.reason||x.summary||'仅有披露记录，正文或摘要未取得。',...(key==='survey'?surveySource(x):{}),kind:'公告',held:held.has(x.code)});}
 }
 for(const t of tasks){if(allowed(t.code)&&day(t.dueDate)&&t.dueDate<=today)events.push({code:t.code,name:t.name,date:t.dueDate,title:t.text,detail:t.overdue?'复核已到期，请核对记录与证据。':'今日进入复核日期，请核对记录与证据。',kind:'跟踪',held:held.has(t.code)});}
 const unique=[...new Map(events.map(x=>[`${x.kind}/${x.code}/${x.date}/${x.title}`,x])).values()].sort((a,b)=>b.date.localeCompare(a.date));
 return {events:unique,tasks,filter,asof:member.meta?.events?.asof||'',available:!!member.ev};
}
export function workbenchMarkup(m){
 const recordLink='/v2/watchlist';
 return `<div class="hw-grid"><section class="panel hw-events"><div class="panel-heading"><h2>与我相关的事件 <small>(${m.events.length})</small></h2><div class="hw-filters">${[['all','全部'],['holdings','持仓'],['watch','自选']].map(([k,t])=>`<button data-home-event-filter="${k}" aria-pressed="${m.filter===k}">${t}</button>`).join('')}</div><span class="hw-context" title="${esc(m.asof||'发布资料日期见每条记录')} · ${m.available?'已发布事件摘要':'公告资料暂未覆盖'}">仅聚合自选与持仓 · 事件均需核验</span></div><div class="hw-event-list">${m.events.slice(0,6).map(x=>`<article class="hw-event"><span class="hw-tag ${x.kind==='公告'?'hw-tag-announcement':'hw-tag-followup'}">${esc(x.kind)}</span><div class="hw-company" title="${esc(x.name)} ${esc(x.code)} · ${x.held?'持仓':'自选'}"><strong>${esc(x.name)}</strong><small>${esc(x.code)}</small></div><div class="hw-event-body" title="${esc(x.title)}${x.detail?'：'+esc(x.detail):''}"><strong>${esc(x.title)}</strong><p>${esc(x.detail||'已发布资料摘要，详细内容请核验。')}</p></div><time datetime="${esc(x.date)}">${esc(x.date)}</time><a href="${x.kind==='跟踪'?'/v2/watchlist?selected='+encodeURIComponent(x.code):'/v2/stock?code='+x.code+'&tab=evidence&from='+(x.held?'holdings':'watchlist')}">${x.kind==='跟踪'?'继续研究':'查看公告'} →</a></article>`).join('')||'<div class="hw-empty">暂无相关事件<p>当前已发布资料未匹配到相关事件，不代表没有公告。</p></div>'}</div></section><section class="panel hw-tasks"><div class="panel-heading"><h2>研究待办 <small>(${m.tasks.length})</small></h2><a href="${recordLink}">管理 →</a></div>${m.tasks.slice(0,5).map(t=>`<div class="hw-task"><label class="hw-task-check" title="标记完成并同步到账户"><input aria-label="完成：${esc(t.text)}" type="checkbox" data-home-task="${esc(t.id)}" data-home-code="${esc(t.code)}" data-home-kind="${esc(t.kind)}"></label><span class="hw-tag hw-tag-review">待复核</span><div class="hw-task-body" title="${esc(t.text)} · ${esc(t.name||t.code)}${t.dueDate?' · '+esc(t.dueDate):''}"><strong>${esc(t.text)}</strong><small>${esc(t.name||t.code)}${t.dueDate?' · '+esc(t.dueDate):' · 未设置日期'}${t.overdue?' · 已到期':''}</small></div><a href="/v2/watchlist?selected=${encodeURIComponent(t.code)}">继续 →</a></div>`).join('')||'<div class="hw-empty">暂无未完成的复核任务<p>在自选与持仓中记录关注点和复核事项。</p><a href="/v2/watchlist">添加复核事项 →</a></div>'}<div class="hw-task-footer"><a href="${recordLink}" title="进入自选与持仓查看已保存的复核事项">查看全部复核事项 →</a></div></section></div>`;
}
