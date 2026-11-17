export type FundPoint={at:string,net:number|null,change?:number|null,break_before:boolean,change_reason?:string|null,reason?:string|null,interval_seconds?:number|null,quote_at?:string|null};
export const clock=(at:string)=>new Date(at).toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
export const reasonText=(reason?:string|null)=>({first_sample:'首个采样，无比较基准',sampling_gap:'漏采或间隔超限，断线',lunch_break:'午休分段，不跨午休比较',missing_net:'净额缺失，不补0',quote_check_unavailable:'关联行情时间未通过核对',source_validation_pending:'本类资金源待验收'}[reason||'']||'有效相邻采样');
export function trendSegments(points:FundPoint[],metric:'net'|'change'){
 const result:FundPoint[][]=[];let segment:FundPoint[]=[];
 for(const p of points){if(p.break_before||!Number.isFinite(p[metric])){if(segment.length)result.push(segment);segment=[];}if(Number.isFinite(p[metric]))segment.push(p);}
 if(segment.length)result.push(segment);return result;
}
export function trendOption(points:FundPoint[],metric:'net'|'change',theme:string){
 const muted=theme==='light'?'#596579':'#a8b0bf',line=theme==='light'?'#e3e6eb':'#303238';
 return {animation:false,aria:{enabled:true},grid:{left:66,right:18,top:20,bottom:48},tooltip:{trigger:'axis',renderMode:'richText',confine:true,formatter:(items:any[])=>items.filter(i=>i.value?.[1]!=null).map(i=>clock(new Date(i.value[0]).toISOString())+'\n'+Number(i.value[1]).toLocaleString('zh-CN',{maximumFractionDigits:2})+' 万元').join('\n')},xAxis:{type:'time',splitNumber:4,axisLabel:{hideOverlap:true,color:muted,formatter:(v:number)=>clock(new Date(v).toISOString()).slice(0,5)},axisLine:{lineStyle:{color:line}},splitLine:{show:false}},yAxis:{type:'value',name:'万元',nameTextStyle:{color:muted},scale:false,axisLabel:{color:muted},splitLine:{lineStyle:{color:line}}},series:trendSegments(points,metric).map((s,i)=>({name:metric==='net'?'累计净额':'相邻变化',type:'line',data:s.map(p=>[Date.parse(p.at),(p[metric] as number)/10000]),connectNulls:false,smooth:false,showSymbol:true,symbolSize:6,lineStyle:{width:2,color:'#ff790b'},itemStyle:{color:'#ff790b'},...(i===0?{markLine:{silent:true,symbol:'none',label:{show:false},lineStyle:{color:muted,type:'dashed'},data:[{yAxis:0}]}}:{})}))};
}
export function miniTrendOption(points:FundPoint[],theme:string){
 const option=trendOption(points,'net',theme),valid=points.filter(p=>Number.isFinite(p.net)),last=valid.at(-1)?.net??0,color=last>0?(theme==='light'?'#d92d37':'#ff454f'):last<0?(theme==='light'?'#008a42':'#12c66a'):'#ff790b';
 const format=(v:number)=>Math.abs(v)>=10000?(v/10000).toFixed(1)+'亿':Math.round(v)+'万';
 return {...option,grid:{left:40,right:8,top:7,bottom:18},tooltip:{show:false},xAxis:{...option.xAxis,splitNumber:2,min:points[0]?Date.parse(points[0].at):undefined,max:points.length>1?Date.parse(points.at(-1)!.at):undefined,axisLabel:{...option.xAxis.axisLabel,fontSize:9,showMinLabel:true,showMaxLabel:true,margin:5},axisTick:{show:false}},yAxis:{...option.yAxis,name:'',splitNumber:2,axisLabel:{...option.yAxis.axisLabel,fontSize:9,formatter:format,margin:4},splitLine:{lineStyle:{...option.yAxis.splitLine.lineStyle,opacity:.55}}},series:option.series.map(s=>({...s,symbolSize:3,showSymbol:s.data.length===1,lineStyle:{width:1.5,color},itemStyle:{color},areaStyle:{color,opacity:.09,origin:'auto'},markLine:undefined}))};
}
