import {lazy,Suspense,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {useQueryClient} from '@tanstack/react-query';
import {Drawer,Skeleton,LocalRefresh} from './components';
import {number,pct,tone} from './api';
import {useQuoteBatch} from './quote-batch';
import {useProfileActions} from './profile-actions';
import {monitorRows} from '../../web/v2/monitor-model.mjs';
import {HandoffLink} from './observation-shared';
import './stock-quote-drawer.css';
import StockLimitFacts from './StockLimitFacts';
import {StockDragonTiger} from './DragonTigerPanel';
import StockRelatedBoards from './StockRelatedBoards';
const PriceChart=lazy(()=>import('./StockChart'));
function Chart({code,name}:{code:string;name:string}){return <div className="quote-chart-and-boards"><StockRelatedBoards code={code}/><PriceChart code={code} name={name}/></div>;}
import {OfficialRuleEditor as RuleEditor}from'./OfficialServices';
type Stock={code:string,name?:string};
export default function StockQuoteDrawer({stock,onClose}:{stock:Stock|null,onClose:()=>void}){
 return <Drawer open={!!stock} onOpenChange={open=>!open&&onClose()} title={stock?(stock.name||stock.code)+' · '+stock.code:'个股行情'} className="stock-quote-drawer">{stock&&<QuoteWorkspace key={stock.code} stock={stock}/>}</Drawer>;
}
function QuoteWorkspace({stock}:{stock:Stock}){
 const client=useQueryClient(),account=useProfileActions(),location=useLocation(),[reminder,setReminder]=useState(false),[feedback,setFeedback]=useState('');
 const detail=useQuoteBatch(stock.code),base=monitorRows({scope:'watch',pool:[{kind:'stock',code:stock.code,name:stock.name}],free:client.getQueryData(['resource','/api/data/free'])||{},feed:client.getQueryData(['resource','/api/data/live'])||{}} as any)[0],q=detail.data?.quotes?.[stock.code],row=q?.price>0&&Number.isFinite(q.price)&&/^\d{4}-\d{2}-\d{2}$/.test(q.asof||'')?{...base,price:q.price,lastClose:q.prev,pct:q.prev>0?Math.round((q.price/q.prev-1)*10000)/100:null,open:q.open,high:q.high,low:q.low,amount:q.amount,turn:q.turnover,volumeRatio:q.volumeRatio,asof:q.asof,time:q.time,source:q.source,reason:'独立行情快照 · '+(q.source||'来源见回执'),detailReason:''}:base,name=stock.name||row.name||stock.code;
 const followed=account.query.data?.profile?.pool?.some(r=>(r.kind||'stock')==='stock'&&r.code===stock.code&&!r.archived),returnTo=location.pathname+location.search;
 async function toggle(){setFeedback('');try{await account.toggleAsset('stock',stock.code,name);setFeedback(followed?'已取消自选，研究记录保留':'已加入自选');}catch(e:any){setFeedback(e.message);}}
 const quoteTime=/^\d{14}$/.test(row.time||'')?row.time.slice(8,10)+':'+row.time.slice(10,12)+':'+row.time.slice(12,14):row.time||'未提供';
 return <><div className="quote-workspace"><div className="quote-main"><section className="quote-overview" aria-label="个股报价"><LocalRefresh busy={detail.isFetching} label="个股报价"><div className="quote-price"><strong className={tone(row.pct)}>{number(row.price)}</strong><b className={tone(row.pct)}>{pct(row.pct)}</b><span className="quote-market-tag">A股 · {stock.code}</span></div><p className="provenance">报价 {row.asof||'日期待核验'} {quoteTime} · {row.reason||row.source}；非逐笔实时。</p><dl className="quote-quick-facts">{[['今开',row.open],['最高',row.high],['最低',row.low],['换手率',row.turn],['量比',row.volumeRatio],['成交额（亿）',row.amount==null?null:row.amount/1e8]].map(([label,value])=><div key={String(label)}><dt>{label}</dt><dd>{label==='换手率'?pct(value):number(value)}</dd></div>)}</dl>{row.detailReason&&<p className="provenance">{row.detailReason}</p>}{detail.error&&<p className="local-error" role="status">{detail.error?.message}；保留已取得的报价和时间。<button onClick={()=>{detail.refetch();}}>重试报价</button></p>}</LocalRefresh></section><Suspense fallback={<Skeleton label="个股行情图表" kind="chart"/>}><Chart code={stock.code} name={name}/></Suspense><StockLimitFacts code={stock.code}/><StockDragonTiger code={stock.code}/></div><aside className="quote-actions" aria-label="个股操作"><h3>关注与提醒</h3><p className="provenance">操作沿用当前账号，不会自动启用提醒或执行交易。</p><button className="primary" disabled={account.query.isPending||!account.query.data||account.mutation.isPending} onClick={toggle}>{account.mutation.isPending?'正在保存…':followed?'取消自选':'加入自选'}</button>{account.query.error&&<p className="local-error">账户资料读取失败。<button onClick={()=>account.query.refetch()}>重试账户</button></p>}<button className="outline-button" onClick={()=>setReminder(true)}>设置提醒</button><Link className="outline-button" to={'/stock?code='+stock.code+'&returnTo='+encodeURIComponent(returnTo)}>进入个股档案</Link><Link className="outline-button" to={'/my-research?code='+stock.code+'&create=1'}>我的研究 · 创建档案</Link><HandoffLink page="个股行情抽屉" stock={{code:stock.code,name}} section="行情量价" asof={row.asof} returnTo={'/next'+returnTo} question={'请核验 '+name+'（'+stock.code+'）在 '+row.asof+' '+quoteTime+' 的量价事实、来源与风险，区分事实和推断。'}>带上下文问观澜</HandoffLink>{feedback&&<p className="quote-action-feedback" role="status">{feedback}</p>}<p className="provenance">自选与提醒分别保存；提醒需要明确保存并启用。打开抽屉不会调用模型。</p></aside></div><Drawer open={reminder} onOpenChange={setReminder} title="设置个股提醒"><Suspense fallback={<Skeleton label="提醒规则编辑器"/>}><RuleEditor code={stock.code} onSaved={()=>{setReminder(false);setFeedback('提醒规则已保存，是否启用以规则设置为准');}}/></Suspense></Drawer></>;
}
