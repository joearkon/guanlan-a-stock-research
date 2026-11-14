import {PrivacyGuard} from './Privacy';
import StockLink from './StockLink';
import {useState} from 'react';
import {useProfileActions} from './profile-actions';
import {validDate} from './portfolio-data';
import {number} from './api';
import './stock.css';

type Position={code:string,name:string,shares:number,cost:number,recordDate?:string,basket?:string};
export default function PositionEditor({position,onSaved,initialRemove=false}:{position:Position,onSaved:()=>void,initialRemove?:boolean}){
 const a=useProfileActions();
 const [shares,setShares]=useState(String(position.shares)),[cost,setCost]=useState(String(position.cost));
 const [date,setDate]=useState(position.recordDate||''),[basket,setBasket]=useState(position.basket||'');
 const [confirm,setConfirm]=useState(initialRemove),[removed,setRemoved]=useState<{row:Position,index:number}|null>(null);
 const [error,setError]=useState(''),[feedback,setFeedback]=useState('');
 const busy=a.mutation.isPending;
 function currentIndex(profile:any){
  const index=profile.positions?.findIndex((p:Position)=>p.code===position.code)??-1,current=profile.positions?.[index];
  if(!current||(['code','name','shares','cost','recordDate','basket'] as const).some(key=>current[key]!==position[key]))throw Error('此持仓已变化，请重新读取账户并关闭后重新打开编辑');
  return index;
 }
 async function save(){
  setError('');setFeedback('');
  try{
   const quantity=Number(shares),price=Number(cost);
   if(!Number.isInteger(quantity)||quantity<100||quantity>1e9||!Number.isFinite(price)||price<=0||price>1e7)throw Error('股数须为100至10亿的整数，成本须大于0且不超过1000万');
   if(date&&!validDate(date))throw Error('记录日期无效');
   if(basket.length>40)throw Error('分组不能超过40字');
   await a.change(p=>{const index=currentIndex(p),row={...p.positions[index],shares:quantity,cost:price};delete row.recordDate;delete row.basket;if(date)row.recordDate=date;if(basket.trim())row.basket=basket.trim();p.positions[index]=row;return p;});
   onSaved();
  }catch(e:any){setError(e.message);}
 }
 async function remove(){
  setError('');setFeedback('');let snapshot:{row:Position,index:number}|null=null;
  try{await a.change(p=>{const index=currentIndex(p);snapshot={row:structuredClone(p.positions[index]),index};p.positions.splice(index,1);return p;});setRemoved(snapshot);setConfirm(false);setFeedback('已移除持仓记录，自选和研究记录保留。');}catch(e:any){setError(e.message);}
 }
 async function undo(){
  if(!removed)return;setError('');setFeedback('');
  try{await a.change(p=>{p.positions??=[];if(p.positions.some((r:Position)=>r.code===removed.row.code))throw Error('此股票已有持仓，请重新读取，不能覆盖现有记录');if(p.positions.length>=20)throw Error('持仓已满20项，暂不能恢复');p.positions.splice(Math.min(removed.index,p.positions.length),0,structuredClone(removed.row));return p;});setRemoved(null);setFeedback('已恢复原持仓记录。');}catch(e:any){setError(e.message);}
 }
 return <PrivacyGuard><div className="position-editor stack-form">
  <div className="position-identity"><strong><StockLink code={position.code} name={position.name}/></strong><StockLink code={position.code} name={position.name}>{position.code}</StockLink></div>
  <p>修改的是你确认的实际持仓记录，不会生成买卖成交。证券代码固定；新增其他股票请使用“录入持仓”。</p>
  {error&&<div role="alert" className="local-error">{error}<button type="button" className="outline-button" disabled={busy||a.query.isFetching} onClick={async()=>{const result=await a.query.refetch();setFeedback(result.isError?'账户读取失败，草稿仍保留，可重试。':'账户已刷新，请关闭后重新打开编辑；当前草稿未保存。');}}>重新读取账户</button></div>}
  {feedback&&<p role="status">{feedback}</p>}
  {removed?<button type="button" className="outline-button" disabled={busy} onClick={()=>void undo()}>{busy?'正在恢复…':'撤销移除'}</button>:<>
   {!confirm&&<form className="stack-form" onSubmit={e=>{e.preventDefault();void save();}}>
    <fieldset className="position-fields stack-form" disabled={busy||confirm}>
     <label>实际股数<input type="number" min="100" max="1000000000" step="1" required value={shares} onChange={e=>setShares(e.target.value)}/></label>
     <label>成本价（元）<input type="number" min="0.0001" max="10000000" step="any" required value={cost} onChange={e=>setCost(e.target.value)}/></label>
     <label>记录日期<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
     <label>组合 / 账户分组<input maxLength={40} value={basket} onChange={e=>setBasket(e.target.value)}/></label>
     <p>原记录：{number(position.shares,0)} 股 · 成本 {number(position.cost,4)} 元。请按实际成交核对。</p>
     <button className="primary" disabled={!a.query.data}>{busy?'正在保存…':'保存持仓修改'}</button>
    </fieldset>
   </form>}
   <section className="position-remove" aria-label="移除持仓记录">
    {confirm?<><h3>确认移除 {position.name}？</h3><p>仅从当前持仓列表移除，不代表已卖出，不影响自选、提醒或研究记录。本次关闭前可撤销。</p><div className="position-actions"><button type="button" className="outline-button position-danger" autoFocus disabled={busy} onClick={()=>void remove()}>{busy?'正在移除…':'确认移除持仓'}</button><button type="button" className="outline-button" disabled={busy} onClick={()=>setConfirm(false)}>取消移除</button></div></>:<button type="button" disabled={busy} className="position-danger" onClick={()=>setConfirm(true)}>移除持仓</button>}
   </section>
  </>}
 </div></PrivacyGuard>;
}
