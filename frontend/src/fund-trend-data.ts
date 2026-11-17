export type FundPoint={at:string,net:number|null,change?:number|null,break_before:boolean,change_reason?:string|null,reason?:string|null,interval_seconds?:number|null,quote_at?:string|null};
export const clock=(at:string)=>new Date(at).toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
export const reasonText=(reason?:string|null)=>({first_sample:'首个采样，无比较基准',sampling_gap:'漏采或间隔超限，断线',lunch_break:'午休分段，不跨午休比较',missing_net:'净额缺失，不补0',quote_check_unavailable:'关联行情时间未通过核对',source_validation_pending:'本类资金源待验收'}[reason||'']||'有效相邻采样');
export function trendSegments(points:FundPoint[],metric:'net'|'change'){
 const result:FundPoint[][]=[];let segment:FundPoint[]=[];
 for(const p of points){if(p.break_before||!Number.isFinite(p[metric])){if(segment.length)result.push(segment);segment=[];}if(Number.isFinite(p[metric]))segment.push(p);}
 if(segment.length)result.push(segment);return result;
}
export function trendOption(points:FundPoint[],metric:'net'|'change',theme:string){
 const light=theme==='light',muted=light?'#5b6b80':'#a1a1aa',line=light?'#e2e8f0':'#27272a',body=light?'#334155':'#d4d4d8',label=metric==='net'?'累计净额':'相邻变化';
 const last=points.filter(p=>Number.isFinite(p[metric])).at(-1)?.[metric]??0,color=last>0?(light?'#d92d37':'#ff454f'):last<0?(light?'#008a42':'#12c66a'):'#f97316';
 const digits=(v:number)=>v.toLocaleString('zh-CN',{maximumFractionDigits:2}),compact=(v:number)=>v===0?'0':Math.abs(v)>=10000?digits(v/10000)+'亿':digits(v)+'万';
 return {
  animation:false,aria:{enabled:true},textStyle:{fontFamily:'system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif',fontSize:12,color:muted},
  grid:{left:58,right:18,top:22,bottom:34},
  tooltip:{trigger:'axis',renderMode:'richText',confine:true,transitionDuration:0,backgroundColor:light?'#ffffff':'#18181b',borderColor:line,borderWidth:1,borderRadius:6,padding:[9,11],textStyle:{color:body,fontSize:12},shadowBlur:10,shadowColor:light?'rgba(15,23,42,.10)':'rgba(0,0,0,.25)',axisPointer:{type:'line',snap:true,lineStyle:{color:muted,width:1,type:'dashed'}},formatter:(items:any[])=>items.filter(i=>Number.isFinite(i.value?.[0])&&Number.isFinite(i.value?.[1])).map(i=>clock(new Date(i.value[0]).toISOString())+'\n'+label+' '+digits(i.value[1])+' 万元').join('\n')},
  xAxis:{type:'time',splitNumber:4,min:points[0]?Date.parse(points[0].at):undefined,max:points.length>1?Date.parse(points.at(-1)!.at):undefined,axisLabel:{hideOverlap:true,showMinLabel:true,showMaxLabel:true,margin:10,color:muted,formatter:(v:number)=>clock(new Date(v).toISOString()).slice(0,5)},axisTick:{show:false},axisLine:{lineStyle:{color:line}},splitLine:{show:false}},
  yAxis:{type:'value',name:'净额',nameGap:8,nameTextStyle:{color:muted,fontSize:11},scale:false,splitNumber:4,axisLabel:{color:muted,fontSize:11,margin:8,formatter:compact},axisLine:{show:false},axisTick:{show:false},splitLine:{lineStyle:{color:line,opacity:.65}}},
  series:trendSegments(points,metric).map((s,i)=>({name:label,type:'line',data:s.map(p=>[Date.parse(p.at),(p[metric] as number)/10000]),connectNulls:false,smooth:false,showSymbol:s.length===1,symbol:'circle',symbolSize:5,lineStyle:{width:2,color},itemStyle:{color,borderWidth:0},areaStyle:{color,opacity:.1,origin:'auto'},emphasis:{focus:'series',scale:1.4},...(i===0?{markLine:{silent:true,symbol:'none',label:{show:false},lineStyle:{color:muted,type:'dashed',opacity:.45},data:[{yAxis:0}]}}:{})}))
 };
}
export function miniTrendOption(points:FundPoint[],theme:string){
 const option=trendOption(points,'net',theme),valid=points.filter(p=>Number.isFinite(p.net)),last=valid.at(-1)?.net??0,color=last>0?(theme==='light'?'#d92d37':'#ff454f'):last<0?(theme==='light'?'#008a42':'#12c66a'):'#ff790b';
 const format=(v:number)=>Math.abs(v)>=10000?(v/10000).toFixed(1)+'亿':Math.round(v)+'万';
 return {...option,grid:{left:40,right:8,top:7,bottom:18},tooltip:{show:false},xAxis:{...option.xAxis,splitNumber:2,min:points[0]?Date.parse(points[0].at):undefined,max:points.length>1?Date.parse(points.at(-1)!.at):undefined,axisLabel:{...option.xAxis.axisLabel,fontSize:9,showMinLabel:true,showMaxLabel:true,margin:5},axisTick:{show:false}},yAxis:{...option.yAxis,name:'',splitNumber:2,axisLabel:{...option.yAxis.axisLabel,fontSize:9,formatter:format,margin:4},splitLine:{lineStyle:{...option.yAxis.splitLine.lineStyle,opacity:.55}}},series:option.series.map(s=>({...s,symbolSize:3,showSymbol:s.data.length===1,lineStyle:{width:1.5,color},itemStyle:{color},areaStyle:{color,opacity:.09,origin:'auto'},markLine:undefined}))};
}
