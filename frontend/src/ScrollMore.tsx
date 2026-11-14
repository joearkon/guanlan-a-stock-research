import {useEffect,useRef} from 'react';

// One batch per bottom entry. Repeated observer notifications must not drain the list.
// A native button remains usable with keyboards and without IntersectionObserver.
export default function ScrollMore({onMore,children}:{onMore:()=>void,children:React.ReactNode}){
 const target=useRef<HTMLDivElement>(null),callback=useRef(onMore);
 callback.current=onMore;
 useEffect(()=>{
  if(!target.current||typeof IntersectionObserver==='undefined')return;
  let entered=false;
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting){entered=false;continue;}
    if(entered)continue;
    entered=true;callback.current();
   }
  },{rootMargin:'0px 0px 80px 0px'});
  observer.observe(target.current);
  return ()=>observer.disconnect();
 },[]);
 return <div ref={target}><button className="outline-button" onClick={onMore}>{children}</button></div>;
}
