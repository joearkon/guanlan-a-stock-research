import{useEffect,useRef}from'react';
import type{PointerEvent,MouseEvent,KeyboardEvent}from'react';
export function usePortfolioRowMenu({enabled,busy,onOpen}:{enabled:boolean;busy:boolean;onOpen:(row:any)=>void}){
 const pending=useRef<{row:any;x:number;y:number;pointerId:number;target:HTMLElement}|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),suppress=useRef<{code:string;until:number}|null>(null),latest=useRef({enabled,busy,onOpen});latest.current={enabled,busy,onOpen};
 const cancel=()=>{if(timer.current!==null)clearTimeout(timer.current);timer.current=null;pending.current=null;};
 const ignored=(target:EventTarget|null)=>target instanceof Element&&!!target.closest('.order-handle,.portfolio-row-action,input,select,textarea');
 useEffect(()=>{const hide=()=>{if(document.hidden)cancel();};window.addEventListener('blur',cancel);window.addEventListener('scroll',cancel,true);document.addEventListener('visibilitychange',hide);return()=>{cancel();window.removeEventListener('blur',cancel);window.removeEventListener('scroll',cancel,true);document.removeEventListener('visibilitychange',hide);};},[]);
 useEffect(()=>{cancel();},[enabled,busy]);
 function open(row:any){if(latest.current.enabled&&!latest.current.busy)latest.current.onOpen(row);}
 return {cancel,open,keyDown:(row:any,e:KeyboardEvent)=>{if(enabled&&!busy&&!ignored(e.target)&&(e.key==='ContextMenu'||e.key==='F10'&&e.shiftKey)){e.preventDefault();e.stopPropagation();cancel();open(row);return true;}return false;},bind:(row:any)=>({
  onPointerDown:(e:PointerEvent<HTMLTableRowElement>)=>{cancel();suppress.current=null;if(!enabled||busy||e.button!==0||e.isPrimary===false||!['touch','pen'].includes(e.pointerType)||ignored(e.target))return;const target=e.currentTarget;pending.current={row,x:e.clientX,y:e.clientY,pointerId:e.pointerId,target};timer.current=setTimeout(()=>{const p=pending.current;if(!p||!p.target.isConnected)return;cancel();if(!latest.current.enabled||latest.current.busy)return;suppress.current={code:row.code,until:Date.now()+1200};open(row);},550);},
  onPointerMove:(e:PointerEvent)=>{const p=pending.current;if(p&&e.pointerId===p.pointerId&&Math.hypot(e.clientX-p.x,e.clientY-p.y)>8)cancel();},
  onPointerUp:cancel,onPointerCancel:cancel,onPointerLeave:cancel,
  onClickCapture:(e:MouseEvent)=>{const held=suppress.current;if(held&&held.code===row.code&&Date.now()<held.until){suppress.current=null;e.preventDefault();e.stopPropagation();}},
  onContextMenu:(e:MouseEvent)=>{if(!enabled||busy||ignored(e.target))return;e.preventDefault();e.stopPropagation();cancel();suppress.current={code:row.code,until:Date.now()+1200};open(row);}
 })};
}
