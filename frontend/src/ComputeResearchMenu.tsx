import {useResearchVersionNotice} from './ResearchVersionNotice';
import {useIndustryUpdates} from './IndustryUpdates';
import {useState,useId,useEffect} from 'react';
import {Link,useLocation,useSearchParams} from 'react-router-dom';
import {motion} from 'motion/react';
import {ChevronRight} from 'lucide-react';
import {COMPUTE_ROOT,COOLING_ROOT,computeModules} from './compute-directory';
import {useUiReducedMotion} from './personal-preferences';
import {uiMotion} from './motion-tokens';
import './industry-tree.css';
export default function ComputeResearchMenu(){
 const location=useLocation(),[params]=useSearchParams(),[open,setOpen]=useState(location.pathname.startsWith(COMPUTE_ROOT)),reduced=useUiReducedMotion(),branchId=useId();
 const active=location.pathname.startsWith(COMPUTE_ROOT),versions=useResearchVersionNotice(),automatic=useIndustryUpdates('ai-compute');
 useEffect(()=>{if(active)setOpen(true);},[active]);
 return <div className="industry-branch compute-tree"><div className="industry-tree-row" data-ancestor={location.pathname.startsWith(COMPUTE_ROOT)}><Link to={COMPUTE_ROOT} aria-current={location.pathname===COMPUTE_ROOT&&!params.get('stage')&&params.get('section')!=='fundamentals'?'page':undefined}>AI 算力</Link>{automatic.badge('ai-compute','AI 算力')||versions.dot('ai-compute','AI 算力')}<button type="button" aria-label={(open?'收起':'展开')+'AI算力研究层级'} aria-expanded={open} aria-controls={branchId} onClick={()=>setOpen(v=>!v)}><ChevronRight size={14} style={{transform:open?'rotate(90deg)':'none'}}/></button></div>
 {open&&<motion.div id={branchId} role="group" aria-label="AI算力研究层级" initial={reduced?false:{opacity:0,x:-4}} animate={{opacity:1,x:0}} transition={{duration:reduced?0:uiMotion.normal}}><Link to={COMPUTE_ROOT} aria-current={location.pathname===COMPUTE_ROOT&&!params.get('stage')&&params.get('section')!=='fundamentals'?'page':undefined}>产业总览</Link><Link to={COMPUTE_ROOT+'?section=fundamentals'} aria-current={location.pathname===COMPUTE_ROOT&&!params.get('stage')&&params.get('section')==='fundamentals'?'page':undefined}>产业基本面</Link>{computeModules.map(m=><div className="industry-tree-row" key={m.id}><Link to={m.id==='liquid-cooling'?COOLING_ROOT:COMPUTE_ROOT+'?stage='+m.id} aria-current={m.id==='liquid-cooling'?location.pathname.startsWith(COOLING_ROOT)?'page':undefined:params.get('stage')===m.id?'page':undefined}>{m.name}</Link>{automatic.badge(m.id,m.name)||versions.dot(m.id,m.name)}</div>)}</motion.div>}{versions.panel}{automatic.panel}
 </div>;
}
