import {memo,useEffect,useMemo,useRef,useState} from 'react';
import {createChart,CandlestickSeries,LineSeries,HistogramSeries,ColorType,CrosshairMode,type IChartApi,type ISeriesApi} from 'lightweight-charts';
import {financialData,MA_WINDOWS} from './financial-data';
import {number} from './api';
import {validDate} from './portfolio-data';
import {ChevronLeft,ChevronRight,ZoomIn,ZoomOut} from 'lucide-react';
import ChartCredits from './ChartCredits';
import './chart-navigation.css';
const maColors=['#94a3b8','#ca9c25','#a475df','#4e90de'];
const views=new Map<string,{range?:{from:string,to:string},enabled?:number[]}>();
const identityOf=(p:any)=>[p.code,p.period,p.adjustment].join(':');
const timeKey=(t:any)=>typeof t==='string'?t:t&&typeof t==='object'?`${t.year}-${String(t.month).padStart(2,'0')}-${String(t.day).padStart(2,'0')}`:null;
function rememberView(id:string,patch:any){views.set(id,{...views.get(id),...patch});if(views.size>64)views.delete(views.keys().next().value!);}
export default memo(function FinancialChart({payload,compact=false}:{payload:any;compact?:boolean}){
 const node=useRef<HTMLDivElement>(null),chart=useRef<IChartApi|null>(null),candle=useRef<ISeriesApi<'Candlestick'>|null>(null),volume=useRef<ISeriesApi<'Histogram'>|null>(null),lines=useRef<ISeriesApi<'Line'>[]>([]);
 const data=useMemo(()=>financialData(payload),[payload]),current=useRef(payload);current.current=payload;
 const [enabled,setEnabled]=useState(()=>views.get(identityOf(payload))?.enabled||MA_WINDOWS),[tooltip,setTooltip]=useState<any>(null),[failure,setFailure]=useState<Error|null>(null);
 const [year,setYear]=useState(''),[targetDate,setTargetDate]=useState(''),[navigationNote,setNavigationNote]=useState('');
 const dates:string[]=data.candles.map(b=>String(b.time)),years=[...new Set(dates.map(d=>d.slice(0,4)))];
 function showWindow(from:number,to:number){chart.current?.timeScale().setVisibleLogicalRange({from,to});setTooltip(null);}
 function navigate(action:'in'|'out'|'previous'|'next'|'first'|'latest'){
  const count=data.candles.length;if(!count||!chart.current)return;
  const last=count-1,range=chart.current.timeScale().getVisibleLogicalRange(),span=Math.min(last,Math.max(Math.min(10,last),range?range.to-range.from:89));
  let width=span,center=range?(range.from+range.to)/2:last-span/2;
  if(action==='in')width=Math.max(Math.min(10,last),span*.65);
  if(action==='out')width=Math.min(last,span*1.5);
  if(action==='previous')center-=span*.8;
  if(action==='next')center+=span*.8;
  if(action==='first')center=width/2;
  if(action==='latest'){width=Math.min(89,last);center=last-width/2;}
  const from=Math.max(0,Math.min(last-width,center-width/2));showWindow(from,from+width);setYear('');
  setNavigationNote(action==='first'?'已定位最早已加载K线 '+dates[0]+'；需要更早年份时，请加载更早历史。':action==='latest'?'已回到最近 '+Math.min(90,count)+' 根K线。':'已调整K线视野；只使用当前已加载的数据。');
 }
 function locateDate(){
  if(!validDate(targetDate))return;
  if(!dates.length||targetDate<dates[0]||targetDate>dates.at(-1)!){setNavigationNote('该日期不在已加载范围内；更早日期请先点击「加载更早历史」，不会自动连续请求。');return;}
  const index=dates.findIndex(d=>d>=targetDate),width=Math.min(89,dates.length-1),from=Math.max(0,Math.min(dates.length-1-width,index-width/2));showWindow(from,from+width);setYear('');setNavigationNote('已定位 '+dates[index]+(dates[index]!==targetDate?'（所选日期没有K线，定位其后首根已加载K线）':'')+'。');
 }
 function locateYear(value:string){
  setYear(value);if(!value)return;
  const start=dates.findIndex(d=>d.startsWith(value)),end=dates.length-1-[...dates].reverse().findIndex(d=>d.startsWith(value));
  if(start>=0){showWindow(start,end);setNavigationNote('已定位 '+value+' 年已加载K线 '+dates[start]+' 至 '+dates[end]+'。');}
 }
 const frame=useRef<number>(0),lastIdentity=useRef('');
 function colors(){const css=getComputedStyle(document.documentElement);return {background:css.getPropertyValue('--surface').trim()||'#18181b',text:css.getPropertyValue('--muted').trim()||'#a1a1aa',line:css.getPropertyValue('--line').trim()||'#27272a',up:css.getPropertyValue('--up').trim()||'#ef4444',down:css.getPropertyValue('--down').trim()||'#22c55e'};}
 useEffect(()=>{
  if(!node.current)return;const palette=colors();
  const c=createChart(node.current,{autoSize:true,height:compact?260:400,layout:{background:{type:ColorType.Solid,color:palette.background},textColor:palette.text,fontFamily:getComputedStyle(document.documentElement).fontFamily,fontSize:12,attributionLogo:true,panes:{separatorColor:palette.line,separatorHoverColor:palette.text,enableResize:true}},grid:{vertLines:{visible:false},horzLines:{color:palette.line}},crosshair:{mode:CrosshairMode.Normal},timeScale:{borderColor:palette.line,rightOffset:4,timeVisible:false,fixLeftEdge:true},rightPriceScale:{borderColor:palette.line},handleScroll:{mouseWheel:!compact,pressedMouseMove:true,horzTouchDrag:true,vertTouchDrag:false},handleScale:{mouseWheel:!compact,pinch:true,axisPressedMouseMove:true},localization:{locale:'zh-CN'}});
  chart.current=c;candle.current=c.addSeries(CandlestickSeries,{upColor:palette.up,downColor:palette.down,wickUpColor:palette.up,wickDownColor:palette.down,borderVisible:false});
  lines.current=MA_WINDOWS.map((n,i)=>c.addSeries(LineSeries,{color:maColors[i],lineWidth:1,priceLineVisible:false,lastValueVisible:false,crosshairMarkerVisible:false,title:''}));
  volume.current=c.addSeries(HistogramSeries,{priceFormat:{type:'volume'},priceLineVisible:false,lastValueVisible:false},1);
  c.panes()[0].setStretchFactor(4);c.panes()[1].setStretchFactor(1);
  c.subscribeCrosshairMove(param=>{cancelAnimationFrame(frame.current);if(!param.time||!param.point){setTooltip(null);return;}
   const time=typeof param.time==='string'?param.time:typeof param.time==='object'?`${param.time.year}-${String(param.time.month).padStart(2,'0')}-${String(param.time.day).padStart(2,'0')}`:'';
   const rows=current.current.bars||[],index=rows.findIndex(b=>b.time===time);if(index<0){setTooltip(null);return;}
   const point=param.point;frame.current=requestAnimationFrame(()=>setTooltip({bar:rows[index],index,x:point.x,y:point.y}));
  });
  const observer=new MutationObserver(()=>{const p=colors();c.applyOptions({layout:{background:{type:ColorType.Solid,color:p.background},textColor:p.text,panes:{separatorColor:p.line}},grid:{horzLines:{color:p.line}},timeScale:{borderColor:p.line},rightPriceScale:{borderColor:p.line}});candle.current?.applyOptions({upColor:p.up,downColor:p.down,wickUpColor:p.up,wickDownColor:p.down});const d=financialData(current.current);volume.current?.setData(d.volume.map(r=>'value'in r?{...r,color:r.color==='var(--up)'?p.up:p.down}:r));});
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  return()=>{const visible=c.timeScale().getVisibleRange(),from=timeKey(visible?.from),to=timeKey(visible?.to);if(lastIdentity.current&&from&&to)rememberView(lastIdentity.current,{range:{from,to}});cancelAnimationFrame(frame.current);observer.disconnect();c.remove();chart.current=null;candle.current=null;volume.current=null;lines.current=[];lastIdentity.current='';};
 },[compact]);
 useEffect(()=>{try{const c=chart.current;if(!c||!candle.current||!volume.current)return;const p=colors(),identity=[payload.code,payload.period,payload.adjustment].join(':');
  const viewport=c.timeScale().getVisibleLogicalRange(),timeViewport=c.timeScale().getVisibleRange();candle.current.setData(data.candles);volume.current.setData(data.volume.map(r=>'value'in r?{...r,color:r.color==='var(--up)'?p.up:p.down}:r));MA_WINDOWS.forEach((n,i)=>lines.current[i]?.setData(data.ma[n]));
  if(lastIdentity.current!==identity){const saved=views.get(identity)?.range,first=timeKey(data.candles[0]?.time),last=timeKey(data.candles.at(-1)?.time);if(saved&&first&&last&&saved.to>=first&&saved.from<=last)c.timeScale().setVisibleRange({from:saved.from<first?first:saved.from,to:saved.to>last?last:saved.to});else c.timeScale().setVisibleLogicalRange({from:Math.max(0,data.candles.length-90),to:data.candles.length+3});setTooltip(null);}else if(timeViewport)c.timeScale().setVisibleRange(timeViewport);else if(viewport)c.timeScale().setVisibleLogicalRange(viewport);
  lastIdentity.current=identity;
 }catch(e){setFailure(e as Error);}},[data,payload.code,payload.period,payload.adjustment]);
 useEffect(()=>{rememberView(identityOf(payload),{enabled});MA_WINDOWS.forEach((n,i)=>lines.current[i]?.applyOptions({visible:enabled.includes(n)}));},[enabled,payload.code,payload.period,payload.adjustment]);
 if(failure)throw failure;
 return <div className="financial-chart"><div className="financial-chart-toolbar"><div role="group" aria-label="均线显示">{MA_WINDOWS.map((n,i)=><button key={n} aria-label={'MA'+n} aria-pressed={enabled.includes(n)} style={{color:maColors[i]}} onClick={()=>setEnabled(old=>old.includes(n)?old.filter(v=>v!==n):[...old,n])}>MA{n}<span className="ma-legend-value">{number(tooltip?data.ma[n][tooltip.index]?.value:data.ma[n].at(-1)?.value)}</span></button>)}</div><button onClick={()=>{chart.current?.timeScale().fitContent();setYear('');setNavigationNote('已展示全部已加载K线，不代表全部上市历史。');}}>全部已加载</button><button onClick={()=>navigate('latest')}>最近90根</button>{compact&&<div className="battle-chart-zoom"><button type="button" aria-label="放大K线" onClick={()=>navigate('in')}><ZoomIn size={15}/></button><button type="button" aria-label="缩小K线" onClick={()=>navigate('out')}><ZoomOut size={15}/></button></div>}</div>
 {!compact&&<div className="chart-navigation" role="group" aria-label="K线快捷导航"><div className="chart-navigation-buttons"><button type="button" className="outline-button" onClick={()=>navigate('first')}>最早已加载</button><button type="button" className="outline-button" onClick={()=>navigate('previous')}><ChevronLeft size={15}/>向前一屏</button><button type="button" className="outline-button" onClick={()=>navigate('next')}>向后一屏<ChevronRight size={15}/></button><button type="button" className="outline-button" aria-label="放大K线" onClick={()=>navigate('in')}><ZoomIn size={15}/>放大</button><button type="button" className="outline-button" aria-label="缩小K线" onClick={()=>navigate('out')}><ZoomOut size={15}/>缩小</button></div><div className="chart-navigation-location"><label>已加载年份<select aria-label="定位K线年份" value={year} onChange={e=>locateYear(e.target.value)}><option value="">选择年份</option>{years.map(y=><option key={y} value={y}>{y}年</option>)}</select></label><form aria-label="K线日期定位" onSubmit={e=>{e.preventDefault();locateDate();}}><label>日期定位<input type="date" required aria-label="定位K线日期" value={targetDate} onChange={e=>setTargetDate(e.target.value)}/></label><button type="submit" className="outline-button" disabled={!validDate(targetDate)}>定位日期</button></form></div></div>}
 <p role="status" className="provenance chart-navigation-note">{navigationNote||(compact?'滚轮滚动页面 · 拖动图表平移 · 按钮缩放':'年份与日期定位只使用已加载K线；更早记录请先加载历史。')}</p><div className="financial-chart-canvas" ref={node} role="img" tabIndex={0} onKeyDown={e=>{const action=({ArrowLeft:'previous',ArrowRight:'next','+':'in','=':'in','-':'out',Home:'first',End:'latest'} as const)[e.key];if(action&&!e.altKey&&!e.ctrlKey&&!e.metaKey){e.preventDefault();navigate(action);}}} aria-label={payload.code+'真实K线及成交量，支持十字光标、拖动和缩放'} style={{height:compact?260:400}}/>{tooltip&&<output className="financial-tooltip" style={{left:tooltip.x>220?12:'auto',right:tooltip.x>220?'auto':12,top:50}}><strong>{tooltip.bar.time}</strong>{[['开盘',tooltip.bar.open],['最高',tooltip.bar.high],['最低',tooltip.bar.low],['收盘',tooltip.bar.close],['成交量',tooltip.bar.volume]].map(([label,value])=><div key={label}><span>{label}</span><b>{number(value,label==='成交量'?0:2)}{label==='成交量'?' '+payload.volumeUnit:''}</b></div>)}{MA_WINDOWS.filter(n=>enabled.includes(n)).map(n=><div key={n}><span>MA{n}</span><b>{number(data.ma[n][tooltip.index]?.value)}</b></div>)}</output>}<p className="provenance">历史覆盖 {payload.bars?.[0]?.time||'未提供'} 至 {payload.bars?.at(-1)?.time||'未提供'} · {data.candles.length} 根。{!compact&&<>左端为当前数据源已返回的边界，不代表上市首日；没有更早数据时不延伸空白行情。图表聚焦后可用左右方向键翻页、+ / −缩放、Home回到最早、End回到最近。</>}</p><ChartCredits/></div>;
});
