import {expect,test} from 'vitest';
import {trendSegments,trendOption,miniTrendOption} from './fund-trend-data';
const p=(at:string,net:number|null,break_before=false)=>({at:'2026-11-17T'+at+':00Z',net,change:net,break_before});
test('sparkline and large chart preserve real time, zeros and gaps without interpolation',()=>{
 const points=[p('01:30',0,true),p('03:30',100,true),p('05:00',110,true),p('05:30',120)];
 expect(trendSegments(points,'net').map(s=>s.length)).toEqual([1,1,2]);
 const option=trendOption(points,'net','dark');expect(option.animation).toBe(false);expect(option.series).toHaveLength(3);expect(option.series.every(s=>s.connectNulls===false&&s.smooth===false)).toBe(true);
 expect(option.xAxis.axisLabel.hideOverlap).toBe(true);
 expect(option.series[2].data[0][0]).toBe(Date.parse(points[2].at));
});
test('missing values and first sample deltas do not become zeros',()=>{
 const points=[p('05:00',100,true),p('05:30',null),p('06:00',-40,true)];
 expect(trendSegments(points,'net').map(s=>s.length)).toEqual([1,1]);expect(miniTrendOption([],'dark').series).toEqual([]);
});
test('mini financial chart has time axes, transparent area fill and disconnected real samples',()=>{
 const option=miniTrendOption([p('01:30',10,true),p('03:30',15,true),p('05:00',20,true),p('05:30',30)],'dark');
 expect(option.animation).toBe(false);expect(option.xAxis.type).toBe('time');expect(option.xAxis.axisLabel.hideOverlap).toBe(true);expect(option.series).toHaveLength(3);expect(option.series.map(s=>s.data.length)).toEqual([1,1,2]);expect(option.series.every(s=>s.areaStyle.opacity>0&&s.areaStyle.opacity<.2&&!s.smooth&&!s.connectNulls)).toBe(true);expect(option.series[0].lineStyle.color).toBe('#ff454f');
 expect(miniTrendOption([p('05:00',-10,true),p('05:30',-20)],'light').series[0].lineStyle.color).toBe('#008a42');
 expect(option.series[0].showSymbol).toBe(true);expect(option.series[2].showSymbol).toBe(false);
});
test('large chart option renders real SVG with distinct disconnected series',async()=>{
 const {init,use}=await import('echarts/core'),{LineChart}=await import('echarts/charts'),{SVGRenderer}=await import('echarts/renderers'),{GridComponent,MarkLineComponent,TooltipComponent}=await import('echarts/components');use([LineChart,SVGRenderer,GridComponent,MarkLineComponent,TooltipComponent]);
 const chart=init(null,undefined,{renderer:'svg',ssr:true,width:640,height:300});try{chart.setOption(trendOption([p('01:30',0,true),p('03:30',200,true),p('05:00',100,true),p('05:30',150)],'net','dark') as any);const svg=chart.renderToSVGString();expect(svg).toContain('<svg');expect(svg).toContain('万元');expect(svg).not.toContain('NaN');}finally{chart.dispose();}
});
test('mini area option draws an actual ECharts SVG, not a hand-built icon',async()=>{
 const {init,use}=await import('echarts/core'),{LineChart}=await import('echarts/charts'),{SVGRenderer}=await import('echarts/renderers'),{GridComponent}=await import('echarts/components');use([LineChart,SVGRenderer,GridComponent]);const chart=init(null,undefined,{renderer:'svg',ssr:true,width:220,height:72});try{chart.setOption(miniTrendOption([p('01:30',0,true),p('03:30',200,true),p('05:00',100,true),p('05:30',150)],'dark') as any);const svg=chart.renderToSVGString();expect(svg).toContain('fill-opacity="0.09"');expect(svg).toContain('09:30');expect(svg).not.toContain('NaN');}finally{chart.dispose();}
});
