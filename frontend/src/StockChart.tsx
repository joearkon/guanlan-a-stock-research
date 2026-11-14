import {lazy,Suspense,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {publicQuery} from './api';
import {Widget,Segmented,Skeleton,RefreshButton} from './components';
import {useMarketReadInterval} from './market-polling';
const Intraday=lazy(()=>import('./IntradayChart')),Financial=lazy(()=>import('./HistoricalCandles'));
export default function StockChart({code,name,initial='minute'}:{code:string,name:string,initial?:string}){
 const [period,setPeriod]=useState(initial),[adjust,setAdjust]=useState('qfq'),line=period==='minute'||period==='five';
 const interval=useMarketReadInterval(60000),q=useQuery({...publicQuery(`/api/v2/chart?code=${code}&period=${period}&adjust=${line?'none':adjust}`,line?60000:300000),retry:false,refetchInterval:line?interval:false});
 const error=q.error?((q.error as any).status===503?'本周期图表暂时未取得，可重试或切换其他周期；报价与自选操作不受影响。':q.error.message):undefined;
 return <Widget title={'行情 · '+name+' '+code} loading={q.isPending} refreshing={q.isFetching&&!q.isPending} error={error} retry={()=>q.refetch()} actions={<><div className="stock-chart-controls"><Segmented label="行情周期" value={period} onChange={setPeriod} options={[["minute","分时"],["five","五日"],["day","日K"],["week","周K"],["month","月K"]]}/>{!line&&<Segmented label="行情复权" value={adjust} onChange={setAdjust} options={[["qfq","前复权"],["hfq","后复权"],["none","不复权"]]}/>}</div><RefreshButton busy={q.isFetching} onClick={()=>q.refetch()} label="刷新图表"/></>}>{q.error&&line&&!q.data&&<div className="notice-actions"><button type="button" className="outline-button" onClick={()=>setPeriod('day')}>先查看日K</button><span className="provenance">仅在你点击后读取日K，不用其他周期冒充分时。</span></div>}{q.data?.bars?.length?<Suspense fallback={<Skeleton label="行情引擎" kind="chart"/>}>{line?<Intraday key={code+period} payload={q.data}/>:<Financial key={code+period+adjust} payload={q.data}/>}</Suspense>:!q.isPending&&!q.error&&<p className="empty">当前周期暂无有效数据，不绘制示意行情。</p>}{q.data&&<p className="provenance">{q.data.asof} · {q.data.source} · {q.data.adjust} · 成交量单位：{q.data.volumeUnit}{q.data.warning?' · '+q.data.warning:''}{q.data.cacheWarning?' · '+q.data.cacheWarning:''}。行情与列表独立加载。</p>}</Widget>;
}
