import {useState,useEffect,lazy,Suspense} from 'react';
import {sessionStore} from './session-store';
import {useQuery} from '@tanstack/react-query';
import {Link,useLocation} from 'react-router-dom';
import {publicQuery,number,pct,tone} from './api';
import {Widget,Segmented,RefreshButton,Skeleton} from './components';
import {safeResearchReturn} from './research-return';
import {rangeFacts} from './range-facts';
import SmartTable from './SmartTable';
import {volumeFacts} from '../../web/v2/portfolio-workspace.mjs';
export {average,financialData} from './financial-data';
const FinancialChart=lazy(()=>import('./HistoricalCandles'));
export default function Kline({code,name,from='watchlist',quote}:{code:string,name:string,from?:string,quote?:any}){
 const location=useLocation(),returnTo=safeResearchReturn(location.pathname+location.search+location.hash);
 const settingsKey='guanlan.chart.controls:'+(['watchlist','holdings','portfolio-review'].includes(from)?from:'stock');
 const [settings]=useState(()=>{try{return JSON.parse(sessionStore.getItem(settingsKey)||'{}');}catch{return {};}});
 const [period,setPeriod]=useState(['day','week','month'].includes(settings?.period)?settings.period:'day'),[adjust,setAdjust]=useState(['qfq','hfq','none'].includes(settings?.adjust)?settings.adjust:'qfq');
 useEffect(()=>{sessionStore.setItem(settingsKey,JSON.stringify({period,adjust}));},[settingsKey,period,adjust]);
 const query=useQuery({...publicQuery(`/api/v2/chart?code=${code}&period=${period}&adjust=${adjust}`,300000),retry:false});
 const daily=useQuery({...publicQuery(`/api/v2/chart?code=${code}&period=day&adjust=${adjust}`,300000),enabled:period!=='day',retry:false});
 const day=period==='day'?query.data:daily.data,date=day?.asof;
 const facts=useQuery({...publicQuery(`/api/v2/portfolio-facts?code=${code}&date=${date}`,300000),enabled:!!date,refetchInterval:q=>q.state.data?.status==='pending'?5000:false});
 const last=query.data?.bars?.at(-1),previous=query.data?.bars?.at(-2),change=previous?.close>0?(last.close/previous.close-1)*100:null;
 const vf=volumeFacts(day||{}, quote?.code===code&&quote?.asof===date?quote:{},facts.data||{});
 return <><Widget title={'走势　'+name+'　'+code} loading={query.isPending} refreshing={query.isFetching&&!query.isPending} error={query.error?((query.error as any).status===503?'本周期K线暂未取得，可单独重试或切换周期；不会自动连续重试。':query.error.message):undefined} retry={()=>query.refetch()} subtitle="K线、均线与成交量 · 只更新当前图表" actions={<><Segmented label="K线周期" value={period} options={[["day","日线"],["week","周线"],["month","月线"]]} onChange={setPeriod}/><Segmented label="复权方式" value={adjust} options={[["qfq","前复权"],["hfq","后复权"],["none","不复权"]]} onChange={setAdjust}/><RefreshButton busy={query.isFetching} onClick={()=>query.refetch()} label="刷新K线"/></>}>
 {last&&<div className="ohlc"><time>{last.time}</time><span>收盘 <b className={tone(change)}>{number(last.close)}</b></span><span className={tone(change)}>{pct(change)}</span><span>开 {number(last.open)}</span><span>高 {number(last.high)}</span><span>低 {number(last.low)}</span><span>量 {number(last.volume,0)} {query.data.volumeUnit}</span><Link className="ml-auto accent" to={'/stock?code='+code+'&from='+from+(returnTo?'&returnTo='+encodeURIComponent(returnTo):'')}>个股档案 →</Link></div>}
 {query.data?.bars?.length?<Suspense fallback={<Skeleton label="K线引擎" kind="chart"/>}><FinancialChart key={code+period+adjust} payload={query.data}/></Suspense>:!query.isPending&&!query.error&&<p className="empty">当前周期暂无完整K线，不绘制示意行情。</p>}
 {query.data&&<p className="provenance">{query.data.asof} · {query.data.source} · {query.data.adjust}{query.data.warning?' · '+query.data.warning:''}{query.data.cacheWarning?' · '+query.data.cacheWarning:''}。拖动平移、滚轮或双指缩放；双击价格轴复位。价格与成交量共用时间轴。</p>}</Widget>
 <Widget title="量价快照" loading={false} refreshing={facts.isFetching} error={facts.error?.message} retry={()=>facts.refetch()}><div className="snapshot"><div><small>量比</small><strong>{vf.volumeRatio==null?'—':number(vf.volumeRatio)+'x'}</strong></div><span className="fact-chip">{vf.combination}</span><div><small>5 / 20日均量</small><strong>{vf.volume520==null?'—':number(vf.volume520)+'x'}</strong></div><div><small>换手分位 · 120日</small><strong>{facts.isPending?'补取中':vf.turnoverPercentile==null?'未覆盖':number(vf.turnoverPercentile)+'%'}</strong></div><div><small>日 VWAP 偏离</small><strong>{facts.isPending?'补取中':pct(vf.vwapDeviation)}</strong></div><div><small>日 VWAP</small><strong>{facts.data?.code===code&&facts.data?.asof===date?number(facts.data?.vwap):'—'}</strong></div></div><p className="provenance">仅描述事实，不给出强弱裁决；日VWAP用同日未复权成交额与成交股数计算，换手分位要求120个有效样本。</p></Widget><Widget title="区间行情事实" loading={period!=='day'&&daily.isPending} error={period!=='day'?daily.error?.message:undefined} retry={()=>daily.refetch()}><SmartTable headers={['区间','个股收益','区间振幅','上涨 / 下跌日','放量 / 缩量日']} rows={rangeFacts(day).map(r=>[r.days+'日',r.covered?pct(r.returnPct):'样本不足',r.covered?pct(r.amplitude):'—',r.covered?r.up+' / '+r.down:'—',r.covered&&r.volumeUp!=null?r.volumeUp+' / '+r.volumeDown:'未覆盖'])}/><p className="provenance">按日线的3/10/30个交易间隔计算，需另有前一日收盘作为基准；振幅为区间最高价÷最低价−1。日线截至 {date||'未提供'}。行业与沪深300缺同日期、同复权序列时不估算相对收益。</p></Widget></>;
}
