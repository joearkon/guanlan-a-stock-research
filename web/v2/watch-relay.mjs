const GLRelay = (() => {
  function newsCandidates(theme, news, cutoff) {
    const term = String(theme || '').trim();
    if (!term || !Array.isArray(news)) return [];
    return news.filter(item => {
      const time = String(item.time || '');
      return time && time <= cutoff && `${item.title || ''} ${item.content || ''}`.includes(term);
    }).map(item => ({ ...item, status: '关联候选', sourceVerified: false }));
  }
  function boardEvidence(flow, news, kind, code, cutoff) {
    const board = (flow?.groups?.[kind] || []).find(item => item.code === code);
    if (!board) return null;
    const laterNews = (Array.isArray(news) ? news : []).filter(item => String(item.time || '') > cutoff && `${item.title || ''} ${item.content || ''}`.includes(board.name))
      .map(item => ({...item, status: '后续消息', sourceVerified: false}));
    return { board, kind, asof: flow?.meta?.asof || '', coverage: flow?.meta?.status || 'unknown', news: newsCandidates(board.name, news, cutoff), laterNews };
  }
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tabs = [['linkage','热点题材'],['anomaly','异动发现'],['relay','昨日接力']];
  function themes(data, view = 'linkage') {
    let pools = data.pools || [];
    if (view === 'relay') {
      const groups = new Map();
      for (const s of data.ladder || []) for (const name of new Set(String(s.reason || s.ind || '未分类').split(/[+＋]/).map(x=>x.trim()).filter(Boolean))) {
        if (!groups.has(name)) groups.set(name, []);
        groups.get(name).push(s);
      }
      pools = [...groups].map(([name,members])=>({id:name,name,tiers:[{label:'收盘涨停样本',members}]}));
    }
    const live=data.live, day=String((live?.status==='historical'?live?.snapshot_day:live?.session?.day) || '').replaceAll('-','');
    const historical=live?.status==='historical', closed=live?.session?.label==='已收盘';
    const usable=['ok','partial'].includes(live?.status) || live?.status==='paused' && live?.session?.label==='午间休市';
    const events=(usable || closed)?(live.alerts || []).filter(a=>String(a.time || '').replace(/\D/g,'').slice(0,8)===day):[];
    return pools.map(p=>{
      const seen=new Set();
      const members=(p.tiers || []).flatMap(t=>(t.members || []).map(s=>({...s,role:t.label || t.id}))).filter(s=>!seen.has(s.code)&&seen.add(s.code)).map(s=>{
        const q=live?.quotes?.[s.code];
        const stamp=String(q?.time || '');
        const valid=q && Number.isFinite(q.pct) && q.price>0 && (historical ? (q.fresh||q.closingSnapshot)&&stamp.slice(0,8)===day : q.fresh && stamp.slice(0,8)===day && (usable || closed && stamp.slice(8,12)>='1459'));
        return {...s,q:valid?q:null,events:events.filter(a=>a.code===s.code),mine:(data.positions || []).some(x=>x.code===s.code)?'持仓':(data.watchlist || []).some(x=>x.code===s.code)?'自选':''};
      });
      const quotes=members.filter(s=>s.q).map(s=>s.q), values=quotes.map(q=>q.pct).sort((a,b)=>a-b), n=values.length;
      const median=n?(values[Math.floor(n/2)]+values[Math.ceil(n/2)-1])/2:null;
      const strong=values.filter(v=>v>=3).length, up=values.filter(v=>v>0).length;
      const eventCount=members.filter(s=>s.events.length).length;
      const status=n< members.length*.8 || !n?'行情缺项':strong>=2 && up/n>=.6?'多股走强':strong===1?'单股走强':up/n<.4?'偏弱':'分化';
      members.sort((a,b)=>(b.q?.pct ?? -Infinity)-(a.q?.pct ?? -Infinity));
      return {id:p.id || p.name,name:p.name,description:p.description || '',tags:Array.isArray(p.tags)?p.tags:[],score:Number.isFinite(p.score)?p.score:null,members,covered:n,median,up,down:values.filter(v=>v<0).length,strong,eventCount,status,sealed:quotes.filter(q=>q.limitUp>0 && q.price>=q.limitUp-.000001).length,amount:quotes.length && quotes.every(q=>Number.isFinite(q.amount))?quotes.reduce((s,q)=>s+q.amount,0):null};
    }).sort((a,b)=>view==='anomaly'?b.eventCount-a.eventCount || (b.median ?? -999)-(a.median ?? -999):b.strong-a.strong || (b.median ?? -999)-(a.median ?? -999));
  }
  const pct=v=>v==null?'—':`${v>0?'+':''}${v.toFixed(2)}%`;
  const tone=v=>v>0?'up':v<0?'down':'';
  function themePanel(view,data){
    const all=themes(data,view), state=data.state || {}, filter=state.filter || '全部';
    const matches=all.filter(r=>filter==='全部'||filter==='我的关注'&&r.members.some(s=>s.mine)||filter===r.status);
    const rows=matches.slice(0,state.limit || 12);
    const live=data.live, stamp=String(live?.collected_at || '');
    const clock=stamp && Number.isFinite(Date.parse(stamp))?new Date(stamp).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):live?.asof?live.asof+' 收盘':'等待行情';
    const title=view==='relay'?'热点接力':view==='anomaly'?'题材异动雷达':'热点题材';
    const memberTable=r=>`<div class="rq-members"><div class="rq-detail-head"><b>${esc(r.name)} · 成员股</b>${globalThis.GLFollow?.button("theme","relay:"+r.id,r.name)||""}<span>按当前涨幅排序 · 前排/中军/后排为原有分组</span></div><div class="tw"><table class="t"><thead><tr><th>标的 / 分组</th><th>现价</th><th>涨跌幅</th><th>换手率</th><th>成交额(亿)</th><th>盘中事件</th><th>报价时间</th></tr></thead><tbody>${r.members.map(s=>`<tr><td><b>${esc(s.name)}</b>${globalThis.GLFollow?.button("stock",s.code,s.name)||""} ${s.mine?`<em class="rq-tag">${s.mine}</em>`:''}<small>${esc(s.code)} · ${esc(s.role)}</small></td><td class="num">${s.q?s.q.price.toFixed(2):'—'}</td><td class="num ${tone(s.q?.pct)}">${pct(s.q?.pct)}</td><td class="num">${pct(s.q?.turn)}</td><td class="num">${Number.isFinite(s.q?.amount)?(s.q.amount/1e8).toFixed(2):'—'}</td><td>${esc(s.events.length?s.events[s.events.length-1].kind:'—')}</td><td class="num">${s.q?(live?.status==='historical'?'收盘':esc(s.q.time.slice(8,10)+':'+s.q.time.slice(10,12)+':'+s.q.time.slice(12,14))):'待更新'}</td></tr>`).join('')}</tbody></table></div></div>`;
    return `<section class="card rq-panel"><div class="rq-toolbar"><div><h2>${title}</h2><p>${view==='relay'?esc(data.asof)+' 涨停样本 → 今日反馈':'精选题材样本 · 点开题材查看成员'}</p></div><div class="rq-time"><span>${esc(live?.session?.label || '读取行情中')} · ${esc(clock)}</span><button class="btn" data-a="relayRefresh">↻ 刷新</button></div></div>
      <div class="rq-stats"><div><span>覆盖题材</span><b>${all.length}</b></div><div><span>多股走强</span><b class="up">${all.filter(r=>r.status==='多股走强').length}</b></div><div><span>有盘中事件</span><b>${all.filter(r=>r.eventCount>0).length}</b></div><div><span>我的关注</span><b>${all.filter(r=>r.members.some(s=>s.mine)).length}</b></div></div>
      <div class="rq-filters" role="group" aria-label="题材筛选">${['全部','多股走强','单股走强','分化','偏弱','行情缺项','我的关注'].map(f=>`<button data-a="relayFilter" data-v="${f}" aria-pressed="${filter===f}">${f}</button>`).join('')}</div>
      ${live?.status==='stale' && live?.session?.label!=='已收盘'?'<p class="rq-notice">行情更新延迟，暂停联动判断。请稍后刷新。</p>':''}
      <div class="rq-list">${rows.map(r=>`<article class="rq-theme ${state.open===r.id?'is-open':''}"><button class="rq-summary" data-a="relayExpand" data-v="${esc(r.id)}" aria-expanded="${state.open===r.id}"><div class="rq-name"><b>${esc(r.name)}</b><small>${r.members.length} 只 · 行情 ${r.covered}/${r.members.length}${r.members.some(s=>s.mine)?' · 含我的关注':''}</small></div><div class="rq-metric"><span>涨幅中位数</span><b class="num ${tone(r.median)}">${pct(r.median)}</b></div><div class="rq-metric"><span>上涨 / 下跌</span><b><i class="up">${r.up}</i> / <i class="down">${r.down}</i><small> · ${r.sealed} 涨停</small></b></div><div class="rq-metric"><span>${view==='anomaly'?'异动成员':'成交额(亿)'}</span><b class="num">${view==='anomaly'?r.eventCount:r.amount==null?'—':(r.amount/1e8).toFixed(2)}</b></div><div class="rq-verdict"><span class="rq-tag ${r.status==='多股走强'?'up':r.status==='偏弱'?'down':''}">${r.status}</span><small>${state.open===r.id?'收起 ▴':'查看标的 ▾'}</small></div></button>${state.open===r.id?memberTable(r):''}</article>`).join('')||'<p class="muted">此筛选下暂无题材。</p>'}</div>
      ${matches.length>rows.length?`<button class="btn ghost rq-more" data-a="relayMore">再看 12 个题材 · 已展示 ${rows.length}/${matches.length}</button>`:''}
      <details class="rq-rules"><summary>统计口径</summary><p>每分钟读取共享行情；仅使用当日有效报价，收盘后保留当日收盘快照。覆盖不足 80% 不作强弱判断。至少两只涨幅 ≥3% 且上涨占比 ≥60% 记为多股走强，不等于持续扩散。题材允许交叉，同一股在单组内去重；事件数按涉及股票去重，仅覆盖接口保留的事件窗口，不是全日累计。这里是已配置样本，不是完整概念成分股。无同刻历史成交额时不计算放量，未采集启动顺序时不推断谁先启动。</p></details></section>`;
  }
  function render(view, data = {}) {
    if(!tabs.some(([key])=>key===view))view='linkage';
    const baseline=data.baseline;
    if(view==='relay'&&baseline)data={...data,asof:baseline.date,ladder:baseline.ladder};
    const quoteDay=data.live?.session?.day||data.live?.asof||'待更新';
    const stamp=data.live?.collected_at;
    const collected=stamp?new Date(stamp).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未记录';
    const priorNote=view==='relay'?`${data.asof||'样本缺失'} 收盘样本 → ${baseline?.feedbackDate||quoteDay} 行情反馈。昨日指上一个交易日，周末及节假日顺延；缺少样本时不替换成当日涨停股。`:(view==='anomaly'?'异动按行情交易日记录，仅统计已采集的盘中事件窗口，不是全日累计；收盘涨幅不能代替分钟异动。':'热点题材使用已配置成员样本，按行情快照计算联动，不代表完整概念成分股。');
    const timing=`<div class="rq-notice">${esc(priorNote)}<br>行情日期：${esc(quoteDay)} · 最近采集（北京时间）：${esc(collected)} · ${esc(data.live?.session?.label||'收盘快照')}<br>${data.live?.session?.label==='午间休市'?'午间暂停自动刷新，保留最近有效快照；13:00 后自动恢复。':`交易时段约每 ${(globalThis.GLSettings?.refreshMs||60000)/1000} 秒检查共享快照。`}手动刷新仅读取已发布数据，具体报价时间见成员表。</div>`;
    const nav = `<div class="seg" role="group" aria-label="异动与接力视图">${tabs.map(([key,label]) => `<button data-a="relayTab" data-v="${key}" aria-pressed="${view===key}">${label}</button>`).join('')}</div>`;
    const asof = esc(data.asof || '日期未知');
    if (['anomaly','linkage','relay'].includes(view) && data.pools?.length) return nav + timing + themePanel(view,data);
    let body = '';
    if (view === 'anomaly') {
      const historical = data.live?.status === 'historical';
      const alerts = historical ? [] : (data.live?.alerts || []).slice(-30).reverse();
      body = `<section class="card"><h2>异动发现<span>盘中分钟事件</span></h2><p class="muted">急拉、急跌、封板和开板来自已采集行情；不是预测。没有快照时不把日涨幅冒充分钟异动。</p>${historical ? '<p class="muted">历史收盘快照不能还原分钟异动。</p>' : alerts.length ? alerts.map(a => `<div class="ev"><span class="pill">${esc(a.kind)}</span> <b>${esc(a.name)}</b> <span class="muted">${esc(a.time || '时间未知')}</span></div>`).join('') : '<p class="muted">当前尚无符合阈值的已存盘中异动。</p>'}</section>`;
    } else if (view === 'linkage') {
      const boards = (data.industry || []).filter(b => b.agg).sort((a,b) => (b.agg.med || 0) - (a.agg.med || 0)).slice(0, 15);
      body = `<section class="card"><h2>主题联动<span>已覆盖行业 · ${asof} 收盘</span></h2><p class="muted">全市场概念成分股尚未覆盖，不能判定概念板块的前排、中军、后排联动。下表仅为申万行业收盘统计，不是盘中信号。</p>${boards.length ? `<div class="tw"><table class="t"><thead><tr><th>行业</th><th>上涨 / 样本</th><th>中位涨幅</th></tr></thead><tbody>${boards.map(b=>`<tr><td>${esc(b.name)}</td><td>${b.agg.up}/${b.agg.n}</td><td class="num">${b.agg.med > 0 ? '+' : ''}${Number(b.agg.med || 0).toFixed(2)}%</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">行业数据未发布。</p>'}</section>`;
    } else {
      const ladder = (data.ladder || []).filter(x => x.n >= 2).sort((a,b)=>b.n-a.n);
      const live = data.live, quotes = live?.quotes || {};
      const liveDay = String(live?.session?.day || '').replaceAll('-','');
      const prior = liveDay && data.asof && liveDay > data.asof.replaceAll('-','');
      body = `<section class="card"><h2>昨日接力<span>${asof} 收盘梯队 · ${prior ? '今日反馈' : '非实时'}</span></h2><p class="muted">${prior ? '梯队名单取上个已发布收盘日；报价仅显示同一交易日且有效的快照。' : '尚无次交易日有效盘中反馈；这里仅展示已发布收盘梯队，不判断晋级。'}</p>${ladder.length ? `<div class="tw"><table class="t"><thead><tr><th>昨日板位</th><th>标的</th><th>今日反馈</th></tr></thead><tbody>${ladder.map(x=>{const q=quotes[x.code],valid=prior && q?.fresh && String(q.time || '').slice(0,8)===liveDay;return `<tr><td>${x.n} 板</td><td>${esc(x.name)} <small class="muted">${esc(x.code)}</small></td><td class="num">${valid ? `${q.pct > 0 ? '+' : ''}${Number(q.pct).toFixed(2)}% · ${esc(q.time.slice(8,12))}` : '—'}</td></tr>`;}).join('')}</tbody></table></div>` : '<p class="muted">该收盘日无连板梯队。</p>'}</section>`;
    }
    return nav + timing + body;
  }
  return { newsCandidates, boardEvidence, themes, render };
})();

export default GLRelay;
