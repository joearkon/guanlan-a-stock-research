import {cleanObservationCriteria,observationDefaults} from './stock-observation-contract.mjs';
export const fundDefaults={...observationDefaults,window:'5',scope:'daily',signal:'any',minInstitutionDays:0,fundSort:'buyDays'};
export const fundPresets=[
 {id:'divergence',name:'机构参与后分歧',description:'机构买方至少出现2日、披露净额为正；日内回撤≥3%或近2个完整交易日回落≥3%',criteria:{minInstitutionDays:2,netPositive:'1',signal:'divergence'}},
 {id:'opposed',name:'机构与榜单分歧',description:'最新披露中，机构净额与榜单整体净额方向相反；不代表全市场买卖双方',criteria:{minInstitutionDays:1,signal:'opposed'}},
 {id:'turned',name:'机构转向',description:'窗口内早期有机构净买，最新机构披露转为净卖；不推断仍在持仓',criteria:{minInstitutionDays:1,signal:'turned'}},
 {id:'repair',name:'分歧后修复',description:'此前2个完整交易日回落≥3%，本期上涨且高于今开、距高点回撤<3%；仅描述价量变化',criteria:{minInstitutionDays:1,signal:'repair'}},
 {id:'participation',name:'反复参与',description:'机构买方至少出现2个披露日，不要求净买或价格转强',criteria:{minInstitutionDays:2,signal:'any'}}
];
const extra=new Set(['window','scope','signal','minInstitutionDays','minInstitutionNetWan','netPositive','fundSort']);
export function cleanFundCriteria(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('资金条件格式不正确');
 if(input.technical)throw Error('技术指标请在价量筛选中使用，资金足迹不忽略此条件');
 if(input.structure)throw Error('结构条件请在价量筛选中使用，资金足迹不忽略此条件');
 const base={};for(const [k,v]of Object.entries(input))if(!extra.has(k))base[k]=v;
 const out={...fundDefaults,...cleanObservationCriteria(base)};
 for(const [k,choices]of Object.entries({window:['5','10'],scope:['daily','multi'],signal:['any','divergence','opposed','turned','repair'],netPositive:['0','1'],fundSort:['buyDays','netWan','lastNetWan','pct','pullback','turnover','closedReturn2d']}))if(input[k]!=null){if(!choices.includes(String(input[k])))throw Error('资金条件无效：'+k);out[k]=String(input[k]);}
 for(const k of ['minInstitutionDays','minInstitutionNetWan'])if(input[k]!=null&&input[k]!==''){const v=Number(input[k]);if(typeof input[k]==='boolean'||!Number.isFinite(v)||Math.abs(v)>1e9||k==='minInstitutionDays'&&(!Number.isInteger(v)||v<0||v>Number(out.window)))throw Error('资金数值不正确：'+k);out[k]=v;}
 return out;
}
