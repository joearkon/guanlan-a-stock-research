import {safeSource} from './urls';
const finite=(v:any)=>typeof v==='number'&&Number.isFinite(v);
const dated=(v:any)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const samePeriod=(current:string,previous:string)=>/^\d{4}/.test(current||'')&&previous===current.replace(/预测/g,'').replace(/^\d{4}/,y=>String(Number(y)-1));
const citation=(x:any)=>x?.source&&safeSource(x.url)&&dated(x.published);
export function metricComparison(metric:any){
 const reported=metric.comparison;
 if(reported?.basis==='reported'&&finite(reported.value)&&['yoy','pp'].includes(reported.kind)&&samePeriod(metric.period,reported.priorPeriod)&&citation(reported))return {text:(/预测/.test(metric.kind||'')?'预测':'')+'同比 '+(reported.value>0?'+':'')+reported.value.toFixed(2)+(reported.kind==='pp'?'个百分点':'%'),basis:'来源直接披露',priorPeriod:reported.priorPeriod,url:safeSource(reported.url)!,source:reported.source,locator:reported.locator||''};
 const prior=metric.previous;
 if(!prior||!finite(metric.value)||!finite(prior.value)||!metric.scope||prior.scope!==metric.scope||prior.unit!==metric.unit||prior.kind!==metric.kind||!samePeriod(metric.period,prior.period)||!citation(prior))return null;
 if(metric.unit!=='%'&&prior.value<=0)return null;
 const change=metric.unit==='%'?metric.value-prior.value:(metric.value/prior.value-1)*100;
 return {text:'同比 '+(change>0?'+':'')+change.toFixed(2)+(metric.unit==='%'?'个百分点':'%'),basis:'同口径原值计算',priorPeriod:prior.period,url:safeSource(prior.url)!,source:prior.source,locator:prior.locator||'',previousValue:prior.value,formula:metric.unit==='%'?'本期 − 上年同期':'(本期 ÷ 上年同期 − 1) × 100%'};
}
