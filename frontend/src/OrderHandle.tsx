import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {animate,motion,motionValue,useMotionValue,} from 'motion/react';
import {useUiReducedMotion} from './personal-preferences';
import './order-drag.css';
export const orderKey=(row:any)=>(row.kind||'stock')+':'+row.code;
type Cell={width:number,text:string,color:string,padding:string,fontSize:string,textAlign:CSSProperties['textAlign']};
type Ghost={left:number,top:number,width:number,height:number,cells:Cell[],subtitle:string,action:string};
type Entry={el:HTMLTableRowElement,key:string,top:number,height:number,transform:string,offset:ReturnType<typeof motionValue<number>>,unsubscribe:()=>void};
type Session={table:HTMLTableElement,source:HTMLTableRowElement,entries:Entry[],index:number,target:number,scroll:HTMLElement|null,scrollTop:number,windowY:number,height:number};
export default function OrderHandle({row,rows,disabled,onMove}:{row:any,rows:any[],disabled?:boolean,onMove:(from:string,to:string)=>void}){
 const hold=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),origin=useRef<{x:number,y:number}|null>(null),button=useRef<HTMLButtonElement|null>(null),session=useRef<Session|null>(null),animations=useRef(new Map<HTMLElement,{stop:()=>void}>()),[ghost,setGhost]=useState<Ghost|null>(null),[dragging,setDragging]=useState(false),y=useMotionValue(0),reduced=useUiReducedMotion();
 const key=orderKey(row);
 const frame=useRef<number|null>(null),point=useRef<{x:number,y:number}|null>(null),lastFrame=useRef(0),moved=useRef(false);
 function cancel(render=true){
  if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;point.current=null;lastFrame.current=0;moved.current=false;
  clearTimeout(hold.current);animations.current.forEach(a=>a.stop());animations.current.clear();
  const s=session.current;if(s){s.entries.forEach(e=>{e.unsubscribe();e.offset.destroy();e.el.style.transform=e.transform;e.el.removeAttribute('data-order-drop');});s.source.removeAttribute('data-order-drag-source');s.table.removeAttribute('data-order-dragging');}
  session.current=null;origin.current=null;document.body.classList.remove('is-order-dragging');if(render){setGhost(null);setDragging(false);}
 }
 useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&origin.current){e.preventDefault();cancel();}},blur=()=>cancel();document.addEventListener('keydown',escape);window.addEventListener('blur',blur);return()=>{document.removeEventListener('keydown',escape);window.removeEventListener('blur',blur);cancel(false);};},[]);
 function lift(){
  if(session.current||!origin.current||disabled)return;
  const source=button.current?.closest<HTMLTableRowElement>('tr[data-order-key]'),table=source?.closest('table');if(!source||!table)return;
  const visible=new Set(rows.map(orderKey)),entries=Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody tr[data-order-key]')).filter(e=>visible.has(e.dataset.orderKey!)).map(el=>{const r=el.getBoundingClientRect(),offset=motionValue(0),unsubscribe=offset.on('change',v=>{el.style.transform=`translate3d(0,${v}px,0)`;});return {el,key:el.dataset.orderKey!,top:r.top,height:r.height,transform:el.style.transform,offset,unsubscribe};}),index=entries.findIndex(e=>e.key===key);if(index<0){entries.forEach(e=>{e.unsubscribe();e.offset.destroy();});return;}
  const rect=source.getBoundingClientRect(),scroll=source.closest<HTMLElement>('.home-personal-scroll,.quote-scroll');
  session.current={table,source,entries,index,target:index,scroll,scrollTop:scroll?.scrollTop||0,windowY:window.scrollY,height:rect.height};
  const cells=Array.from(source.cells).map(el=>{const style=getComputedStyle(el);return {width:el.getBoundingClientRect().width,text:el.innerText,color:style.color,padding:style.padding,fontSize:style.fontSize,textAlign:style.textAlign as CSSProperties['textAlign']};});
  const subtitle=source.cells[0]?.querySelector('small')?.textContent||row.code,action=source.cells[0]?.querySelector('.holding-name-button')?.textContent||'';
  y.set(0);setGhost({left:rect.left,top:rect.top,width:rect.width,height:rect.height,cells,subtitle,action});setDragging(true);source.setAttribute('data-order-drag-source','');table.setAttribute('data-order-dragging','');document.body.classList.add('is-order-dragging');
  frame.current=requestAnimationFrame(scrollFrame);
 }
 function scrollFrame(stamp:number){
  const s=session.current,p=point.current;if(!s||!p){frame.current=null;return;}
  const elapsed=Math.min(40,lastFrame.current?stamp-lastFrame.current:16);lastFrame.current=stamp;
  const rect=(s.scroll||s.table).getBoundingClientRect(),chromeTop=document.querySelector('.topbar')?.getBoundingClientRect().bottom||0,chromeBottom=document.querySelector('footer')?.getBoundingClientRect().top||window.innerHeight;
  const head=s.table.tHead?.getBoundingClientRect().height||0,top=Math.max(rect.top+head,chromeTop+8),bottom=Math.min(rect.bottom,chromeBottom-8),band=Math.min(48,Math.max(16,(bottom-top)/3));
  if(moved.current&&bottom>top&&p.x>=Math.max(0,rect.left)&&p.x<=Math.min(window.innerWidth,rect.right)&&p.y>=top-20&&p.y<=bottom+20){
   const speed=p.y<top+band?-720*Math.min(1,(top+band-p.y)/band):p.y>bottom-band?720*Math.min(1,(p.y-bottom+band)/band):0;
   if(speed){const host=s.scroll,canInner=host&&host.scrollHeight>host.clientHeight+1&&(speed<0?host.scrollTop>0:host.scrollTop+host.clientHeight<host.scrollHeight-1);
    if(canInner)host.scrollTop+=speed*elapsed/1000;
    else if(speed<0&&rect.top<chromeTop+head||speed>0&&rect.bottom>chromeBottom)window.scrollBy(0,speed*elapsed/1000);
   }
  }
  // Native wheel scrolling and edge scrolling both update the hit target, even
  // when the pointer stays still. No account writes happen in this loop.
  move(p.x,p.y);frame.current=requestAnimationFrame(scrollFrame);
 }
 function shift(target:number){
  const s=session.current;if(!s||target===s.target)return;s.target=target;
  s.entries.forEach((e,i)=>{const delta=i>s.index&&i<=target?-s.height:i>=target&&i<s.index?s.height:0;e.el.removeAttribute('data-order-drop');if(i!==s.index){animations.current.get(e.el)?.stop();animations.current.set(e.el,animate(e.offset,delta,{duration:reduced?0:.15,ease:'easeOut'}));}});
  if(target!==s.index)s.entries[target].el.setAttribute('data-order-drop',target<s.index?'before':'after');
 }
 function move(clientX:number,clientY:number){
  const s=session.current;if(!s||!origin.current)return;y.set(clientY-origin.current.y);
  const area=(s.scroll||s.table).getBoundingClientRect();
  if(clientX<Math.max(0,area.left)||clientX>Math.min(window.innerWidth,area.right)||clientY<Math.max(0,area.top)||clientY>Math.min(window.innerHeight,area.bottom)){shift(s.index);return;}
  const scrollDelta=(s.scroll?.scrollTop||0)-s.scrollTop+window.scrollY-s.windowY;
  let closest=s.index,distance=Infinity;for(let i=0;i<s.entries.length;i++){const entry=s.entries[i],d=Math.abs(clientY-(entry.top-scrollDelta+entry.height/2));if(d<distance){distance=d;closest=i;}}
  shift(closest);
 }
 return <><button ref={button} type="button" className="order-handle" aria-label={'拖动排序'+(row.name||row.code)} aria-pressed={dragging} title={disabled?'保存中或正在按行情排序，请先恢复手动顺序':'按住拖动排序；触屏长按；键盘上下方向键移动'} disabled={disabled}
  onClick={e=>e.stopPropagation()}
  onKeyDown={e=>{if(['ArrowUp','ArrowDown'].includes(e.key)&&!session.current){e.preventDefault();e.stopPropagation();const i=rows.findIndex(x=>orderKey(x)===key),to=rows[i+(e.key==='ArrowUp'?-1:1)];if(to)onMove(key,orderKey(to));}if(e.key==='Escape')cancel();}}
  onPointerDown={e=>{if(e.button!==0||disabled)return;e.preventDefault();e.stopPropagation();e.currentTarget.setPointerCapture?.(e.pointerId);origin.current={x:e.clientX,y:e.clientY};point.current={x:e.clientX,y:e.clientY};moved.current=false;hold.current=setTimeout(lift,200);}}
  onPointerMove={e=>{if(!origin.current||disabled)return;point.current={x:e.clientX,y:e.clientY};if(Math.hypot(e.clientX-origin.current.x,e.clientY-origin.current.y)>=5)moved.current=true;if(!session.current&&e.pointerType==='mouse'&&moved.current){clearTimeout(hold.current);lift();}move(e.clientX,e.clientY);}}
  onPointerUp={e=>{e.stopPropagation();move(e.clientX,e.clientY);const s=session.current,to=s?.entries[s.target]?.key,save=!!s&&to&&to!==key;cancel();if(save)onMove(key,to!);}}
  onPointerCancel={()=>cancel()} onLostPointerCapture={()=>cancel()}>⠿<span className="sr-only">{dragging?'正在拖动，移到目标行后松开；Escape取消':''}</span></button>
  {ghost&&createPortal(<div className="order-drag-layer" aria-hidden="true"><motion.div className="order-drag-overlay" style={{left:ghost.left,top:ghost.top,width:ghost.width,height:ghost.height,y}}><table><colgroup>{ghost.cells.map((c,i)=><col key={i} style={{width:c.width}}/>)}</colgroup><tbody><tr>{ghost.cells.map((c,i)=><td key={i} style={{color:c.color,padding:c.padding,fontSize:c.fontSize,textAlign:c.textAlign}}>{i===0?<div className="order-drag-identity"><span className="order-drag-grip">⠿</span><span><strong>{row.name||row.code}</strong><small>{ghost.subtitle}</small></span>{ghost.action&&<span className="order-drag-action">{ghost.action}</span>}</div>:c.text}</td>)}</tr></tbody></table></motion.div></div>,document.body)}
 </>;
}
