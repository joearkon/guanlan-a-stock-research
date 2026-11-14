import {lazy,Suspense,useMemo,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {publicQuery,number} from './api';
import {PanelBoundary,Segmented,Skeleton} from './components';
import {financialData} from './financial-data';
const FinancialChart=lazy(()=>import('./FinancialChart'));

export default function BattleChart({code,name,asset,assetKind='stock',through,initialPeriod='day',initialAdjust='qfq'}:{code:string;name:string;asset:'index'|'security';assetKind?:'stock'|'etf';through?:string;initialPeriod?:'day'|'week'|'month';initialAdjust?:'qfq'|'hfq'|'none'}){
 const [period,setPeriod]=useState(initialPeriod),adjust=asset==='index'?'none':initialAdjust;
 const url=asset==='index'?`/api/v2/chart?code=${code}&asset=index&period=${period}&adjust=none&through=${through}`:`/api/v2/chart?code=${code}&period=${period}&adjust=${adjust}`;
 const q=useQuery({...publicQuery(url,300000),enabled:asset!=='index'||!!through,refetchInterval:false}),d=q.data;
 const issue=useMemo(()=>{
  if(!d)return '';
  if(d.code!==code||d.asset!==asset||d.period!==period||d.adjustment!==adjust)return '返回图表的对象或周期不一致，未展示该批资料。';
  if(!Array.isArray(d.bars)||!d.bars.length)return '未取得完整K线，不绘制示意行情。';
  try{financialData(d);if(asset==='index'&&d.bars.some((b:any)=>b.time>through!))throw Error('超出快照日期');}catch{return '未取得完整K线，不绘制示意行情。';}
  return '';
 },[d,code,asset,period,adjust,through]);
 const valid=!!d&&!issue,last=valid?d.bars.at(-1):null;
 return <section className="battle-chart" aria-label={name+'K线'}>
  <div className="battle-chart-toolbar"><strong>{name}<small>{code} · {{none:'不复权',qfq:'前复权',hfq:'后复权'}[adjust]}</small></strong><Segmented label={name+'K线周期'} value={period} onChange={v=>setPeriod(v as typeof period)} options={[["day","日线"],["week","周线"],["month","月线"]]}/></div>
  {q.error&&<div className="battle-panel-error" role="status">K线读取失败，已有图表与原日期保留。<button type="button" onClick={()=>q.refetch()}>重试K线</button></div>}
  {q.isPending&&(asset==='security'||through)?<Skeleton label={name+'K线'} kind="chart"/>:issue?<p className="empty">{issue}</p>:!through&&asset==='index'?<p className="empty">等待共享快照日期后读取指数K线。</p>:null}
  {valid&&<><div className="battle-chart-ohlc"><time>{last.time}</time><span>开 {number(last.open)}</span><span>高 {number(last.high)}</span><span>低 {number(last.low)}</span><span>收 {number(last.close)}</span></div><PanelBoundary key={code+period+adjust} title={name+'K线'}><Suspense fallback={<Skeleton label="K线引擎" kind="chart"/>}><FinancialChart compact payload={d}/></Suspense></PanelBoundary></>}
  <div className="battle-chart-footer"><span>{valid?`${d.source||'来源未提供'} · K线截至 ${last.time}`:'仅使用完整开高低收数据'}{q.isFetching&&!q.isPending?' · 检查中':''}{d?.warning?' · '+d.warning:''}</span><button type="button" disabled={q.isFetching||asset==='index'&&!through} onClick={()=>q.refetch()}>刷新K线</button>{asset==='security'&&assetKind==='stock'&&<Link to={'/stock?code='+code+'&tab=market'}>完整行情</Link>}</div>
 </section>;
}
