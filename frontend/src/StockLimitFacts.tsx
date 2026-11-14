import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {publicQuery,number} from './api';
import {Widget} from './components';
export default function StockLimitFacts({code}:{code:string}){
 const query=useQuery(publicQuery('/api/data/free?view=watch',300000)),pool=query.data?.lu,row=pool?.ladder?.find(r=>r.code===code);
 return <Widget title="涨停结构与封板记录" subtitle={'统计日期 '+(pool?.date||'未提供')+' · 不是当前报价或监管结论'} loading={query.isPending} error={query.error?.message} retry={()=>query.refetch()} refreshing={query.isFetching&&!query.isPending}>{row?<><dl className="quote-quick-facts">{[['连续板数',Number.isInteger(row.n)?'连续'+row.n+'板':'未提供'],['区间结构',row.stat||'未提供'],['首封时间',row.first||'未提供'],['最后封板',row.last||'未提供'],['源开板次数',Number.isInteger(row.brk)?row.brk+'次':'未提供'],['封单（亿元）',number(row.seal_yi)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{row.reason&&<p className="provenance">来源涨停原因标签：{row.reason}；不是已确认的上涨因果。</p>}</>:<p className="provenance">该统计日的涨停池中未取得本股记录，不能据此认定当日没有异动。</p>}<p className="provenance">区间多板不等于连续连板。当前抽屉尚未接入监管记录；普通急拉、封板和高连板本身不能替代交易所异常波动或重点监控认定。</p><Link className="outline-button" to={'/stock?code='+code+'&tab=catalysts'}>查看公告与风险资料</Link></Widget>;
}
