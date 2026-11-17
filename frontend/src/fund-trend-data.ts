export type FundPoint={at:string,net:number|null,change?:number|null,break_before:boolean,change_reason?:string|null,reason?:string|null,interval_seconds?:number|null,quote_at?:string|null};
export const clock=(at:string)=>new Date(at).toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
export const reasonText=(reason?:string|null)=>({first_sample:'首个采样，无比较基准',sampling_gap:'漏采或间隔超限，断线',lunch_break:'午休分段，不跨午休比较',missing_net:'净额缺失，不补0',quote_check_unavailable:'关联行情时间未通过核对',source_validation_pending:'本类资金源待验收'}[reason||'']||'有效相邻采样');
export function trendSegments(points:FundPoint[],metric:'net'|'change'){
 const result:FundPoint[][]=[];let segment:FundPoint[]=[];
 for(const p of points){if(p.break_before||!Number.isFinite(p[metric])){if(segment.length)result.push(segment);segment=[];}if(Number.isFinite(p[metric]))segment.push(p);}
 if(segment.length)result.push(segment);return result;
}
export function sparkPaths(points:FundPoint[]){
 const valid=points.filter(p=>Number.isFinite(p.net)&&Number.isFinite(Date.parse(p.at)));if(!valid.length)return {segments:[] as string[],dots:[] as number[][],zero:20};
 const times=valid.map(p=>Date.parse(p.at)),values=valid.map(p=>p.net as number),lo=Math.min(0,...values),hi=Math.max(0,...values),x=(p:FundPoint)=>4+(Date.parse(p.at)-times[0])/(times.at(-1)!-times[0]||1)*104,y=(v:number)=>34-(v-lo)/(hi-lo||1)*28;
 return {segments:trendSegments(points,'net').map(s=>s.map((p,i)=>(i?'L':'M')+x(p).toFixed(2)+','+y(p.net as number).toFixed(2)).join(' ')),dots:valid.map(p=>[x(p),y(p.net as number)]),zero:y(0)};
}
export function trendOption(points:FundPoint[],metric:'net'|'change',theme:string){
 const muted=theme==='light'?'#596579':'#a8b0bf',line=theme==='light'?'#e3e6eb':'#303238';
 return {animation:false,aria:{enabled:true},grid:{left:66,right:18,top:20,bottom:48},tooltip:{trigger:'axis',renderMode:'richText',confine:true,formatter:(items:any[])=>items.filter(i=>i.value?.[1]!=null).map(i=>clock(new Date(i.value[0]).toISOString())+'\n'+Number(i.value[1]).toLocaleString('zh-CN',{maximumFractionDigits:2})+' 万元').join('\n')},xAxis:{type:'time',splitNumber:4,axisLabel:{hideOverlap:true,color:muted,formatter:(v:number)=>clock(new Date(v).toISOString()).slice(0,5)},axisLine:{lineStyle:{color:line}},splitLine:{show:false}},yAxis:{type:'value',name:'万元',nameTextStyle:{color:muted},scale:false,axisLabel:{color:muted},splitLine:{lineStyle:{color:line}}},series:trendSegments(points,metric).map((s,i)=>({name:metric==='net'?'累计净额':'相邻变化',type:'line',data:s.map(p=>[Date.parse(p.at),(p[metric] as number)/10000]),connectNulls:false,smooth:false,showSymbol:true,symbolSize:6,lineStyle:{width:2,color:'#ff790b'},itemStyle:{color:'#ff790b'},...(i===0?{markLine:{silent:true,symbol:'none',label:{show:false},lineStyle:{color:muted,type:'dashed'},data:[{yAxis:0}]}}:{})}))};
}
