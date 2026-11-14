import {useEffect,useState} from 'react';
export type AlertOptions={popup:boolean;sound:boolean;volume:number;muted:Record<string,string>};
const key=(account:string)=>'guanlan.alert-options.v1.'+encodeURIComponent(account),event='guanlan-alert-options';
export const alertDay=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai'}).format(new Date());
export const alertTarget=(m:any)=>[m.targetType==='board'?'board':'stock',m.provider||'',m.code||''].join(':');
function read(account:string):AlertOptions{const defaults={popup:account!=='guest',sound:false,volume:.35,muted:{}};try{const x=JSON.parse(localStorage.getItem(key(account))||'null');if(!x)return defaults;return {popup:x.popup!==false,sound:x.sound===true,volume:typeof x.volume==='number'&&Number.isFinite(x.volume)?Math.min(1,Math.max(0,x.volume)):.35,muted:Object.fromEntries(Object.entries(x.muted||{}).filter(([k,v])=>k.length<150&&v===alertDay()).slice(-100)) as Record<string,string>};}catch{return defaults;}}
export function useAlertOptions(account:string){
 const [state,setState]=useState(()=>({account,value:read(account),warning:''}));
 useEffect(()=>{const sync=()=>setState({account,value:read(account),warning:''});sync();window.addEventListener('storage',sync);window.addEventListener(event,sync);return()=>{window.removeEventListener('storage',sync);window.removeEventListener(event,sync);};},[account]);
 const value=state.account===account?state.value:read(account);
 function change(patch:Partial<AlertOptions>){const next={...value,...patch};let warning='';try{localStorage.setItem(key(account),JSON.stringify(next));window.dispatchEvent(new Event(event));}catch{warning='浏览器未允许保存，设置仅本次页面有效。';}setState({account,value:next,warning});}
 return {value,warning:state.account===account?state.warning:'',change};
}
