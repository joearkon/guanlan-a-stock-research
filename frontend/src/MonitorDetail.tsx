import {PrivateValue} from './Privacy';
import StockLink from './StockLink';
import {lazy,Suspense} from 'react';
import {Link} from 'react-router-dom';
import {number,pct,tone} from './api';
import {Skeleton} from './components';
import StockAlertButton from './StockAlertButton';
import {HandoffLink} from './observation-shared';
const Chart=lazy(()=>import('./StockChart'));
export default function MonitorDetail({row,positions,returnTo}:{row:any,positions:boolean,returnTo:string}){
 if(!row)return <section className="monitor-selected" aria-label="所选标的详情"><p className="empty">选择一只{positions?'持仓':'自选'}标的查看真实行情</p></section>;
 const facts=positions?[['持仓数量',number(row.shares,0)+' 股'],['成本价',number(row.cost)],['持仓市值',number(row.value,0)],['今日估算',number(row.dayPnl)],['浮动盈亏',number(row.floating)],['账户来源','当前账号录入']]:[['今开',number(row.open)],['最高',number(row.high)],['最低',number(row.low)],['成交额',row.amount==null?'—':number(row.amount/1e8)+'亿'],['量比',number(row.volumeRatio)],['换手率',pct(row.turn)]];
 return <section className="monitor-selected" aria-label="所选标的详情"><header><h2><StockLink code={row.code} name={row.name}/></h2><StockLink code={row.code} name={row.name}>{row.code}</StockLink><span>{positions?'持仓标的':'自选标的'}</span></header><div className="monitor-selected-tags"><span>{row.category||'未分组'}</span><span>{row.kind==='etf'?'ETF':'A股'}</span></div><div className={'monitor-selected-price '+tone(row.pct)}><strong>{number(row.price)}</strong><b>{pct(row.pct)}</b></div><p className="provenance">{row.asof||'日期待核验'} · {row.time||'未覆盖'} · {row.reason||row.source}{row.detailReason?' · '+row.detailReason:''}</p><Suspense fallback={<Skeleton label="独立行情图表" kind="chart"/>}><Chart code={row.code} name={row.name}/></Suspense><dl className="monitor-selected-facts">{facts.map(([name,value])=><div key={name}><dt>{name}</dt><dd>{positions&&name!=='账户来源'?<PrivateValue>{value}</PrivateValue>:value}</dd></div>)}</dl><p className="provenance">{positions?row.dayReason:'自选只表达关注，采样异动不是买卖信号。'}</p><div className="monitor-selected-actions"><Link className="primary" to={'/stock?code='+row.code+'&returnTo='+encodeURIComponent(returnTo)}>研究这只股票 →</Link><HandoffLink question={'请核验 '+row.name+' '+row.code+' 在 '+row.asof+' 的量价事实、风险和待验证条件。'} page="实时动态" asof={row.asof} returnTo={returnTo}>带标的与时点问观澜</HandoffLink><StockAlertButton code={row.code}/></div></section>;
}
