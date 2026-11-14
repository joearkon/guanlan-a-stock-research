import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Widget,RefreshButton} from './components';
import {number,publicQuery,tone} from './api';
import SmartTable from './SmartTable';
import StockLink from './StockLink';
import {beijingStamp} from './observation-shared';
import './limit-board-list.css';
const yi=(v:any)=>Number.isFinite(v)?v/10000:null;
export default function DragonTigerPanel({data,selectedDay='',code='',loading=false,error,retry,refreshing=false}:{data:any,selectedDay?:string,code?:string,loading?:boolean,error?:string,retry?:()=>void,refreshing?:boolean}){
 const [sort,setSort]=useState('net'),[count,setCount]=useState(10),valid=!!data?.date&&(!selectedDay||data.date<=selectedDay),source=valid?(data.stocks||[]):[],rows=source.filter(r=>!code||r.code===code),signed=(v:any)=>Number.isFinite(v)?(v>0?'+':'')+number(v):'—';
 const key=sort==='buy'?'buy_wan':sort==='sell'?'sell_wan':'net_buy_wan',sorted=[...rows].sort((a,b)=>Number.isFinite(a[key])?Number.isFinite(b[key])?b[key]-a[key]||a.code.localeCompare(b.code):-1:Number.isFinite(b[key])?1:0);
 return <Widget title={code?'本股龙虎榜记录':'龙虎榜 · 盘后披露'} subtitle="已发布公开记录，不是盘中实时资金或监管认定" loading={loading} error={error} retry={retry} refreshing={refreshing} actions={retry?<RefreshButton busy={refreshing} onClick={retry} label="读取已发布龙虎榜"/>:undefined}>
 {valid?<><p className="provenance">实际披露日 {data.date}{selectedDay&&data.date<selectedDay?' · 不是'+selectedDay+'当日榜；后续披露前保留原日。':''} · 已收录{source.length}条 / 来源总记录{data.total??'未提供'}条。{Number.isInteger(data.total)&&data.total>source.length?'当前为有界快照，非完整榜单。':''}</p>{data.status==='failed'&&<p className="local-error" role="status">最近采集失败，保留 {data.date} 已取得记录，不当作新日更新。</p>}<div className="board-toolbar"><label>龙虎榜排序<select value={sort} onChange={e=>{setSort(e.target.value);setCount(10);}}><option value="net">榜单净买额降序</option><option value="buy">榜单买入额降序</option><option value="sell">榜单卖出额降序</option></select></label><small>金额单位：亿元</small></div>{rows.length?<div className="dragon-tiger-table"><SmartTable headers={code?['上榜原因','买入额','卖出额','净买额']:['标的 / 代码','上榜原因','买入额','卖出额','净买额']} rows={sorted.slice(0,count).map(r=>[...(!code?[<StockLink code={r.code} name={r.name}>{r.name}<small>{r.code}</small></StockLink>]:[]),r.reason||'原因未提供',number(yi(r.buy_wan)),number(yi(r.sell_wan)),<span className={tone(yi(r.net_buy_wan))}>{signed(yi(r.net_buy_wan))}</span>])}/></div>:<p className="empty">{code?'该披露快照中未收录本股；快照可能截断或资料不足，不能据此认定没有龙虎榜记录。':'该披露快照中没有已收录记录，不将资料缺失当作市场没有上榜。'}</p>}{count<rows.length&&<button className="outline-button" onClick={()=>setCount(n=>n+10)}>再显示10条龙虎榜</button>}<p className="provenance">来源 {data.source||'东财龙虎榜已发布快照'} · 抓取 {beijingStamp(data.fetchedAt)}。同股可因不同条件多次列示，不合计重叠记录；榜单净买额不是机构净额，也不等于全市场净流入。买卖席位明细尚未接入此快照。</p><a className="outline-button" href="https://data.eastmoney.com/stock/lhb.html" target="_blank" rel="noopener noreferrer">打开龙虎榜来源站（核对披露日期）</a></>:!loading&&!error&&<p className="empty">没有可用于所选日期的龙虎榜快照；资料待披露或未覆盖，不显示为0。龙虎榜按披露日期更新，不随盘中报价刷新。</p>}
 </Widget>;
}
export function StockDragonTiger({code}:{code:string}){
 const query=useQuery(publicQuery('/api/data/member?view=dragon',900000));
 return <DragonTigerPanel code={code} data={query.data?.dragon} loading={query.isPending} refreshing={query.isFetching&&!query.isPending} error={query.error?.message} retry={()=>{void query.refetch();}}/>;
}
