import {useState} from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {getJSON,number,pct,retryRead} from './api';
import {Widget,Drawer} from './components';
import StockLink from './StockLink';
export const transitionLabel:Record<string,string>={enter:'进入支撑',exit:'退出支撑',strengthen:'支撑增强',weaken:'支撑减弱',window_enter:'窗口共振出现',window_exit:'窗口共振结束',data_gap:'数据缺口',restored:'数据恢复'};
const stamp=(s:string)=>/^\d{14}$/.test(s||'')?s.slice(8,10)+':'+s.slice(10,12)+':'+s.slice(12):s||'未提供';
export default function FundingTimeline({model,board='',direction='all',onClear}:{model:any;board?:string;direction?:string;onClear?:()=>void}){
 const [selected,setSelected]=useState<any>(null);
 const url='/api/data/theme-observation?'+new URLSearchParams({provider:model.provider,timeline:'1',day:model.day,until:model.asof,board,direction,limit:'20'});
 const q=useInfiniteQuery({queryKey:['resource',url],initialPageParam:'',queryFn:({pageParam,signal})=>getJSON(url+(pageParam?'&cursor='+encodeURIComponent(pageParam):''),signal),getNextPageParam:(p:any)=>p.nextCursor||undefined,staleTime:Infinity,refetchOnWindowFocus:false,retry:retryRead(1)});
 const pages=q.data?.pages||[],valid=pages.every(p=>p.provider===model.provider&&p.day===model.day&&p.until===model.asof),events=valid?[...new Map(pages.flatMap(p=>p.events||[]).map(e=>[e.id,e])).values()] as any[]:[];
 return <><Widget title="变化时间线" subtitle={model.day+' · 截至 '+stamp(model.asof)+'，只读后台留存，不按当前结果重写历史'} loading={q.isPending} error={q.error?.message} retry={()=>q.refetch()} actions={board&&<button className="outline-button" onClick={onClear}>查看全部方向</button>}>
 <p className="provenance">进入或退出表示支撑条件变化，不等于真实资金流入或流出。数据缺口单列，不判作退潮。</p>
 {!valid&&<p role="alert">时间线批次不一致，已阻止混入其他日期。</p>}
 <ol className="funding-timeline">{events.map(e=><li key={e.id}><time>{stamp(e.asof)}</time><button type="button" className="funding-transition" onClick={()=>setSelected(e)}><strong>{e.name||e.code}</strong><span className={e.direction==='fall'?'down':'up'}>{e.direction==='fall'?'向下':'向上'} · {transitionLabel[e.kind]||e.kind}</span><small>查看当时证据</small></button></li>)}</ol>
 {!q.isPending&&valid&&!events.length&&<p className="empty">此范围没有已留存的变化记录，不代表没有变化；不补造采集前历史。</p>}
 {q.hasNextPage&&<button className="outline-button" disabled={q.isFetchingNextPage} onClick={()=>q.fetchNextPage()}>继续显示20条变化</button>}
 </Widget><Drawer open={!!selected} onOpenChange={v=>!v&&setSelected(null)} title="当时的支撑证据" className="funding-evidence-drawer">{selected&&<><h3>{selected.name||selected.code} · {transitionLabel[selected.kind]||selected.kind}</h3><p>{model.day} {stamp(selected.asof)} · {selected.direction==='fall'?'向下':'向上'}</p><p>同向强股 {selected.daily?.strongCount??'未覆盖'} · 支撑比例 {selected.daily?.memberRatio==null?'未覆盖':number(selected.daily.memberRatio*100,1)+'%'} · 成交核心候选 {selected.daily?.coreCount??'未覆盖'}</p><p>窗口成员 {selected.window?.memberCount??'未覆盖'} · {selected.window?.confirmed?'共振已核验':'不确认窗口共振'}</p><p>窗口中位变化 {pct(selected.window?.medianChange)}</p><div className="funding-evidence-stocks">{(selected.daily?.strongCodes||[]).map(code=><StockLink key={code} code={code} name={code}/>)}</div><p className="provenance">以上是当时保存的支撑成员；行情抽屉单独标注其报价时间，不冒充事件时点报价。</p><dl><dt>成员版本</dt><dd>{selected.sourceVersion||'旧记录未保存'}</dd><dt>判断版本</dt><dd>{selected.ruleVersion||'旧记录未保存'}</dd></dl></>}</Drawer></>;
}
