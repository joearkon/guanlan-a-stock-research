export const FIXED_REPORT_VERSION='fixed-research-v1';
export const fixedTypes=['market-commentary','funds-radar','dragon-score','company-four','industry-value','company-value','topic-value'];
export const valueChapters={
 'company-value':[['business','赚钱业务与产业位置'],['moat','壁垒与竞争'],['profit-pool','产业利润空间'],['company','利润与现金兑现'],['valuation','估值与价格预期'],['watch','反证与持续验证']],
 'industry-value':[['landscape','产业全景与KPI'],['profit-pool','利润池与景气'],['bom','BOM与受益传导'],['competition','竞争与替代'],['company','关联公司与兑现'],['valuation','价格预期'],['watch','反证与持续验证']],
 'topic-value':[['thesis','专题结论'],['support','支持证据'],['counter','相反证据'],['scenarios','情景变化'],['watch','持续验证']]
};
export const calendarDay=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const required={
 'company-four':['profit-pool','company','valuation','watch'],
 'funds-radar':['ranks','changes','tiers','concentration','ledger'],
 'dragon-score':['summary','dimensions','analysis'],
 'market-commentary':['volume','breadth','style','sector','risk'],
 ...Object.fromEntries(Object.entries(valueChapters).map(([key,chapters])=>[key,chapters.map(x=>x[0])]))
};
export function checkFixedReport(r,expected){
 if(!r||r.schemaVersion!==FIXED_REPORT_VERSION||!fixedTypes.includes(r.type)||!['complete','partial','unavailable'].includes(r.status)||typeof r.title!=='string'||typeof r.summary!=='string'||!Array.isArray(r.sections)||!Array.isArray(r.evidence)||!Array.isArray(r.missing)||!Array.isArray(r.risks)||!Array.isArray(r.watch))return '固定报告格式不完整，未按完整研究展示。';
 if(!r.subject||typeof r.subject!=='object'||!['skill','ordinary'].includes(r.mode)||typeof r.deepThinking!=='boolean'||r.sections.length>12||r.evidence.length>120||[r.missing,r.risks,r.watch].some(a=>a.length>30||a.some(x=>typeof x!=='string')))return '固定报告元数据或列表格式未通过校验。';
 if(Object.entries(r.subject).some(([k,v])=>!['code','name','kind','key'].includes(k)||typeof v!=='string'||!v.trim()||v.length>160||/[<>\u0000-\u001f]/.test(v))||r.subject.code&&!/^\d{6}$/.test(r.subject.code)||r.snapshotId!=null&&(typeof r.snapshotId!=='string'||r.snapshotId.length>160))return '报告对象或版本格式未通过校验。';
 if(expected&&(expected.type&&expected.type!==r.type||expected.asof&&expected.asof!==r.asof||expected.stock?.code&&expected.stock.code!==r.subject?.code||expected.subject?.key&&expected.subject.key!==r.subject?.key||expected.snapshotId!=null&&expected.snapshotId!==r.snapshotId))return '报告对象或日期、版本与本轮请求不一致，未展示错配结果。';
 if(!calendarDay(r.asof)||typeof r.generatedAt!=='string'||!calendarDay(r.generatedAt.slice(0,10))||!Number.isFinite(Date.parse(r.generatedAt)))return '报告日期或生成时间未通过校验。';
 if(required[r.type].some(k=>r.sections.filter(s=>s.key===k).length!==1))return '固定报告缺少必填章节，未按完整研究展示。';
 const ids=new Set(r.evidence.map(e=>e.id));
 if(ids.size!==r.evidence.length||r.evidence.some(e=>!e.id||typeof e.text!=='string'||typeof e.source!=='string'))return '报告证据格式未通过校验。';
 if(r.sections.some(s=>typeof s.title!=='string'||typeof s.text!=='string'||!Array.isArray(s.evidenceIds)||s.evidenceIds.some(id=>!ids.has(id))))return '报告章节或引用未通过校验。';
 const scalar=v=>typeof v==='string'||typeof v==='number'&&Number.isFinite(v);
 if(r.sections.some(s=>s.items&&(!Array.isArray(s.items)||s.items.length>60||s.items.some(x=>typeof x!=='string'))||s.metrics&&(!Array.isArray(s.metrics)||s.metrics.length>20||s.metrics.some(m=>!m||typeof m.label!=='string'||!scalar(m.value)))||s.columns&&(!Array.isArray(s.columns)||s.columns.length>12||s.columns.some(x=>typeof x!=='string')||!Array.isArray(s.rows)||s.rows.length>500||s.rows.some(row=>!Array.isArray(row)||row.length!==s.columns.length||row.some(v=>v!=null&&!scalar(v))))))return '报告指标或表格未通过校验。';
 if(r.status==='complete'&&r.missing.length)return '报告仍有数据缺口，不能标记完整。';
 if(r.quarantined&&(!Array.isArray(r.quarantined)||r.quarantined.length>12||r.quarantined.some(x=>typeof x?.text!=='string'||typeof x.reason!=='string')||r.quarantined.length&&r.status==='complete'))return '报告包含未通过核验的原文，不能标记完整。';
 return null;
}
