import {useLayoutEffect,useRef,useState} from 'react';
import {number} from './api';
export default function LiveNumber({value,identity}:{value:any,identity:string}){
 const previous=useRef({value,identity}),[flash,setFlash]=useState('');
 useLayoutEffect(()=>{
  const old=previous.current;previous.current={value,identity};
  if(old.identity!==identity||typeof old.value!=='number'||!Number.isFinite(old.value)||typeof value!=='number'||!Number.isFinite(value)||old.value===value){setFlash('');return;}
  setFlash(value>old.value?'quote-flash-up':'quote-flash-down');
  const timer=setTimeout(()=>setFlash(''),100);return()=>clearTimeout(timer);
 },[value,identity]);
 return <span data-market-value="price" className={flash} aria-live="off">{number(value)}</span>;
}
