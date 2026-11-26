import {useRef,useState,type ComponentProps} from 'react';
import {QuoteTable,Drawer} from './components';
import {orderKey} from './OrderHandle';
import {usePrivacy} from './Privacy';
import type {useProfileActions} from './profile-actions';
import './portfolio-bulk.css';

type Mode='watchlist'|'holdings';
type Props=ComponentProps<typeof QuoteTable>&{mode:Mode;actions:ReturnType<typeof useProfileActions>};
type Receipt={version:number;list:any[];count:number};
export default function PortfolioBulkTable({mode,actions:a,...table}:Props){
 const [active,setActive]=useState(false),[keys,setKeys]=useState<string[]>([]),[version,setVersion]=useState<number|null>(null),[confirm,setConfirm]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState(''),[receipt,setReceipt]=useState<Receipt|null>(null),[reload,setReload]=useState(false);
 const submitting=useRef(false),privacy=usePrivacy(),data=a.query.data,holding=mode==='holdings',field=holding?'positions':'pool',label=holding?'持仓记录':'自选',busy=a.mutation.isPending||reload,stale=active&&version!==data?.version,unavailable=busy||privacy.hidden||!!a.query.error||a.query.isFetching||!data?.profile||!Number.isInteger(data?.version),chosen=table.rows.filter(r=>keys.includes(orderKey(r))),all=table.rows.length>0&&chosen.length===table.rows.length;
 function reset(){setActive(false);setKeys([]);setVersion(null);setConfirm(false);setError('');}
 function start(){if(unavailable)return;reset();setReceipt(null);setStatus('');setVersion(data!.version);setActive(true);}
 function toggle(key:string){if(unavailable||stale||error)return;setKeys(old=>old.includes(key)?old.filter(k=>k!==key):[...old,key]);}
 async function remove(){
  if(submitting.current||unavailable||stale||error||!confirm||!chosen.length)return;
  submitting.current=true;const selected=new Set(chosen.map(orderKey)),expected=version,count=chosen.length;let oldList:any[]=[];
  try{
   const saved=await a.change((p,v)=>{
    if(v!==expected||!Array.isArray(p[field]))throw Error('账户列表已变化，请重新读取后选择');
    const matches=p[field].filter((r:any)=>selected.has(orderKey(r))&&(holding||!r.archived));
    if(matches.length!==count)throw Error('所选记录已变化，请重新读取后选择');
    oldList=structuredClone(p[field]);
    p[field]=holding?p[field].filter((r:any)=>!selected.has(orderKey(r))):p[field].map((r:any)=>selected.has(orderKey(r))?{...r,archived:true}:r);
    return p;
   });
   reset();setReceipt({version:saved.version,list:oldList,count});setStatus('已移除'+count+'项'+label+'；其他记录保留。');
  }catch(e:any){setConfirm(false);setError('移除未确认：'+e.message+' 已读列表保留，请重新读取账户核对后再选择。');}
  finally{submitting.current=false;}
 }
 async function undo(){
  if(!receipt||submitting.current||unavailable)return;submitting.current=true;
  try{await a.change((p,v)=>{if(v!==receipt.version)throw Error('账户已再次变化，不能覆盖新记录，请重新读取核对');p[field]=structuredClone(receipt.list);return p;});setStatus('已恢复本次移除前的'+(holding?'持仓':'自选')+'记录和顺序。');setReceipt(null);}
  catch(e:any){setError('恢复未确认：'+e.message+' 请重新读取账户核对，不会自动重试。');setReceipt(null);}
  finally{submitting.current=false;}
 }
 async function reread(){if(busy)return;setReload(true);try{const result=await a.query.refetch();if(result.isError)throw result.error;reset();setReceipt(null);setStatus('账户已重新读取，请核对列表后重新选择。');}catch(e:any){setError('账户读取失败：'+e.message+'；保留已读列表，不自动重试。');}finally{setReload(false);}}
 const disabled=unavailable||stale||!!error;
 return <>
  <div className="portfolio-bulk-bar" role="group" aria-label={'批量管理'+label}>
   {!active?<button type="button" className="outline-button" disabled={unavailable||!!error||!table.rows.length} onClick={start}>批量管理</button>:<>
    <label className="portfolio-bulk-check"><input type="checkbox" aria-label="全选当前筛选结果" checked={all} ref={node=>{if(node)node.indeterminate=chosen.length>0&&!all;}} disabled={disabled} onChange={()=>setKeys(all?[]:table.rows.map(orderKey))}/>全选当前筛选结果 <span>（{table.rows.length}）</span></label>
    <span role="status">已选 {chosen.length} 项</span>
    <button type="button" className="outline-button portfolio-bulk-remove" disabled={disabled||!chosen.length} onClick={()=>setConfirm(true)}>移除所选（{chosen.length}）</button>
    <button type="button" className="outline-button" disabled={busy||!!error} onClick={reset}>完成</button>
   </>}
   {privacy.hidden&&<span className="muted">关闭隐私模式后管理记录</span>}
   {receipt&&!error&&<button type="button" className="outline-button" disabled={unavailable} onClick={()=>void undo()}>撤销本次批量移除</button>}
  </div>
  {stale&&!error&&<p role="status" className="local-error">账户列表已变化，请点“完成”后重新选择；本次尚未移除。</p>}
  {status&&<p role="status" className="local-status">{status}</p>}
  {error&&<div role="alert" className="local-error">{error}<button type="button" disabled={busy} onClick={()=>void reread()}>重新读取账户核对</button></div>}
  <QuoteTable {...table} onReorder={active?undefined:table.onReorder} orderBusy={table.orderBusy||busy} selection={active?{keys,onToggle:toggle,disabled}:undefined}/>
  <Drawer open={confirm} onOpenChange={open=>{if(!busy)setConfirm(open);}} title={'确认批量移除'+label} className="portfolio-bulk-confirm">
   <p>{holding?'仅移除观澜里的持仓记录，不代表已卖出，不生成成交；自选、提醒和研究记录保留。':'仅从自选列表移除，保留归档中的关注原因和研究信息；持仓、提醒和研究记录不受影响。'}</p>
   <p>本次 {chosen.length} 项；只处理下列当前筛选结果。保存成功后，当前页面内且账户未再次修改时可撤销。</p>
   <ul>{chosen.map(r=><li key={orderKey(r)}><strong>{r.name||r.code}</strong> <span>{r.code} · {holding?'持仓':({stock:'股票',etf:'ETF',concept:'概念',industry:'行业',theme:'题材'} as Record<string,string>)[r.kind||'stock']||r.kind}</span></li>)}</ul>
   {stale&&<p role="alert" className="local-error">账户列表已变化，请取消移除并重新选择。</p>}
   <div className="portfolio-bulk-actions"><button type="button" className="outline-button portfolio-bulk-remove" disabled={disabled||!chosen.length} onClick={()=>void remove()}>{busy?'正在移除…':'确认移除'+chosen.length+'项'+label}</button><button type="button" className="outline-button" disabled={busy} onClick={()=>setConfirm(false)}>取消移除</button></div>
  </Drawer>
 </>;
}
