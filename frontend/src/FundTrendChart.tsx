import {useEffect,useMemo,useRef,useState} from 'react';
import {init,use as register} from 'echarts/core';
import {LineChart} from 'echarts/charts';
import {GridComponent,TooltipComponent,MarkLineComponent,AriaComponent} from 'echarts/components';
import {SVGRenderer} from 'echarts/renderers';
import {useTheme} from './theme';
import {trendOption,type FundPoint} from './fund-trend-data';
import ChartCredits from './ChartCredits';
register([LineChart,GridComponent,TooltipComponent,MarkLineComponent,AriaComponent,SVGRenderer]);
export default function FundTrendChart({points,metric}:{points:FundPoint[],metric:'net'|'change'}){
 const node=useRef<HTMLDivElement>(null),theme=useTheme(),[failed,setFailed]=useState(false),option=useMemo(()=>trendOption(points,metric,theme),[points,metric,theme]);
 useEffect(()=>{let chart:ReturnType<typeof init>|undefined,observer:ResizeObserver|undefined;try{if(!node.current)return;chart=init(node.current,undefined,{renderer:'svg'});chart.setOption(option as any);observer=new ResizeObserver(()=>chart?.resize());observer.observe(node.current);}catch{setFailed(true);}return()=>{observer?.disconnect();chart?.dispose();};},[option]);
 return <>{failed?<p role="status">图表暂不可用，请查看下方原始采样表。</p>:<div ref={node} className="fund-trend-plot" role="img" aria-label={(metric==='net'?'累计净额':'相邻快照变化')+'趋势图，缺口断线，可核对下方采样表'}/>}<ChartCredits/></>;
}
