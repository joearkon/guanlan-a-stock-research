import {useRef,useEffect,memo} from 'react';
import {init,use as register} from 'echarts/core';
import {LineChart,BarChart} from 'echarts/charts';
import {GridComponent,TooltipComponent,LegendComponent,DataZoomComponent} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';
import {useTheme} from './theme';
register([LineChart,BarChart,GridComponent,TooltipComponent,LegendComponent,DataZoomComponent,CanvasRenderer]);
export default memo(function MarketChart({option,height=420,label='行情图'}:{option:any,height?:number,label?:string}){
 const node=useRef<HTMLDivElement>(null),chart=useRef<ReturnType<typeof init>|null>(null);
 const theme=useTheme();
 useEffect(()=>{if(!node.current)return;const instance=init(node.current,undefined,{renderer:'canvas'});chart.current=instance;const resize=new ResizeObserver(()=>instance.resize());resize.observe(node.current);return()=>{resize.disconnect();instance.dispose();chart.current=null;};},[]);
 useEffect(()=>{const css=getComputedStyle(document.documentElement),color=css.getPropertyValue('--muted').trim(),line=css.getPropertyValue('--line').trim(),surface=css.getPropertyValue('--surface').trim(),body=css.getPropertyValue('--body').trim();chart.current?.setOption({...option,textStyle:{...option.textStyle,color,fontFamily:css.fontFamily,fontSize:12},tooltip:{...option.tooltip,backgroundColor:surface,borderColor:line,textStyle:{color:body}},xAxis:{...option.xAxis,axisLabel:{...option.xAxis?.axisLabel,color,fontSize:12},axisLine:{lineStyle:{color:line}}},yAxis:{...option.yAxis,axisLabel:{...option.yAxis?.axisLabel,color,fontSize:12},splitLine:{lineStyle:{color:line}}}},{notMerge:true,lazyUpdate:true});},[option,theme]);
 return <div className="echart" ref={node} style={{height}} role="img" aria-label={label}/>;
});
