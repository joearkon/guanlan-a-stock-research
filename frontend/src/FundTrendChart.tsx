import {useEffect,useMemo,useRef,useState} from 'react';
import {init,use as register} from 'echarts/core';
import {LineChart} from 'echarts/charts';
import {GridComponent,TooltipComponent,MarkLineComponent,AriaComponent} from 'echarts/components';
import {SVGRenderer} from 'echarts/renderers';
import {useTheme} from './theme';
import {miniTrendOption,trendOption,type FundPoint} from './fund-trend-data';
import ChartCredits from './ChartCredits';
register([LineChart,GridComponent,TooltipComponent,MarkLineComponent,AriaComponent,SVGRenderer]);
export function FundMiniChart({points,name}:{points:FundPoint[],name:string}){
 const node=useRef<HTMLSpanElement>(null),theme=useTheme(),option=useMemo(()=>miniTrendOption(points,theme),[points,theme]),[failed,setFailed]=useState(false);
 useEffect(()=>{let chart:ReturnType<typeof init>|undefined,observer:ResizeObserver|undefined;const paint=()=>{try{if(!node.current||node.current.clientWidth<=0)return;if(chart)chart.resize();else{chart=init(node.current,undefined,{renderer:'svg'});chart.setOption(option as any);}}catch{setFailed(true);}};paint();if(node.current&&typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(paint);observer.observe(node.current);}return()=>{observer?.disconnect();chart?.dispose();};},[option]);
 return failed?<span className="fund-mini-placeholder">打开查看数据</span>:<span ref={node} className="fund-mini-plot" role="img" aria-label={name+'累计资金走势，按实际时间采样，缺口断线'}/>;
}
export default function FundTrendChart({points,metric}:{points:FundPoint[],metric:'net'|'change'}){
 const node=useRef<HTMLDivElement>(null),theme=useTheme(),[failed,setFailed]=useState(false),option=useMemo(()=>trendOption(points,metric,theme),[points,metric,theme]);
 useEffect(()=>{let chart:ReturnType<typeof init>|undefined,observer:ResizeObserver|undefined;try{if(!node.current)return;chart=init(node.current,undefined,{renderer:'svg'});chart.setOption(option as any);observer=new ResizeObserver(()=>chart?.resize());observer.observe(node.current);}catch{setFailed(true);}return()=>{observer?.disconnect();chart?.dispose();};},[option]);
 return <>{failed?<p role="status">图表暂不可用，请查看下方原始采样表。</p>:<div ref={node} className="fund-trend-plot" role="img" aria-label={(metric==='net'?'累计净额':'相邻快照变化')+'趋势图，缺口断线，可核对下方采样表'}/>}<ChartCredits/></>;
}
