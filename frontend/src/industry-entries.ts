import catalog from '../../shared/industry-catalog.json';
import {industrySectors} from './industry-sectors';
// Frontend research entries do not enroll new companies in backend sync jobs.
export const industryEntries=[
 ...catalog.map(i=>({...i,coverage:'共享财报与公开研究',snapshot:false,planned:false})),
 ...industrySectors.map(s=>({id:s.id,name:s.name,eyebrow:s.kind==='投资风格'?'现金回报':s.id==='consumer'?'品牌与经营':'产业链研究',summary:s.description,stages:s.children.map(c=>c.name),companies:s.cases||(s.id==='dividend'?[{code:'600900',name:'长江电力',stage:'水电运营'}]:s.id==='consumer'?[{code:'600519',name:'贵州茅台',stage:'高端白酒'}]:s.id==='batteries'?[{code:'300750',name:'宁德时代',stage:'储能电芯'},{code:'300014',name:'亿纬锂能',stage:'储能电池'},{code:'300274',name:'阳光电源',stage:'PCS与系统'}]:[]),coverage:s.ready?'公开披露案例 · 版本维护':'建设中 · 尚未完成研究',snapshot:!!s.ready,planned:!s.ready}))
];
