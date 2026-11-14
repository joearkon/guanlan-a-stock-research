import {useEffect,useState} from 'react';
import {useLocation,useNavigate,Link} from 'react-router-dom';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Search,UsersRound,Layers3} from 'lucide-react';
import {getJSON,retryRead} from './api';
import {AiAction} from './AiAction';
import SecurityAutocomplete from './SecurityAutocomplete';
import type {SecurityAsset} from './security-lookup';
import StockLink from './StockLink';
import {Skeleton} from './components';
import './industry-candidates.css';
type Company={code:string;name:string;quote?:{mcap?:number;pct?:number;amount?:number}};
type Props={title:string;keywords:string;version:string;reviewedOn:string;known?:Company[]};
const sources=[['ths','同花顺概念'],['dc','东财概念'],['sw','申万细分行业'],['sina','新浪概念']];
const stamp=(v:string)=>v?new Date(v).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'未提供';
export default function IndustryCandidates({title,keywords,version,reviewedOn,known=[]}:Props){
 const navigate=useNavigate(),location=useLocation(),[open,setOpen]=useState(false),[provider,setProvider]=useState('ths'),[input,setInput]=useState(keywords),[term,setTerm]=useState(keywords),[selected,setSelected]=useState(''),[securityText,setSecurityText]=useState(''),[security,setSecurity]=useState<SecurityAsset|null>(null);
 const [memberSort,setMemberSort]=useState('code');
 useEffect(()=>{setOpen(false);setTerm(keywords);setInput(keywords);setSelected('');setSecurityText('');setSecurity(null);},[title,keywords]);
 const url='/api/data/theme-observation?'+new URLSearchParams({provider,view:'directory',direction:'all',search:term,limit:'20'});
 const catalog=useInfiniteQuery({queryKey:['resource',url],initialPageParam:'',enabled:open&&!!term.trim(),queryFn:({pageParam,signal})=>getJSON(url+(pageParam?'&cursor='+encodeURIComponent(pageParam):''),signal),getNextPageParam:(p:any)=>p.nextCursor||undefined,staleTime:Infinity,refetchOnWindowFocus:false,retry:retryRead(1)});
 const pages=catalog.data?.pages||[],model=pages[0],validModel=!!model?.evidenceReady&&/^[a-f0-9]{64}$/.test(model?.id||'')&&model?.provider===provider;
 const catalogValid=validModel&&pages.every(p=>p.id===model.id&&p.provider===model.provider&&p.sourceVersion===model.sourceVersion);
 const boards=catalogValid?[...new Map(pages.flatMap(p=>p.boards||[]).map(b=>[b.code,b])).values()] as any[]:[],board=boards.find(b=>b.code===selected);
 const memberUrl='/api/data/theme-observation?'+new URLSearchParams({provider,view:'directory',direction:'all',model:model?.id||'',board:selected,scope:'source',memberSort,limit:'10'});
 const members=useInfiniteQuery({queryKey:['resource',memberUrl],initialPageParam:'',enabled:!!board&&catalogValid,queryFn:({pageParam,signal})=>getJSON(memberUrl+(pageParam?'&cursor='+encodeURIComponent(pageParam):''),signal),getNextPageParam:(p:any)=>p.nextCursor||undefined,staleTime:Infinity,refetchOnWindowFocus:false,retry:retryRead(1)});
 const memberPages=members.data?.pages||[],memberValid=!!board&&memberPages.every(p=>p.id===model?.id&&p.provider===provider&&p.sourceVersion===model?.sourceVersion&&p.board?.code===selected&&p.memberOrder===memberSort);
 const rows=memberValid?[...new Map(memberPages.flatMap(p=>p.board?.members||[]).filter(s=>/^\d{6}$/.test(s.code||'')&&typeof s.name==='string'&&s.name.trim()).map(s=>[s.code,s])).values()] as Company[]:[];
 function request(c:Company,fromBoard:boolean){
  if(!/^\d{6}$/.test(c.code)||!c.name.trim()||fromBoard&&(!memberValid||members.isError||!rows.some(r=>r.code===c.code)))return;
  const origin=fromBoard?`${sources.find(s=>s[0]===provider)?.[1]}「${board.name}」，成员版本${model.sourceVersion}，资料日${model.day}`:'用户自行选择；尚无产业业务关联证据';
  navigate('/my-research?'+new URLSearchParams({create:'1',kind:'company',code:c.code,name:c.name,industry:title,snapshotId:version,focus:`先核验与${title}的真实业务关系、赚钱业务与壁垒；候选线索：${origin}。板块归类不是受益证明；无关联仍可独立研究。`}));
 }
 return <section className="cr-panel industry-candidates" aria-label="自主选择研究公司">
  <div className="cr-section-head"><div><h2><UsersRound size={21}/>关联公司与自主研究</h2><p>平台案例之外，可从共享板块找候选，也可按名称或代码选择公司；不设市值准入门槛。</p></div><Link className="outline-button" to="/my-research">我的研究</Link></div>
  <div className="candidate-boundary"><strong>候选不等于受益，个人研究不改平台名单</strong><p>先核验真实业务及来源，再做公司价值四问。AI 按钮只准备草稿；确认深度思考和发送后才调用模型，可能消耗额度。完成的报告可在“我的研究”查看。</p></div>
  <div className="candidate-manual"><SecurityAutocomplete label="自主选择公司" value={securityText} onChange={v=>{setSecurityText(v);setSecurity(null);}} onSelect={setSecurity}/><AiAction disabled={!security} onClick={()=>security&&request({code:security.code,name:security.name},false)}>AI核验关联并研究</AiAction></div>
  {security&&<p className="cr-caption">已确认身份：{security.name} {security.code} · {security.source}。证券身份确认不等于与{title}的业务关联成立。</p>}
  {!open?<button type="button" className="outline-button" onClick={()=>setOpen(true)}><Layers3 size={16}/>读取共享板块候选</button>:<>
   <form className="candidate-search" onSubmit={e=>{e.preventDefault();if(input.trim()){setSelected('');setTerm(input.trim());}}}>
    <label>分类来源<select aria-label="候选分类来源" value={provider} onChange={e=>{setSelected('');setProvider(e.target.value);}}>{sources.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
    <label>板块名称或代码<input aria-label="候选板块检索" value={input} onChange={e=>setInput(e.target.value)} placeholder="例如 液冷、储能、半导体设备"/></label><button className="outline-button" disabled={!input.trim()}><Search size={16}/>检索共享目录</button>
   </form>
   <p className="cr-caption">只读盯盘已发布快照，不触发全市场采集或AI。输入完成后检索；跨来源、跨版本不混合。排序覆盖所选板块的完整候选，再每次显示10家；缺指标置后但不排除。市场表现只用于发现对象，不证明受益。</p>
   {catalog.isPending&&<Skeleton label="共享板块候选" kind="table"/>}
   {catalog.error&&<p className="local-error" role="alert">共享目录读取失败，未改写任何研究。<button className="outline-button" onClick={()=>void catalog.refetch()}>重试目录</button></p>}
   {!catalog.isPending&&!catalog.error&&!catalogValid&&<p role="status">共享快照尚未准备完成或版本不可用；可自主搜索公司，不以空结果判断没有相关标的。</p>}
   {catalogValid&&<><p className="cr-caption">快照 {model.day} · {model.id.slice(0,12)} · 成员更新 {stamp(model.membershipUpdatedAt)} · 非已完成业务核验</p><div className="candidate-boards" role="group" aria-label="共享板块结果">{boards.map(b=><button type="button" key={b.code} className="outline-button" aria-pressed={selected===b.code} aria-label={'查看'+b.name+'候选'} onClick={()=>setSelected(b.code)}>{b.name}<small>{b.code} · {b.memberCount}只来源成员</small></button>)}</div>{!boards.length&&<p className="empty">当前来源没有匹配板块；可修改关键词或切换来源，不代表这些公司没有相关业务。</p>}{catalog.hasNextPage&&<button className="outline-button" disabled={catalog.isFetchingNextPage} onClick={()=>void catalog.fetchNextPage()}>读取更多板块</button>}</>}
   {board&&<section className="candidate-members" aria-label="板块候选公司"><h3>{board.name} · 原始成员候选</h3><label className="candidate-member-sort">排序<select aria-label="候选公司排序" value={memberSort} onChange={e=>setMemberSort(e.target.value)}><option value="code">代码顺序</option><option value="cap_asc">市值从小到大</option><option value="cap_desc">市值从大到小</option><option value="pct_desc">当日涨幅</option><option value="amount_desc">成交活跃 · 成交额</option></select></label>{memberPages[0]?.metricCoverage&&<p className="cr-caption">本批指标覆盖 {memberPages[0].metricCoverage.available} / {memberPages[0].metricCoverage.total} · 报价采样 {stamp(model.quoteCollectedAt)} · 研究核对 {reviewedOn}</p>}{members.isPending&&<Skeleton label="板块成员" kind="table"/>}{members.error&&<p className="local-error" role="alert">成员快照读取失败或已过期，不混入新批次。<button className="outline-button" onClick={()=>void members.refetch()}>重试成员</button><button className="outline-button" onClick={()=>{setSelected('');void catalog.refetch();}}>读取最新目录</button></p>}{!memberValid&&memberPages.length>0&&<p className="local-error" role="alert">成员与板块版本不一致，已停止显示，不能据此发起研究。</p>}
    <div className="cr-table-scroll"><table><thead><tr><th>公司 / 代码</th><th>关联证据状态</th><th>个人价值研究</th></tr></thead><tbody>{rows.map(c=><tr key={c.code}><td><StockLink code={c.code} name={c.name}/><small>{c.code}</small></td><td><span className="cr-tag">{known.some(k=>k.code===c.code)?'已有平台业务案例':'板块关联 · 业务待核验'}</span><small>{board.name} · {model.day}</small></td><td><AiAction disabled={members.isError} aria-label={'AI核验并研究'+c.name} onClick={()=>request({code:c.code,name:c.name},true)}>AI核验并研究</AiAction></td></tr>)}</tbody></table></div>
    {memberValid&&!members.isPending&&!members.error&&!rows.length&&<p className="empty">该批次未提供可用的A股身份记录，不复制其他板块成员。</p>}
    {members.hasNextPage&&memberValid&&<button className="outline-button" disabled={members.isFetchingNextPage} onClick={()=>void members.fetchNextPage()}>再读取10家公司</button>}
   </section>}
  </>}
  <p className="cr-caption">未发现业务关联的公司仍可独立研究，但不会自动成为本产业受益标的。研究记录归当前账号，市场数据与平台研究版本分别维护。<Link to={'/my-research?returnTo='+encodeURIComponent('/next'+location.pathname+location.search)}>查看自己的研究报告</Link></p>
 </section>;
}
