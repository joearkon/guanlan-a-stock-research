import {useQuery} from '@tanstack/react-query';import {Link} from 'react-router-dom';
import {publicQuery,pct} from './api';import {Widget} from './components';import SmartTable from './SmartTable';
import {conceptDisplayKind} from '../../web/v2/theme-support.mjs';
import {useMarketReadInterval} from './market-polling';
export default function HotThemeSupport({calendar}:{calendar?:any}={}){
 const interval=useMarketReadInterval(60000,calendar),q=useQuery({...publicQuery('/api/data/theme-observation?provider=auto&view=hot&direction=rise&limit=10',60000),refetchInterval:interval}),d=q.data;
 const rows=(d?.boards||[]).filter(b=>b.collective?.rise?.daily?.supported&&conceptDisplayKind(b.name)==='theme').slice(0,10);
 return <Widget title="异动题材 · 梯队支撑前十" subtitle={(d?.day||'日期待核验')+' · 来源 '+({ths:'同花顺概念',dc:'东财概念',sina:'新浪概念',sw:'三级主行业与概念关联'}[d?.provider]||'待核验')+' · 当日快照候选，不是推荐'} loading={q.isPending} refreshing={q.isFetching&&!q.isPending} error={q.error?.message} retry={()=>q.refetch()} actions={<Link to="/relay">查看全部题材 →</Link>}>
 <p className="provenance">与异动接力共享同一批细分榜单和全量成员证据，非涨幅前十。报价 {d?.quoteCollectedAt?new Date(d.quoteCollectedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未取得'} · {d?.closed?'收盘快照，非实时':'分钟采样'}。代表展示数量不参与判定。</p>
 {rows.length>0&&<SmartTable headers={['题材 / 代表股','支撑证据','整体强弱（原规则）']} rows={rows.map(b=>[<Link to={'/relay?'+new URLSearchParams({provider:d.provider,board:b.code,...(d.id?{model:d.id}:{})})}>{b.name}{b.taxonomy?.relatedConcepts?.length>0&&<small style={{display:'block'}}>概念关联：{b.taxonomy.relatedConcepts.slice(0,3).map(s=>s.name).join('、')}</small>}</Link>,<span>{b.collective.rise.daily.strongCount} / {b.collective.quality.covered} 同向强股<small style={{display:'block'}}>支撑 {pct(b.collective.rise.daily.memberRatio*100)} · 成交核心候选 {b.collective.rise.daily.coreCount}</small></span>,'整体'+b.signal])}/>}
 {!q.isPending&&!rows.length&&<p className="empty">当前没有达到梯队支撑条件的题材，或证据尚未取得；不以孤立上涨股票补足前十。</p>}
 </Widget>;
}
