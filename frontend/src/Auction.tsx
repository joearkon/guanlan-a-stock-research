import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useSearchParams} from 'react-router-dom';
import {publicQuery,number,pct,tone} from './api';
import {Widget,Segmented,RefreshButton,Skeleton} from './components';
import {auctionModel as rawAuctionModel,validQuote} from '../../web/v2/watch-model.mjs';
import SmartTable from './SmartTable';
import WatchMarketStrip from './WatchMarketStrip';
import {HandoffLink} from './observation-shared';
import './observations.css';
import './monitor.css';
import './watch-fidelity.css';
import StockQuoteDrawer from './StockQuoteDrawer';
import MonitorAlertButton from './MonitorAlertButton';
const stateName={saved:'已存档',missing:'未存档',upcoming:'待存档',skipped:'休市'};
const auctionModel=(raw:any)=>({...rawAuctionModel(raw),date:raw?.date||'',close_emotion:raw?.close_emotion});
export default function Auction(){
 const [params,setParams]=useSearchParams(),date=params.get('date')||'',q=useQuery({...publicQuery('/api/data/intraday'+(date?'?date='+encodeURIComponent(date):''),60000),placeholderData:p=>p}),a=auctionModel(q.data||{}),live=useQuery(publicQuery('/api/data/live',30000)),free=useQuery(publicQuery('/api/data/free',300000)),[scope,setScope]=useState('全部'),[selected,setSelected]=useState<any>(null),auction=a.auction,ratio=v=>v==null?'—':number(v*100)+'%',rows=(auction?.members||[]).filter(s=>scope==='全部'||scope==='首板'&&s.boards===1||scope==='连板'&&s.boards>=2),max=Math.max(1,...a.slots.map(s=>Math.abs(s.snapshot?.median||0))),close=a.close_emotion?.date===a.date?a.close_emotion:null;
 return <div className="auction-page"><div className="page-heading"><h1>竞价盘中</h1><MonitorAlertButton/><label className="auction-date">业务日期 <input aria-label="存档日期" type="date" value={date||a.date||''} onChange={e=>setParams(e.target.value?{date:e.target.value}:{})}/></label><RefreshButton busy={q.isFetching} onClick={()=>q.refetch()}/><WatchMarketStrip free={free.data} live={live.data}/></div>
 {q.error&&<p className="local-error" role="status">{q.error.message} {q.data?'保留上次存档及原日期。':''}<button onClick={()=>q.refetch()}>重试竞价存档</button></p>}
 {(!q.error||!!q.data)&&<>
 {q.isPending?<Skeleton label="六时点采样档案"/>:<div className="auction-slots" role="group" aria-label="六时点存档状态">{a.slots.map(s=><section key={s.slot} className={s.snapshot?'saved':''}><b>{s.slot}</b><small>{stateName[s.state]||'未存档'}{s.snapshot&&` · ${s.snapshot.sample} / ${s.snapshot.expected} 只`}</small></section>)}</div>}
 <div className="auction-summary"><Widget title="昨日涨停样本 · 今日竞价强弱" loading={q.isPending} refreshing={q.isFetching&&!q.isPending} actions={<small>09:25 存档</small>}>
 {auction?<><p className="provenance">{auction.prev_date} 涨停 {auction.expected} 只，取到 {auction.sample} 只 · 开盘价对昨收 · 固定竞价结果，不是当前涨幅</p><div className="auction-metrics">{[['中位数',pct(auction.median),tone(auction.median)],['均值',pct(auction.avg),tone(auction.avg)],['高开占比',ratio(auction.up_rate),''],['低开超5%',number(auction.deep_loss_5,0),'']].map(([name,value,color])=><div key={name}><small>{name}</small><b className={color}>{value}</b></div>)}</div><div className="auction-tiers">{Object.entries(auction.by_tier||{}).map(([name,t]:[string,any])=><section key={name}><h3>{name} · {t.sample}只</h3><b className={tone(t.median)}>{pct(t.median)}</b><small>高开 {ratio(t.up_rate)} · 均值 {pct(t.avg)}</small></section>)}</div>{auction.top_boards?.length>0&&<p className="auction-top">最高{auction.top_board_level}板：{auction.top_boards.map(s=>s.name+' '+pct(s.pct)).join(' · ')}</p>}</>:<p className="empty">09:25 尚无同日有效竞价存档</p>}
 </Widget></div>
 <div className="auction-path"><Widget title="今日情绪路径 · 六时点快照" loading={q.isPending} actions={<small>同一批昨日涨停样本 · 不补造缺失时点</small>}>
 <div className="auction-bars" role="img" aria-label="六个时点的昨日涨停样本中位涨幅，未来或未存档时点留空">{a.slots.map(s=>{const v=s.snapshot?.median;return <div key={s.slot}><b className={tone(v)}>{pct(v)}</b><div className="auction-bar-track">{Number.isFinite(v)&&<i data-value={v} className={v>=0?'rise':'fall'} style={{height:Math.max(3,Math.abs(v)/max*36)}}/>}</div><small>{s.slot}</small></div>;})}</div>
 <SmartTable headers={['时点','中位','均值','高开/红盘','跌超5%','样本','涨停','炸板','跌停']} rows={a.slots.map(s=>{const x=s.snapshot,m=x?.market;return [s.slot,<span className={tone(x?.median)}>{pct(x?.median)}</span>,pct(x?.avg),ratio(x?.up_rate),number(x?.deep_loss_5,0),x?`${x.sample}/${x.expected}`:stateName[s.state]||'未存档',m?.limit_up??'—',m?.broken??'—',m?.limit_down??'—'];})}/>
 <p className="provenance">实际存档日期 {a.date||'未覆盖'} · {q.data?.source||'时点采样档案'}。涨停 / 炸板为腾讯行情价位推算；未提供的跌停统计保持空白。{auction?.members?.length?'逐股数据按原存档展示。':'当天旧存档仅含汇总，逐股竞价不以当前价回填。'}</p>
 {close&&<div className="auction-close"><b>15:00 收盘统计</b><span>涨停 {close.zt??'—'}</span><span>炸板 {close.zb??'—'}</span><span>跌停 {close.dt??'—'}</span><span>最高 {close.max_n??'—'}板</span></div>}
 </Widget></div>
 <Widget title="昨日涨停样本 · 逐股竞价明细" loading={q.isPending} actions={<Segmented label="竞价板位" value={scope} onChange={setScope} options={[["全部","全部"],["首板","首板"],["连板","连板"]]}/>}><SmartTable headers={['标的','昨板数','竞价价','竞价涨幅','当前涨幅','原报价时间']} rows={rows.map(s=>[<button className="text-button" onClick={()=>setSelected(s)}>{s.name}<small>{s.code}</small></button>,s.boards,number(s.price),<span className={tone(s.pct)}>{pct(s.pct)}</span>,pct(validQuote(live.data||{},live.data?.quotes?.[s.code])?.pct),s.time||'未提供'])}/></Widget>
 </>}
 <StockQuoteDrawer stock={selected} onClose={()=>setSelected(null)}/>{a.date&&<HandoffLink page="竞价盘中" asof={a.date} returnTo={'/next/auction?date='+a.date} question={'请核验 '+a.date+' 竞价样本与后续时点的变化，区分09:25固定结果、后续采样和缺失覆盖。'}>就存档问观澜</HandoffLink>}</div>;
}
