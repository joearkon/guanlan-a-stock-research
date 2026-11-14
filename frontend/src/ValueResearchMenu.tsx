import {useResearchVersionNotice} from './ResearchVersionNotice';
import {useIndustryUpdates} from './IndustryUpdates';
import {useEffect,useId,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {motion} from 'motion/react';
import {ChevronRight} from 'lucide-react';
import {useUiReducedMotion} from './personal-preferences';
import {uiMotion} from './motion-tokens';
import {industrySectors,sectorChildPath} from './industry-sectors';
export default function ValueResearchMenu({root,name}:{root:string;name:string}){
 const location=useLocation(),active=location.pathname===root||location.pathname.startsWith(root+'/'),[open,setOpen]=useState(active),id=useId(),reduced=useUiReducedMotion();
 useEffect(()=>{if(active)setOpen(true);},[active]);
 const sector=industrySectors.find(s=>root==='/industry/'+s.id),baseline=useResearchVersionNotice(),automatic=useIndustryUpdates(sector?.id||'unused',['media','gaming','robotics','ai-applications'].includes(sector?.id||''));
 const versions={dot:(id:string,label:string)=>automatic.badge(id,label)||baseline.dot(id,label),panel:<>{baseline.panel}{automatic.panel}</>};
 return <div className="industry-branch"><div className="industry-tree-row" data-ancestor={active}><Link to={root} aria-current={location.pathname===root?'page':undefined}>{name}</Link>{sector&&versions.dot(sector.id,name)}<button aria-label={(open?'收起':'展开')+name+'研究层级'} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(v=>!v)}><ChevronRight size={14} style={{transform:open?'rotate(90deg)':'none'}}/></button></div>{open&&sector&&<motion.div id={id} className="industry-branch-children" role="group" aria-label={name+'研究层级'} initial={reduced?false:{opacity:0,x:-4}} animate={{opacity:1,x:0}} transition={{duration:reduced?0:uiMotion.normal}}>{sector.children.map(c=><div className="industry-tree-row" key={c.id}><Link className={!c.ready?'industry-tree-planned':undefined} to={sectorChildPath(sector,c)} aria-current={location.pathname===sectorChildPath(sector,c)||c.ready&&location.pathname.startsWith(sectorChildPath(sector,c)+'/')?'page':undefined}><span>{c.name}</span>{!c.ready&&<small>建设中</small>}</Link>{versions.dot(c.id,c.name)}</div>)}</motion.div>}{versions.panel}</div>;
}
