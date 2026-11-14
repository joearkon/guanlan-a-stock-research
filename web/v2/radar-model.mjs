// Read-only, deterministic projection of the site's existing event datasets.
import {outerEvidence} from './outer-evidence.mjs';
const day=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''))?s:null;
const finite=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
const present=v=>v!=null&&String(v).trim()!=='';
const shift=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
const safeUrl=u=>{try{const x=new URL(u);return x.protocol==='https:'?x.href:null;}catch{return null;}};
const unique=rows=>[...new Map(rows.map(r=>[r.id,r])).values()];
const RULES={
 '宏观数据':{chain:'实际值与预期差 → 利率 / 汇率 → 风险偏好',verify:'核对正式实际值、修订值及利率汇率的持续响应。',counter:'数据未公布或跨市场时间未对齐，不能认定传导。'},
 '宏观事件':{chain:'公开日程 → 正式发布 → 执行条件',verify:'核对发布机关、正式文件及时间变更。',counter:'仅有日历线索时，不等于政策已经落地。'},
 '财报披露':{chain:'业绩预告 → 正式报告 → 收入与现金流兑现',verify:'比较同口径收入、扣非利润、经营现金流；预告不等于实际业绩。',counter:'增长与现金流背离、扣非不匹配时，重新核验盈利质量。'},
 '股东变动':{chain:'公告计划 → 实际变动 → 持股结构',verify:'核对计划与实际执行、起止日期、股份数量与比例。',counter:'计划不等于完成，不直接推导股价方向。'},
 '股份回购':{chain:'回购方案 → 实施进度 → 实际支出',verify:'核对已回购金额、价格上限、期限与进度公告。',counter:'方案金额上限不是已经投入的资金。'},
 '新股日程':{chain:'发行安排 → 申购 / 上市 → 实际供给',verify:'以发行人和交易所正式披露核对申购、上市时间。',counter:'未明确上市日时，不用申购日代替。'},
 '机构调研':{chain:'公开调研记录 → 经营披露 → 后续验证',verify:'核对调研原文、参与机构和经营指标。',counter:'调研家数和热度不等于机构买入或订单兑现。'},
 '政策线索':{chain:'媒体报道 → 正式文件 → 细则 / 预算 → 执行',verify:'核对发文机关、适用范围、生效日及预算。',counter:'未找到正式文件，不写成已落地政策或受益公司。'},
 '产品 / 行业线索':{chain:'公开报道 → 产品 / 议程验证 → 商业化兑现',verify:'核对原文、参数、参与主体、客户采用或订单。',counter:'会议热度、新品预告不等于公司订单和收入。'}
};
export function radarModel(f={},m={}){
 const asof=day(f.asof);if(!asof)throw Error('雷达缺少有效业务日期');
 const through=shift(asof,6),from=shift(asof,-14),calendarMeta=m.meta?.calendar||{},eventMeta=m.meta?.events||{},outerMeta=m.meta?.outer||{};
 const rules=e=>({...e,...RULES[e.type]});
 const macro=unique((m.cal||[]).flatMap(r=>{
  const d=day(String(r.time||'').slice(0,10));if(!d||d<asof||d>through||!r.title||!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(r.time))return [];
  const actual=d>asof?null:present(r.actual)?String(r.actual):null;
  return [rules({id:'macro:'+String(r.id??r.time+':'+r.title),title:String(r.title),time:r.time.slice(0,16),date:d,country:String(r.country||'未提供'),importance:finite(r.importance),type:r.kind==='data'?'宏观数据':'宏观事件',actual,forecast:present(r.forecast)?String(r.forecast):null,previous:present(r.previous)?String(r.previous):null,unit:String(r.unit||''),status:actual!=null?'已公布':'待公布',evidence:'公开日历 · 待正式来源核验',source:calendarMeta.source||'站内宏观日历',sourceUrl:safeUrl(calendarMeta.source_url),fetchedAt:calendarMeta.fetched_at||null,code:null,name:null,summary:actual!=null?`实际${actual}${r.unit||''}；预期${r.forecast??'未提供'}；前值${r.previous??'未提供'}`:'计划时间与实际发布时间分开；未公布结果不补写。'})];
 })).sort((a,b)=>a.time.localeCompare(b.time));
 const catalysts=[],ev=m.ev||{};
 function add(key,type,r,date,summary,status='已披露'){
  if(!day(date)||date>asof||date<from||!/^\d{6}$/.test(r.code||''))return;
  const sm=eventMeta.section_meta?.[key]||eventMeta;
  catalysts.push(rules({id:`${key}:${r.code}:${date}:${r.start_date||r.survey_date||r.plan_end||r.holder||''}`,title:`${r.name||r.code} · ${type}`,type,code:r.code,name:r.name||r.code,date,time:date,country:'中国',importance:null,status,evidence:'公告摘要',source:sm.source||eventMeta.source||'站内公开事件',sourceUrl:null,fetchedAt:sm.fetched_at||null,summary}));
 }
 for(const r of ev.earn||[])add('earn','财报披露',r,r.notice_date,`${r.forecast_type||'业绩预告'}；报告期${ev.period||'未提供'}；变动区间${r.change_pct_lower??'未提供'}%～${r.change_pct_upper??'未提供'}%。${r.reason||''}`);
 for(const r of ev.holder||[])add('holder','股东变动',r,r.notice_date,`${r.holder||'股东'} ${r.direction||'变动'}；${r.start_date||'时间待确认'}至${r.end_date||'时间待确认'}；变动${r.change_shares_10k??'未提供'}万股。`);
 for(const r of ev.buyback||[])add('buyback','股份回购',r,r.latest_notice,`进度${r.progress||'未提供'}；截止${r.plan_end||'未确认'}；已回购${r.done_amount==null?'未提供':(r.done_amount/1e4).toFixed(2)+'万元'}；价格上限${r.price_cap??'未提供'}元。`);
 for(const r of ev.survey||[])add('survey','机构调研',r,r.notice_date,`调研日期${r.survey_date||'未提供'}；参与机构${r.org_count??'未提供'}家；${r.survey_way||'形式未提供'}。`);
 for(const r of ev.ipo||[]){const date=day(r.apply_date);if(!date||date<asof||date>shift(asof,13))continue;const sm=eventMeta.section_meta?.ipo||eventMeta;catalysts.push(rules({id:'ipo:'+r.code+':'+date,title:`${r.name||r.code} · 新股申购`,type:'新股日程',code:r.code,name:r.name||r.code,date,time:date,country:'中国',importance:null,status:'计划日程',evidence:'发行日程 · 待官方复核',source:sm.source||'站内发行日历',sourceUrl:null,fetchedAt:sm.fetched_at||null,summary:`申购${date}；上市${r.listing_date||'未明确'}；发行价${r.issue_price??'未提供'}元。` }));}
 for(const r of ev.news||[]){const date=day(String(r.time||'').slice(0,10));if(!date||date>asof||date<from||!r.title)continue;const content=String(r.title)+' '+String(r.content||'');const type=/政策|国务院|财政部|发改委|央行|监管|关税/.test(content)?'政策线索':/新品|发布|投产|会议|大会|订单|供应|销量|业绩/.test(content)?'产品 / 行业线索':null;if(!type)continue;catalysts.push(rules({id:'news:'+String(r.id||r.time+':'+r.title),title:String(r.title),summary:String(r.content||r.title),type,date,time:String(r.time),country:'未提供',importance:null,status:'待核验',evidence:'媒体报道',source:r.source||'站内快讯',sourceUrl:safeUrl(r.source_url),fetchedAt:eventMeta.section_meta?.news?.fetched_at||eventMeta.fetched_at||null,code:null,name:null}));}
 const ordered=unique(catalysts).sort((a,b)=>b.time.localeCompare(a.time));
 const outer=outerEvidence(m.outer,outerMeta,asof);
 const transmission=[['科技 / 半导体','海外科技指数 → 需求、估值与风险偏好','公司产品价格、订单及收入敞口','国内相关板块量价与正式披露','外围回落或国内未响应'],['出口 / 汇率','美元与人民币 → 汇兑与外需','出口占比、结算币种及套保安排','公司毛利和订单变化','套保抵消或缺少业务敞口'],['资源 / 成本','原油、金属 → 产品价格及成本','同口径商品价格与供需持续性','产品售价、毛利及量价确认','价格回落或成本无法传导']].map(([name,signal,first,confirm,counter])=>({name,signal,first,confirm,counter,status:outer.some(x=>!x.stale)?'待业务与A股验证':'报价待更新 · 不作当日传导判断'}));
 const observations=[...macro.filter(x=>x.status==='待公布').slice(0,3),...ordered.filter(x=>x.type!=='新股日程').slice(0,3)].map(r=>({id:r.id,title:r.title,window:r.status==='待公布'?r.time:'正式原文 / 下一次披露',verify:r.verify,status:r.evidence}));
 const sources=[{key:'宏观日历',...calendarMeta},{key:'催化事件',...eventMeta},{key:'外围报价',...outerMeta}].map(r=>({key:r.key,source:r.source||'尚未接入',asof:r.asof||null,fetchedAt:r.fetched_at||null,status:r.status||'未覆盖',note:r.note||null}));
 const gaps=[];if(!macro.length)gaps.push('所选日期未来7天宏观日程未覆盖');if(!ordered.length)gaps.push('近期催化事件未覆盖');if(!outer.length)gaps.push('外围报价未覆盖');else if(outer.some(x=>x.stale))gaps.push('部分外围报价过旧，不用于当日传导判断');gaps.push('媒体线索不等于正式文件；公告摘要不等于已核验原文；主营与订单关联尚需逐股证据');
 return {asof,through,macro,catalysts:ordered,outer,transmission,observations,sources,gaps,countries:[...new Set([...macro,...ordered].map(x=>x.country))].sort(),coverage:{calendar:macro.length,events:ordered.length,outer:outer.length,partial:eventMeta.partial===true,window:'宏观未来7天；公司披露回看14天；新股计划未来14天'}};
}
export function filterRadar(m,filters={},profile={}){
 const watch=new Set((profile.pool||[]).filter(r=>r.kind==='stock'||r.kind==='security'||!r.kind).map(r=>r.code)),holdings=new Set((profile.positions||[]).filter(r=>r.shares>0).map(r=>r.code));
 const match=r=>(!filters.country||r.country===filters.country)&&(!filters.importance||(r.importance||0)>=Number(filters.importance))&&(!filters.status||r.status===filters.status)&&(!filters.scope||filters.scope==='all'||(filters.scope==='watch'?watch:holdings).has(r.code))&&(!filters.query||[r.title,r.summary,r.name,r.code].join(' ').toLowerCase().includes(filters.query.toLowerCase()));
 const decorate=r=>({...r,watch:watch.has(r.code),held:holdings.has(r.code)}),macro=m.macro.filter(match).map(decorate),catalysts=m.catalysts.filter(r=>match(r)&&(!filters.type||r.type===filters.type)).map(decorate);
 return {macro,catalysts,counts:{upcoming:m.macro.filter(r=>r.status==='待公布').length,high:m.macro.filter(r=>r.importance>=3).length,watch:m.catalysts.filter(r=>watch.has(r.code)).length,holdings:m.catalysts.filter(r=>holdings.has(r.code)).length},total:macro.length+catalysts.length};
}
export function radarQuestion(m,question='',eventId){
 const picked=eventId?[...m.macro,...m.catalysts].find(r=>r.id===eventId):null;
 const rows=picked?[picked]:[...m.macro.filter(r=>r.importance>=3).slice(0,2),...m.catalysts.slice(0,2)];
 const draft=String(question).trim().slice(0,100);
 const body=`雷达观测业务日${m.asof}。事件与计划时间不能混用。${rows.map(r=>`${r.time} ${r.title.slice(0,48)}[${r.evidence}]：${r.summary.slice(0,65)}`).join('；')}。外围${m.outer.filter(r=>!r.stale).length}/${m.outer.length}项在四个自然日内，仅为时效筛选，不证明传导；各自报价时区独立。请区分事实、规则关联和推断，核对正式原文，分析影响、反证和后续验证条件，不把媒体或行业标签当订单、收入。`;
 return body.slice(0,499-draft.length)+'\n'+draft;
}
