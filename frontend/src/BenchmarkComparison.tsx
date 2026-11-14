import {useQuery} from '@tanstack/react-query';
import {publicQuery,pct,number,tone} from './api';
import {Widget} from './components';
import SmartTable from './SmartTable';
import {benchmarkFacts} from './range-facts';
export default function BenchmarkComparison({code}:{code:string}){
 const free=useQuery(publicQuery('/api/data/free',300000)),date=free.data?.asof,registered=free.data?.indices?.some(x=>x.code==='000300'),ready=!!date&&!!registered;
 const stock=useQuery({...publicQuery('/api/v2/chart?code='+code+'&period=day&adjust=none',300000),enabled:ready});
 const index=useQuery({...publicQuery('/api/v2/chart?code=000300&period=day&adjust=none&asset=index&through='+date,300000),enabled:ready});
 const rows=benchmarkFacts(stock.data,index.data,date);
 return <Widget title="对比沪深300" subtitle="以已发布业务日为截止 · 不复权价格涨跌，不含分红再投资" loading={free.isPending||ready&&(stock.isPending||index.isPending)} error={free.error?.message||stock.error?.message||index.error?.message} retry={()=>{void free.refetch();if(ready){void stock.refetch();void index.refetch();}}} refreshing={stock.isFetching&&!stock.isPending||index.isFetching&&!index.isPending}>
  {!free.isPending&&!registered?<p className="empty">当前已发布指数目录未登记沪深300，无法建立已核验的比较基准。</p>:<SmartTable headers={['区间','实际起止日','个股价格涨跌','沪深300涨跌','涨跌差 · 百分点']} rows={rows.map(r=>[r.days+'日',r.covered?r.from+' — '+r.through:'同日样本不足',r.covered?<span className={tone(r.stockPct)}>{pct(r.stockPct)}</span>:'—',r.covered?pct(r.indexPct):'—',r.covered?<span className={tone(r.difference)}>{number(r.difference)}</span>:'—'])}/>}
  <p className="provenance">截止 {date||'未提供'}；按指数的3/10/30个交易间隔，个股须覆盖窗口内相同日期。停牌缺日不补价，不拿最新报价替换历史。涨跌差不是复合超额收益；不复权价格受除权除息影响，不代表含分红总回报。</p>
  <p className="provenance">个股来源 {stock.data?.source||'未提供'} · 序列截至 {stock.data?.asof||'未提供'}；指数来源 {index.data?.source||'未提供'} · 序列截至 {index.data?.asof||'未提供'}。{stock.data?.warning||''} {index.data?.warning||''}</p>
 </Widget>;
}
