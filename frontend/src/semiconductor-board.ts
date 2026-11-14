import {semiconductorLayers,publishedIndustryFacts} from './semiconductor-directory';
import {semiconductorCompanies} from './semiconductor-companies';
import {safeSource} from './urls';
import {semiconductorResearch} from './semiconductor-company-research';
export type IndustryMetric={id:string;label:string;value:string|number;unit?:string;period:string;published?:string;checkedAt?:string;dateBasis?:string;source:string;url:string;scope?:string;kind?:string;origin?:string;status?:string;locator?:string;comparison?:any;previous?:any;methodology?:string;evidenceStatus?:string};
const dated=(v:any)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const num=(v:any)=>typeof v==='number'&&Number.isFinite(v)?v:null;
const sourcedDate=(r:any)=>dated(r?.published)||r?.dateBasis==='checked_only'&&dated(r.checkedAt);
export const sourceDateLabel=(r:any)=>dated(r?.published)?'发布'+r.published:r?.dateBasis==='checked_only'&&dated(r.checkedAt)?'产品页未标发布日期；核对'+r.checkedAt:'发布日期未取得';
function metric(r:any):r is IndustryMetric{return r&&typeof r.label==='string'&&(typeof r.value==='string'&&r.value.trim()||num(r.value)!==null)&&r.unit&&r.period&&sourcedDate(r)&&r.source&&safeSource(r.url)&&['official_statistic','primary_disclosure'].includes(r.origin)&&r.status==='sourced';}
const reportedGrowth={sales:26.2,equipment:15,'equipment-forecast':23.2};
const published:IndustryMetric[]=publishedIndustryFacts.map(f=>({...f,period:f.period,published:f.published,value:f.value,scope:f.scope,origin:'official_statistic',status:'sourced',kind:f.kind,comparison:{basis:'reported',kind:'yoy',value:reportedGrowth[f.id],priorPeriod:f.id==='equipment-forecast'?'2025全年':'2024全年',source:f.source,url:f.url,published:f.published}}));
// This is a read-only view model. It does not run the original analysis pipeline,
// reclassify reports as evidence, or infer cycle / localization / fair PE values.
export function buildSemiconductorBoard({financials={},reports={},snapshot,equipmentEvidence=[],layerEvidence=[],candidates={}}:any={}){
 const future=snapshot?.schema==='industry-board-v1'?snapshot:null;
 const reportRows=Array.isArray(reports.rows)?reports.rows:[],financialRows=Array.isArray(financials.companies)?financials.companies:[];
 const candidateRows=Array.isArray(candidates.candidates)?candidates.candidates:[],coverageRows=Array.isArray(candidates.coverage)?candidates.coverage:[];
 const candidateCoverage=(id:string)=>{const coverage=coverageRows.find((c:any)=>c.nodeId===id);return {status:coverage?.status||'unavailable',count:candidateRows.filter((c:any)=>Array.isArray(c.nodeIds)&&c.nodeIds.includes(id)).length,asOf:candidates.asOf||null,sourceSnapshotId:candidates.sourceSnapshotId||candidates.id||null,businessVerified:false};};
 const layers=semiconductorLayers.map(layer=>{
  const supplied=future?.layers?.find((l:any)=>l.id===layer.id||layer.id==='manufacturing'&&l.id==='foundry');
  const companyView=(c:any)=>{
   const row=financialRows.find((r:any)=>r.code===c.code),s=row?.summary;
   const frozen=semiconductorResearch(c.code),frozenIncome=frozen?{period:'2026-09-30',revenue:frozen.revenue,revenueYoy:frozen.revenueYoy,profit:frozen.profit,profitYoy:frozen.profitYoy,source:frozen.source,disclosedOn:frozen.date}:null;
   const income=dated(s?.income?.period)&&(!frozenIncome||s.income.period>=frozenIncome.period)?{...s.income,revenueYoy:num(s.income.revenueYoy),profitYoy:num(s.income.profitYoy)}:frozenIncome;
   return {...c,businessUrl:safeSource(c.source),income,cashflow:dated(s?.cashflow?.period)?s.cashflow:null,balance:dated(s?.balance?.period)?s.balance:null,checkedAt:row?.checkedAt||null,financialStatus:row?.status||'pending'};
  };
  const evidence=layerEvidence.find((r:any)=>r.id===layer.id&&safeSource(r.url)&&sourcedDate(r))||null;
  const curated=(evidence?.business||[]).filter((c:any)=>/^\d{6}$/.test(c.code)&&c.name&&c.basis).map((c:any)=>({...c,layer:layer.id,source:c.url||evidence.url,sourceLabel:c.sourceLabel||evidence.source,processes:Array.isArray(c.processes)?c.processes:[]}));
  const companies=[...new Map([...semiconductorCompanies.filter(c=>c.layer===layer.id),...curated].map(c=>[c.code,c])).values()].map(companyView);
  const kpis=[...(layer.id==='equipment'?published.filter(k=>k.id!=='sales'):[]),...(evidence?.metrics||[]).filter(metric),...(supplied?.kpis||[]).filter(metric)];
  const matchedReports=reportRows.filter((r:any)=>r.layers?.includes(layer.id)||layer.id==='manufacturing'&&r.layers?.includes('foundry')).map((r:any)=>({...r,evidenceRole:r.contentStatus==='metadata_only'?'directory':'document_available_not_adjudicated'}));
  const layerRecord=evidence;
  const processes=layer.children.map(child=>{
   const known=companies.filter(c=>c.processes.includes(child[0]));
   const evidence=layer.id==='equipment'?equipmentEvidence.find((r:any)=>r.id===child[0]&&safeSource(r.url)&&sourcedDate(r)):layerRecord&&known.length?{...layerRecord,headline:'本细分已核实的业务关联：'+known.map(c=>c.name+' · '+c.role).join('；'),scope:'业务范围，不是订单归属；不据此确认受益。',business:[],metrics:[]}:null;
   const specific=(evidence?.business||[]).filter((c:any)=>/^\d{6}$/.test(c.code)&&c.name&&c.basis).map((c:any)=>companyView({...c,source:c.url||evidence.url,sourceLabel:c.sourceLabel||evidence.source,processes:[child[0]],layer:layer.id}));
   return {candidateCoverage:candidateCoverage(child[0]),id:child[0],name:child[1],description:child[2],evidence:evidence||null,kpis:(evidence?.metrics||[]).filter(metric),companies:[...new Map([...known,...specific].map((c:any)=>[c.code,c])).values()],reports:matchedReports.filter((r:any)=>r.nodes?.includes(child[0]))};
  });
  const companyMap=new Map(companies.map((c:any)=>[c.code,c]));
  for(const p of processes)for(const c of p.companies){const prior=companyMap.get(c.code);companyMap.set(c.code,prior?{...prior,processes:[...new Set([...prior.processes,...c.processes])]}:c);}
  const displayedCompanies=[...companyMap.values()];
  return {...layer,evidence,candidateCoverage:candidateCoverage(layer.id),cycle:null,kpis,companies:displayedCompanies,processes,reports:matchedReports,changes:(supplied?.changes||[]).filter((r:any)=>r.evidenceIds?.length&&r.text),missing:[...layer.kpis.filter(label=>!kpis.some(k=>k.label===label)),...(!displayedCompanies.some(c=>c.income)?['本层公司经营快照覆盖不足']:[])],dynamicAnalysisReady:false};
 });
 return {schema:'industry-board-v1',layers,industryFacts:published,reportCount:reportRows.length,financialCompanyCount:layers.flatMap(l=>l.companies).filter(c=>c.income).length,registeredCompanyCount:semiconductorCompanies.length,changes:(future?.changes||[]).filter((r:any)=>r.evidenceIds?.length&&r.text),dynamicAnalysisReady:false,analysisBoundary:'当前为来源事实与共享资料展示；逐篇提取、分层分析和综合裁决尚未接通。'};
}
