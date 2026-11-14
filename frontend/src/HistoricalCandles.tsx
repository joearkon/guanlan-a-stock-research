import {useMemo} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {getJSON} from './api';
import FinancialChart from './FinancialChart';
import {mergeHistory} from './chart-history';
export default function HistoricalCandles({payload}:{payload:any}){
 const base=`/api/v2/chart?code=${payload.code}&period=${payload.period}&adjust=${payload.adjustment||'qfq'}`,first=payload.bars?.[0]?.time;
 const history=useInfiniteQuery({queryKey:['resource',base+'&history-basis='+payload.asof+'&first='+first],enabled:false,initialPageParam:first,queryFn:({pageParam,signal})=>getJSON(base+'&before='+pageParam,signal),getNextPageParam:last=>last.window?.start>'1990-12-19'?last.window.start:undefined,staleTime:300000});
 const merged=useMemo(()=>mergeHistory(payload,history.data?.pages||[]),[payload,history.data]),last=history.data?.pages.at(-1);
 return <><div className="stock-chart-controls"><button className="outline-button" disabled={history.isFetching||!first||first<='1990-12-19'||!!last&&!history.hasNextPage} onClick={()=>history.fetchNextPage()}>{history.isFetching?'正在补取更早历史…':history.error?'重试更早历史':'加载更早历史'}</button><small className="provenance">按需分段加载，当前 {merged.bars.length} 根；不会重载列表。</small></div>{last?.bars?.length>0&&<p className="provenance">已补入 {last.bars[0].time} 至 {last.bars.at(-1).time}；为保留阅读位置，视野没有自动跳转。点击「最早已加载」或选择年份查看。</p>}{history.error&&<p role="status" className="local-error">更早历史暂未取得，现有图表保留。{history.error.message}</p>}{last?.bars?.length===0&&<p role="status" className="provenance">{last.window.start} 至 {last.window.end} 未返回记录；可能尚未上市或停牌，不据此断言已取得全部历史，可继续检查更早窗口。</p>}<FinancialChart payload={merged}/></>;
}
