(function(root){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function renderModeA(lines){
    const head=lines[0]?.match(/^【题材擒龙九维评分｜模式A】(.+?)\((\d{6})\)\s+(\d{4}-\d{2}-\d{2})$/);
    if(!head)return null;
    const total=lines.find(x=>x.startsWith('综合分 '));
    const match=total?.match(/^综合分\s+([\d.]+)\/100\s+——\s+(.+)$/);
    const partial=lines.find(x=>x.startsWith('参考分 '))?.match(/^参考分\s+([\d.]+)\/100（已评分权重\s+(\d+)\/100；非完整九维评级）$/);
    const status=match?`<div class="dragon-score"><strong>${esc(match[1])}</strong><span>/ 100</span><small>${esc(match[2])}</small></div>`:
      partial?`<div class="dragon-score dragon-score-pending"><strong>${esc(partial[1])}</strong><span>/ 100</span><small>参考分 · 覆盖 ${esc(partial[2])}/100</small></div>`:
      `<div class="dragon-score dragon-score-pending"><strong>—</strong><span>未出分</span></div>`;
    const notice=match?'九维加权结果':partial?'非完整九维评级':lines.find(x=>/评分服务未返回|评分结果格式异常|总分待补证/.test(x))||'评分尚未生成';
    const comments=new Map(lines.map(x=>x.match(/^模型点评([①②③④⑤⑥⑦⑧⑨])：(.+)$/)).filter(Boolean).map(x=>[x[1],x[2]]));
    const dimensions=lines.map(line=>{
      const m=line.match(/^([①②③④⑤⑥⑦⑧⑨])\s+(.+?)\s+(待补证|未评分|\d+分)｜权重(\d+)｜([\s\S]+?)【(.+?)；(.+?)】$/);
      if(!m)return null;
      const score=/^\d+分$/.test(m[3])?Number(m[3].slice(0,-1)):null;
      return `<article class="dragon-dimension"><div class="dragon-dimension-top"><span class="dragon-num">${m[1]}</span><strong>${esc(m[2])}</strong><em>权重 ${esc(m[4])}%</em><b class="${score==null?'dragon-unscored':''}">${score==null?esc(m[3]):score+' 分'}</b></div>`+
        `<div class="dragon-meter" aria-hidden="true"><span style="width:${score==null?0:Math.max(0,Math.min(100,score))}%"></span></div>`+
        `${score==null&&!comments.has(m[1])?`<p class="dragon-missing">${esc(m[3]==='未评分'?'数据已取得，模型本轮未完成评分；可展开查看依据。':m[5].length<=80?m[5]:'已有线索尚不足以评分，具体证据见下方。')}</p>`:''}`+
        `${comments.has(m[1])?`<p class="dragon-commentary">${esc(comments.get(m[1]))}</p>`:''}`+
        `<details><summary>查看依据与来源</summary><p>${esc(m[5])}</p><small>${esc(m[6])} · ${esc(m[7])}</small></details></article>`;
    }).filter(Boolean);
    if(!dimensions.length)return null;
    const warning=lines.find(x=>x.startsWith('⚠️'));
    const researchStatus=lines.find(x=>x.startsWith('研判状态：'));
    const today=new Date(Date.now()+8*3600000).toISOString().slice(0,10);
    const storedWarning=lines.find(x=>x.startsWith('时效提示：'));
    const freshnessWarning=head[3]<today
      ?`时效提示：历史收盘 ${head[3]}，不是今日实时行情；这是一份历史报告。${storedWarning?.slice(5)||''}`
      :storedWarning;
    let times;try{times=JSON.parse(lines.find(x=>x.startsWith('研究时间：'))?.slice(5)||'null');}catch{}
    const fmtTime=t=>Number.isFinite(t)?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(t):'未提供';
    const timeCard=times?`<details class="dragon-times"><summary>行情截止 ${esc(times.marketAsOf)}（收盘，非实时） · 报告完成 ${esc(fmtTime(times.generatedAt))}</summary><dl>${[
      ['事件检索截至',times.evidenceThrough],['最近来源发布',times.latestPublishedAt||'未提供'],
      ['证据采集（最近成功）',fmtTime(times.collectedAt)],['报告完成',fmtTime(times.generatedAt)],['本次检查',fmtTime(times.checkedAt)]
    ].map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p>均为北京时间。检查时间不代表数据更新；各源采集时间可能不同。</p>${(times.sources||[]).map(s=>`<p>${esc(s.label)} · ${esc(({ok:'有效',stale:'刷新失败，保留旧证据',failed:'获取失败',pending:'刷新中',unavailable:'未接入/未取得',partial:'部分数据'})[s.status]||s.status)} · 采集 ${esc(fmtTime(s.fetchedAt))}</p>`).join('')}</details>`:'';
    const conclusion=lines.find(x=>x.startsWith('一句话结论：'));
    const judgment=lines.find(x=>x.startsWith('核心判断：'));
    let narrative='',stats=null;
    try{const value=JSON.parse(lines.find(x=>x.startsWith('综合研判正文：'))?.slice(7)||'null');if(typeof value==='string')narrative=value;}catch{}
    try{stats=JSON.parse(lines.find(x=>x.startsWith('执行统计：'))?.slice(5)||'null');}catch{}
    const narrativeHtml=esc(narrative).replace(/^#{1,4}\s+(.+)$/gm,'<strong>$1</strong>').replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>');
    const diagnostic=narrative?`<section class="dragon-analysis dragon-narrative"><h4>独立综合研判</h4><div>${narrativeHtml}</div></section>`:'';
    const execution=stats?`<details class="dragon-times"><summary>${stats.cacheHit?'复用同证据报告，本次模型调用 0 次':'本次模型调用 '+esc(stats.modelCalls)+' 次'} · ${Number.isFinite(stats.tokens)?Number(stats.tokens).toLocaleString('en-US'):'未知'} Token</summary><p>${stats.cacheHit?'原报告':'本轮评分与研判'}耗时 ${Number.isFinite(stats.elapsedMs)?(stats.elapsedMs/1000).toFixed(1):'未知'} 秒 · ${esc(stats.workflow)}</p><p>${esc(stats.scope||'评分与研判模型用量；搜索用量另列')}</p></details>`:'';
    const sections=['支撑证据','主要风险','后续验证','前文对照'].map(label=>{
      const rows=lines.filter(x=>x.startsWith(label+'：')).map(x=>x.slice(label.length+1));
      return rows.length?`<section class="dragon-analysis"><h4>${label}</h4><ul>${rows.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:'';
    }).join('');
    let events=[];try{events=JSON.parse(lines.find(x=>x.startsWith('事件证据：'))?.slice(5)||'[]');}catch{/* old reports */}
    const eventCards=(Array.isArray(events)?events:[]).slice(0,10).map(e=>{
      let url;try{url=new URL(e.url);}catch{return '';}
      if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return '';
      const collected=Number.isFinite(e.collectedAt)?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(e.collectedAt):'未记录';
      return `<details class="research-event"><summary><span class="event-tag">${esc(e.id)} · ${e.kind==='cross'?'交叉研究':'公司补证'}</span><strong>${esc(e.title)}</strong><small>发布 ${esc(e.publishedAt||'日期未提供')} · 搜索摘要 / 待核验全文</small></summary><p>${esc(e.summary)}</p><div><a href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">查看原文 ↗ ${esc(url.hostname)}</a><small>采集 ${esc(collected)}（北京时间）</small></div></details>`;
    }).join('');
    return `<section class="dragon-report" aria-label="${esc(head[1])}擒龙九维报告"><div class="dragon-report-head"><div><div class="dragon-kicker">擒龙九维 · 个股诊断</div><h3>${esc(head[1])}<small>${esc(head[2])}</small></h3><p>${esc(head[3])} 收盘数据 · ${esc(notice)}</p></div>${status}</div>`+
      `${researchStatus?`<p class="dragon-warning">${esc(researchStatus.slice(5))}</p>`:''}${freshnessWarning?`<p class="dragon-warning">${esc(freshnessWarning.slice(5))}</p>`:''}${timeCard}${conclusion?`<p class="dragon-conclusion">${esc(conclusion)}</p>`:''}${warning?`<p class="dragon-warning">${esc(warning)}</p>`:''}<div class="dragon-dimensions">${dimensions.join('')}</div>${judgment?`<section class="dragon-judgment"><strong>模型解读</strong><p>${esc(judgment.slice(5))}</p></section>`:''}`+
      `${diagnostic}${sections}${execution}${eventCards?`<section class="research-events"><h4>事件与交叉研究证据</h4><p>不同链接可能报道同一事件，不代表相互独立的证实。</p>${eventCards}</section>`:''}<footer>按原九维权重评分；未核实的维度不补分。仅供研究参考，不构成投资建议。</footer></section>`;
  }

  const TIER_CLASS={
    '龙头':'dragon-tier-leader','候选龙头':'dragon-tier-leader','伪龙':'dragon-tier-pseudo',
    '中军':'dragon-tier-mid','跟风':'dragon-tier-follow','待观察':'dragon-tier-watch'
  };
  function parseServiceTier(line){
    const m=line.match(/^(🥇|🥈|🐑|⚠️|🔥)\s+(\S+)\s+(.+?)\((\d{6})\)\s+三维快评\s+(\d+)｜资金(\d+)\s+龙头(\d+)\s+趋势(\d+)｜(.+)$/);
    if(!m)return null;
    return {icon:m[1],tier:m[2],name:m[3],code:m[4],quick:m[5],capital:m[6],leader:m[7],trend:m[8],flow:m[9]};
  }
  function parseSharedRow(line){
    const m=line.match(/^(\d{6})\s+(.+?)：(.+)$/);
    if(!m)return null;
    return {icon:'📌',tier:'候选',name:m[2],code:m[1],detail:m[3]};
  }
  function renderModeBC(lines){
    const headLine=lines[0]||'';
    let mode=null,title='',subtitle='',kicker='';
    let m;
    if((m=headLine.match(/^【题材龙头梯队｜模式B】(.+?)\s+(\d{4}-\d{2}-\d{2})$/))){
      mode='B';title=m[1];subtitle=m[2]+' 题材梯队';kicker='擒龙九维 · 题材梯队';
    }else if((m=headLine.match(/^【今日擒龙候选榜｜模式C】(\d{4}-\d{2}-\d{2})$/))){
      mode='C';title='今日擒龙候选';subtitle=m[1]+' 热点候选';kicker='擒龙九维 · 今日候选';
    }else if((m=headLine.match(/^【题材擒龙九维｜模式([BC])\s+(.+?)】行情日期\s+(.+)$/))){
      mode=m[1];title=m[2];subtitle='行情日期 '+m[3];kicker=mode==='B'?'擒龙九维 · 题材梯队':'擒龙九维 · 今日候选';
    }else if((m=headLine.match(/^【擒龙九维｜模式([BC])】(.+)$/))){
      mode=m[1];title=mode==='B'?'题材梯队':'今日候选';subtitle=m[2];kicker='擒龙九维 · 模式'+mode;
    }else return null;
    const meta=[];
    const rows=[];
    let candidateSection=true;
    for(const line of lines.slice(1)){
      const theme=line.match(/^研究题材：(.+?)。/);
      if(mode==='B'&&theme)title=theme[1]+' · 题材梯队';
      if(/^九维深研 |^【.+整体与梯队综合研判/.test(line))candidateSection=false;
      if(!candidateSection){meta.push(line);continue;}
      const tier=parseServiceTier(line);
      if(tier){rows.push(tier);continue;}
      const shared=parseSharedRow(line);
      if(shared){rows.push(shared);continue;}
      if(/^(候选仅来自|不构成投资建议|覆盖：|耗时 |范围：|当日高频归因：|未列入榜：)/.test(line) || line.startsWith('【榜首九维精评】')){
        meta.push(line);continue;
      }
      meta.push(line);
    }
    if(!rows.length && !meta.length)return null;
    const listClass=mode==='B'?'dragon-tiers':'dragon-candidates';
    const reportClass=mode==='B'?'dragon-report dragon-ladder':'dragon-report dragon-candidates-report';
    const cards=rows.map((row,i)=>{
      const tierClass=TIER_CLASS[row.tier]||(mode==='C'?'dragon-tier-candidate':'dragon-tier-watch');
      const itemClass=mode==='B'?`dragon-tier ${tierClass}`:`dragon-candidate ${tierClass}`;
      const scores=row.quick!=null
        ?`<div class="dragon-tier-scores"><span>三维 ${esc(row.quick)}</span><span>资金 ${esc(row.capital)}</span><span>龙头 ${esc(row.leader)}</span><span>趋势 ${esc(row.trend)}</span></div>`
        :`<p class="dragon-tier-detail">${esc(row.detail||'')}</p>`;
      const flow=row.flow?`<small class="dragon-tier-flow">${esc(row.flow)}</small>`:'';
      return `<article class="${itemClass}"><div class="dragon-tier-top"><span class="dragon-tier-icon" aria-hidden="true">${row.icon}</span><strong>${esc(row.tier)}</strong><b>${esc(row.name)}<small>${esc(row.code)}</small></b></div>${scores}${flow}</article>`;
    }).join('');
    const metaHtml=meta.map(x=>`<p class="dragon-ladder-note">${esc(x)}</p>`).join('');
    return `<section class="${reportClass}" aria-label="${esc(title)}擒龙${mode==='B'?'梯队':'候选'}报告"><div class="dragon-report-head"><div><div class="dragon-kicker">${esc(kicker)}</div><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div><div class="dragon-score"><strong>${rows.length||'—'}</strong><span>${mode==='B'?'档':'只'}</span><small>模式${mode}</small></div></div><div class="${listClass}">${cards}</div>${metaHtml}<footer>候选仅作研究分层展示；不构成投资建议。</footer></section>`;
  }
  function render(answer){
    const lines=String(answer||'').split('\n').map(x=>x.trim()).filter(Boolean);
    return renderModeA(lines)||renderModeBC(lines)||null;
  }
  root.GLDragonCard={render};
})(typeof window !== 'undefined' ? window : globalThis);
