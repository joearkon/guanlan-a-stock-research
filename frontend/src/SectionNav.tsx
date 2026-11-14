import {useEffect,useRef} from 'react';
import {bindSectionNavigation} from '../../web/v2/section-navigation.mjs';
import '../../web/v2/section-navigation.css';
export default function SectionNav({items,label='模块定位',variant='tabs'}:{items:[string,string][],label?:string,variant?:'tabs'|'rail'}){
 const ref=useRef<HTMLElement>(null),signature=items.map(([id])=>id).join('|');
 useEffect(()=>ref.current?bindSectionNavigation(ref.current):undefined,[signature]);
 return <nav ref={ref} className={'anchor-tabs section-nav'+(variant==='rail'?' section-nav-rail':'')} aria-label={label}>{items.map(([id,text])=><a key={id} href={'#'+id}>{text}</a>)}<span className="section-nav-indicator" aria-hidden="true"/></nav>;
}
