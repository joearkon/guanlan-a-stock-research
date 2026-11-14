import {useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {publicQuery} from './api';
import {Widget} from './components';
import {safeSource} from './urls';
import BoardDetailsDrawer,{type BoardTarget} from './BoardDetailsDrawer';
const stamp=(v:any)=>v?new Date(v).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})+' 北京时间':'未提供';
export default function StockAssociations({code}:{code:string}){
 const [selected,setSelected]=useState<BoardTarget|null>(null);
 const client=useQueryClient(),key=['resource','/api/research/stock/associations?code='+code];
 const q=useQuery({...publicQuery('/api/research/stock/associations?code='+code,300000),refetchInterval:query=>query.state.dataUpdateCount<12&&(query.state.data?.status==='pending'||query.state.data?.catalogStatus==='pending')?5000:false}),d=q.data,items=d?.items||[],waiting=d?.status==='pending',expired=waiting&&(client.getQueryState(key)?.dataUpdateCount||0)>=12;
 return <><Widget title="概念与其他归属" subtitle="按需加载个股关联，分类目录由全站共享；点击板块查看详情" loading={q.isPending} refreshing={q.isFetching&&!q.isPending} error={q.error?.message||d?.error||(expired?'来源仍未返回，可单独重试':undefined)} retry={()=>q.refetch()}>
  {['concept','industry','unverified'].map(kind=>{const rows=items.filter(x=>x.kind===kind);return rows.length?<section key={kind}><h3>{kind==='concept'?'概念板块':kind==='industry'?'来源行业标签 · 不等于申万分类':'其他关联 · 类型待核验'}</h3><div className="home-shortcuts">{rows.map(x=><button type="button" className="fact-chip board-association-trigger" aria-label={'查看'+x.name+'板块详情'} key={x.code} onClick={()=>setSelected({code:x.code,name:x.name,provider:x.provider||(/^BK\d+$/.test(x.code)?'dc':/^SW\d+$/.test(x.code)?'sw':/^gn_/.test(x.code)?'sina':'ths'),unverified:kind==='unverified'})}>{x.name} <small>{x.code}{x.source?' · '+x.source:''}</small>{x.fetchedAt&&<small style={{display:'block'}}>采集 {stamp(x.fetchedAt)}{x.catalogCountMatch===false?' · 目录人数不一致，成员分页完整':''}</small>}</button>)}</div></section>:null;})}
  {!items.length&&<p className="empty">{waiting&&!expired?'正在独立读取个股关联，不影响其他资料。':'当前来源未取得已核验关联；不代表该股没有概念归属。'}</p>}
  {d?.status==='stale'&&<p role="status" className="provenance">当前为已存关联，来源尚未更新；请核对采集时间。</p>}
  {d?.catalogStatus&&d.catalogStatus!=='ok'&&<p className="provenance">行业/概念分类目录{d.catalogStatus==='pending'?'正在后台加载':'未完成本轮核验'}；未知类型不会根据名称猜测。</p>}
  {items.some(x=>x.source==='新浪概念成分')&&<p className="provenance">新浪补充仅核验同名候选的完整成分中是否包含当前证券；不是全量概念列表，也不把新浪分类套给东财 BK 编码。</p>}<p className="provenance">个股关联采集 {stamp(d?.fetchedAt)}；分类目录采集 {stamp(d?.catalogFetchedAt)}。来源未提供归属生效日期；不显示无日期的涨幅或领涨股。{safeSource(d?.sourceUrl)&&<> <a href={safeSource(d.sourceUrl)!} target="_blank" rel="noopener noreferrer">核验来源</a></>}</p>{d?.catalogSource&&<p className="provenance">分类依据 {d.catalogSource} · 目录业务日期 {d.catalogDataDate||'来源未提供'}。目录日期不是个股归属生效日期。{safeSource(d.catalogSourceUrl)&&<a href={safeSource(d.catalogSourceUrl)!} target="_blank" rel="noopener noreferrer">分类来源</a>}</p>}
 </Widget><BoardDetailsDrawer board={selected} onClose={()=>setSelected(null)}/></>;
}
