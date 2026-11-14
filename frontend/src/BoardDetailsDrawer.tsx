import {useRef,useState} from 'react';
import {useQuery,keepPreviousData} from '@tanstack/react-query';
import {Drawer,Widget,Segmented} from './components';
import {getJSON,number,pct,tone} from './api';
import StockLink,{useOpenStock} from './StockLink';
import './board-details.css';
export type BoardTarget={provider:string;code:string;name:string;mode?:'close'|'live';model?:string;unverified?:boolean};
export const boardSourceNames:Record<string,string>={sw:'申万行业',ths:'同花顺概念',dc:'东财板块',sina:'新浪概念'};
export default function BoardDetailsDrawer({board,onClose}:{board:BoardTarget|null;onClose:()=>void}){
 return <Drawer open={!!board} onOpenChange={open=>!open&&onClose()} title={(board?.name||'板块')+' · 板块详情'} className="board-details-drawer">{board&&<BoardWorkspace key={[board.provider,board.code,board.mode,board.model].join(':')} board={board} onClose={onClose}/>}</Drawer>;
}
function BoardWorkspace({board,onClose}:{board:BoardTarget;onClose:()=>void}){
 const [offset,setOffset]=useState(0),[model,setModel]=useState(board.model||''),[result,setResult]=useState('matched'),[sort,setSort]=useState('pct'),openStock=useOpenStock();
 const url='/api/data/stock-observation?'+new URLSearchParams({detail:'1',mode:board.mode||'close',groupProvider:board.provider,groupCode:board.code,excludeST:'0',limit:'10',offset:String(offset),result,sort,...(model?{model}:{})});
 const q=useQuery({queryKey:['resource',url],queryFn:({signal})=>getJSON(url,signal),placeholderData:keepPreviousData,retry:false,staleTime:60000,refetchOnWindowFocus:false}),last=useRef<any>(null);if(q.data&&!q.isPlaceholderData)last.current=q.data;const d=q.data||last.current,g=d?.group;
 function change(next:number,kind=result,order=sort){if(!d||q.isFetching)return;setModel(d.model);setOffset(next);setResult(kind);setSort(order);}
 return <div className="board-details">
  <div className="board-details-intro"><span>{boardSourceNames[board.provider]||'来源待核验'} · {board.code}</span>{board.unverified&&<p className="board-warning">原关联类型待核验；只有共享成员目录明确收录后，才显示统计，不按名称猜分类。</p>}<p className="provenance">查看成员整体表现与覆盖，不是板块受益、交易机会或后续走势判断。</p></div>
  <Widget title="板块概况" loading={q.isPending} refreshing={q.isFetching&&!q.isPending} error={q.error?((q.error as any).status===409?'共享目录尚未收录此板块或该版本已失效，无法确认成员；不代表零成员。':'板块资料读取失败，保留上次有效内容与日期。'):undefined} retry={()=>q.refetch()} actions={<button className="outline-button" disabled={q.isFetching} onClick={()=>{if(!model&&!offset)q.refetch();setModel('');setOffset(0);}}>读取最新板块快照</button>}>
   {d&&g&&<><div className="board-snapshot"><strong>{d.day} · {d.mode==='live'?'盘中快照':'盘后收盘'}{q.error||q.isPlaceholderData?' · 上次有效结果':''}</strong><span>{d.source} · 行情版本 {d.model?.slice(0,8)} · 成员版本 {d.groupsVersion?.slice(0,8)||'未提供'}</span>{d.stale&&<p className="board-warning">快照已过期，仅表示原时点，不是最新行情。</p>}</div>
    <div className="board-metrics"><article><small>成分股中位涨幅</small><strong className={tone(g.median)}>{pct(g.median)}</strong><span>非板块指数涨幅</span></article><article><small>有效行情覆盖</small><strong>{g.covered??'—'} / {g.total??g.memberCount}</strong><span>只 · 未覆盖不补零</span></article><article><small>上涨 / 下跌 / 平盘</small><strong><b className="up">{g.up??'—'}</b> / <b className="down">{g.down??'—'}</b> / {g.flat??'—'}</strong><span>仅同批有效报价</span></article><article><small>已覆盖成员成交额</small><strong>{number(g.amount)} <em>亿</em></strong><span>有成交额 {g.amountCovered??'—'} 只</span></article></div>
    <p className="provenance">成员资料 {g.fetchedAt?.slice(0,10)||'日期未提供'} · {(g.path||[]).join(' / ')||g.name}{g.status!=='complete'?' · 来源成员未完整，不代表全部股票':''}{g.retained?' · 来源更新失败，保留旧成员':''}。行业与概念独立，跨板块成交额不相加。</p>
    <div className="board-members-toolbar"><Segmented label="板块成员分类" value={result} onChange={kind=>change(0,kind)} options={[["matched",'有报价 '+d.counts.matched],["missing",'缺数据 '+d.counts.missing]]}/><label>成员排序<select value={sort} onChange={e=>change(0,result,e.target.value)}><option value="pct">涨幅降序</option><option value="amount">成交额降序</option><option value="code">代码降序</option></select></label></div>
    <div className="board-member-scroll"><table><thead><tr><th>成员 / 代码</th><th>价格</th><th>涨幅</th><th>成交额 / 亿</th></tr></thead><tbody>{d.rows.map((r:any)=><tr key={r.code}><td><StockLink code={r.code} name={r.name} onInspect={openStock?onClose:undefined}>{r.name}</StockLink><small>{r.code}</small></td><td>{number(r.price)}</td><td className={tone(r.pct)}>{pct(r.pct)}</td><td>{number(r.amount)}</td></tr>)}</tbody></table></div>
    {!d.rows.length&&<p className="empty">本批次此分类暂无成员；请核对另一分类与来源覆盖。</p>}<div className="board-pagination"><span>本类 {d.total} 只 · 每页10只</span><button className="outline-button" disabled={!offset||q.isFetching||!!q.error} onClick={()=>change(Math.max(0,offset-10))}>上一页成员</button><button className="outline-button" disabled={d.next==null||q.isFetching||!!q.error} onClick={()=>change(d.next)}>下一页成员</button></div>
    <details><summary>统计与来源说明</summary><p>涨跌广度、中位涨幅和成交额由后台对同一快照的有效成员统一计算；打开抽屉只读取结果，不逐个请求股票、不调用模型。所有来源成员（包含ST）独立列出，缺报价进入缺数据。</p><p>当前未接入该板块指数的连续历史序列，不用成员收益合成假K线。成员目录日期与行情日期分别保留，历史日期不代表成员归属生效日期。</p></details>
   </>}
  </Widget>
 </div>;
}
