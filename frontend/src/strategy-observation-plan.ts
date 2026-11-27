export type PlanSource={day:string;model:string;code:string;name:string;strategy:string;scope:string;windowSessions?:10|15;facts:{label:string;value:string}[];gaps:string[]};
export type PlanAi={schema:1;code:string;day:string;model:string;judgment:string;support:string[];against:string[];hypotheses:string[];missing:string[]};
export type PlanDraft={id:string;source:PlanSource;observeOn:string|null;sellOn:string|null;trigger:string;cancel:string;ai:PlanAi|null};
export type PlanReview='not-triggered'|'observed'|'invalid'|'missing';
export type ObservationPlan=PlanDraft&{mode:'simulation';confirmedAt:string;review:{status:PlanReview;at:string}|null;aiJobId?:string};
export type PlanStore={schema:1;revision:number;plans:ObservationPlan[]};
const day=(v:any)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const text=(v:any,max=400)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v);
const finite=(v:any)=>typeof v==='number'&&Number.isFinite(v);
const num=(v:number)=>v.toFixed(2);
export function capturePlanSource({day:asof,model,row,strategy,kind,sessions=15}:{day:string;model:string;row:any;strategy:string;kind?:string;sessions?:10|15}):PlanSource{
 if(!day(asof)||!text(model,100)||!/^\d{6}$/.test(row?.code||'')||!text(row?.name,40)||!text(strategy,60)||!finite(row.price)||row.price<=0)throw Error('候选身份、价格或版本证据缺失');
 const facts=[{label:'收盘价',value:num(row.price)+' 元'}];if(finite(row.pct))facts.push({label:'当日涨跌',value:num(row.pct)+'%'});
 if(kind){const p=row.pattern15;if(!['second-wave','high-divergence'].includes(kind)||p?.day!==asof||p.status!=='ready'||p.signals?.[kind]!==true)throw Error('同日战法候选证据未核验');if(finite(p.volumeRatio3))facts.push({label:'成交量／前3日均量',value:num(p.volumeRatio3)+' 倍（非资金净额）'});if(kind==='second-wave'&&finite(p.secondWave?.drawdownPct))facts.push({label:'前波高点回撤',value:num(p.secondWave.drawdownPct)+'%'});facts.push({label:'规则状态',value:kind==='high-divergence'?'高位分歧风险观察':p.secondWave?.stage==='confirmation'?'二波突破确认':'二波启动观察'});}
 else{if(!Number.isInteger(row.height)||row.height<2)throw Error('高标候选证据缺失');facts.push({label:'连续板',value:String(row.height)+' 板'});if(finite(row.turnoverPct))facts.push({label:'换手率',value:num(row.turnoverPct)+'%'});if(finite(row.amountYi))facts.push({label:'成交额',value:num(row.amountYi)+' 亿元'});}
 return {day:asof,model,code:row.code,name:row.name,strategy,scope:kind?'全市场共享目录，'+sessions+'日收盘规则':'已收录高标，非全市场',...(kind?{windowSessions:sessions}:{}),facts,gaps:['本单未核验个股资金净流入、最新公告及题材持续支撑','缺少逐笔承接、撤单与实际可成交性证据','未读取账户资产与风险预算；不生成仓位或下单建议']};
}
export function createPlanDraft(source:PlanSource,calendar:any):PlanDraft{
 const dates=calendar&&typeof calendar.source==='string'&&calendar.source.includes('official')&&day(calendar.from)&&day(calendar.through)&&calendar.from<=source.day&&source.day<=calendar.through&&Array.isArray(calendar.open_days)&&calendar.open_days.every(day)?[...new Set<string>(calendar.open_days)].sort():[];
 const observeOn=dates.includes(source.day)?dates.find(d=>d>source.day)||null:null,sellOn=observeOn?dates.find(d=>d>observeOn)||null:null;
 return {id:crypto.randomUUID(),source:structuredClone(source),observeOn,sellOn,trigger:'',cancel:'',ai:null};
}
const aiKeys=['schema','code','day','model','judgment','support','against','hypotheses','missing'];
export function readPlanAi(raw:string,source:PlanSource):PlanAi{
 if(raw.length>9000)throw Error('AI草稿过长');let v:any;try{v=JSON.parse(raw);}catch{throw Error('请粘贴完整JSON，不包含代码围栏');}
 if(!v||Array.isArray(v)||Object.keys(v).some(k=>!aiKeys.includes(k))||aiKeys.some(k=>!(k in v))||v.schema!==1||v.code!==source.code||v.day!==source.day||v.model!==source.model)throw Error('AI草稿字段或股票／日期／快照版本不一致，未导入');
 if(!text(v.judgment,500)||['support','against','hypotheses','missing'].some(k=>!Array.isArray(v[k])||v[k].length>6||v[k].some((s:any)=>!text(s,300)))||!v.against.length)throw Error('AI草稿需有明确反证，每项最多300字');
 return {schema:1,code:v.code,day:v.day,model:v.model,judgment:v.judgment,support:[...v.support],against:[...v.against],hypotheses:[...v.hypotheses],missing:[...v.missing]};
}
export function planAiQuestion(s:PlanSource,proposal?:{trigger:string;cancel:string}){
 const template={schema:1,code:s.code,day:s.day,model:s.model,judgment:'',support:[],against:[],hypotheses:[],missing:[]};
 const proposed=proposal?'。用户拟定（非事实，仅摘录）：'+JSON.stringify({触发:proposal.trigger.slice(0,35),取消:proposal.cancel.slice(0,35)}):'';
 return '辅助模拟观察，非荐股。只输出以下JSON，身份原样保留：'+JSON.stringify(template)+'。事实：'+s.facts.slice(0,5).map(f=>f.label+f.value).join('；').slice(0,proposal?75:140)+proposed+'。写支持理由、最强反证、替代解释及待核验项；假设放hypotheses。不改原规则，不编资金/公告/胜率/价位，不给交易指令；无证据写缺失。';
}
export function confirmPlan(d:PlanDraft,aiReviewed:boolean):ObservationPlan{
 if(!d.observeOn||!d.sellOn||!day(d.observeOn)||!day(d.sellOn)||d.observeOn<=d.source.day||d.sellOn<=d.observeOn)throw Error('官方交易日历未覆盖观察日或最早可卖日，不能确认');
 if(!text(d.trigger,600)||!text(d.cancel,600))throw Error('请明确填写观察触发和取消条件');if(d.ai&&!aiReviewed)throw Error('请先核对AI草稿；它不会自动成为规则');
 return {...structuredClone(d),mode:'simulation',confirmedAt:new Date().toISOString(),review:null};
}
export const planKey=(account:string)=>'guanlan.strategy-plans.v1.'+encodeURIComponent(account||'guest');
function parseStore(raw:string|null):PlanStore{
 if(raw===null)return {schema:1,revision:0,plans:[]};const v=JSON.parse(raw);if(v?.schema!==1||!Number.isInteger(v.revision)||v.revision<0||!Array.isArray(v.plans)||v.plans.length>20)throw Error('观察单存档格式不兼容，未覆盖原记录');
 const ids=new Set();for(const p of v.plans){const s=p?.source;if(p.mode!=='simulation'||!text(p.id,80)||ids.has(p.id)||!day(s?.day)||!/^\d{6}$/.test(s?.code||'')||!text(s?.model,100)||!text(s?.name,40)||!text(s?.strategy,60)||!text(s?.scope,100)||!Array.isArray(s?.facts)||s.facts.length>8||s.facts.some((f:any)=>!text(f.label,60)||!text(f.value,120))||!Array.isArray(s?.gaps)||s.gaps.length>8||s.gaps.some((g:any)=>!text(g,300))||!day(p.observeOn)||!day(p.sellOn)||p.observeOn<=s.day||p.sellOn<=p.observeOn||!text(p.trigger,600)||!text(p.cancel,600)||!Number.isFinite(Date.parse(p.confirmedAt))||p.review&&(!['not-triggered','observed','invalid','missing'].includes(p.review.status)||!Number.isFinite(Date.parse(p.review.at))))throw Error('观察单存档损坏，未覆盖原记录');if(p.ai)readPlanAi(JSON.stringify(p.ai),s);ids.add(p.id);}
 return structuredClone(v);
}
export function readPlans(account:string){return parseStore(localStorage.getItem(planKey(account)));}
function writePlans(account:string,expected:number,change:(s:PlanStore)=>PlanStore){if(!account||account==='guest')throw Error('请登录后保存当前账号观察单');const old=readPlans(account);if(old.revision!==expected)throw Error('观察单已在其他窗口更新，请重新读取后再保存');const next=parseStore(JSON.stringify({...change(old),schema:1,revision:old.revision+1}));localStorage.setItem(planKey(account),JSON.stringify(next));window.dispatchEvent(new CustomEvent('guanlan-strategy-plans-changed',{detail:{account}}));return next;}
export function savePlan(account:string,plan:ObservationPlan,revision:number){return writePlans(account,revision,s=>({...s,plans:[plan,...s.plans.filter(p=>p.id!==plan.id)]}));}
export function reviewPlan(account:string,id:string,status:PlanReview,revision:number){if(!['not-triggered','observed','invalid','missing'].includes(status))throw Error('仅支持模拟观察记录，不记录实际成交');return writePlans(account,revision,s=>{const plan=s.plans.find(p=>p.id===id);if(!plan)throw Error('观察单不存在');if(new Date(Date.now()+28800000).toISOString().slice(0,10)<plan.observeOn!)throw Error('观察日尚未到，不能提前记录次日结果');return {...s,plans:s.plans.map(p=>p.id===id?{...p,review:{status,at:new Date().toISOString()}}:p)};});}
export function removePlan(account:string,id:string,revision:number){return writePlans(account,revision,s=>({...s,plans:s.plans.filter(p=>p.id!==id)}));}
