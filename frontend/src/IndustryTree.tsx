import {useEffect,useState} from 'react';
import {Link,useLocation,useSearchParams} from 'react-router-dom';
import {motion} from 'motion/react';
import {ChevronRight} from 'lucide-react';
import ComputeResearchMenu from './ComputeResearchMenu';
import ValueResearchMenu from './ValueResearchMenu';
import {industrySectors} from './industry-sectors';
import './industry-sectors.css';
import {semiconductorLayers,semiconductorChildPath} from './semiconductor-directory';
import {semiconductorLayerPath,semiconductorCompanyLayer} from './semiconductor-companies';
import {useUiReducedMotion} from './personal-preferences';
import {uiMotion} from './motion-tokens';
import {useIndustryUpdates} from './IndustryUpdates';
import './industry-tree.css';
const root='/industry/semiconductors';
export default function IndustryTree(){
 const location=useLocation(),[params]=useSearchParams(),reduced=useUiReducedMotion(),updates=useIndustryUpdates();
 const activeLayer=location.pathname.includes('/layers/cleanroom')?'cleanroom':location.pathname.includes('/companies')?semiconductorCompanyLayer(location.pathname.split('/').at(-1)||''):location.pathname.includes('/equipment')||location.pathname.includes('/advanced-process')?'equipment':location.pathname.match(/\/layers\/([^/]+)/)?.[1];
 const [semiOpen,setSemiOpen]=useState(location.pathname.startsWith(root)),[open,setOpen]=useState(()=>new Set(activeLayer?[activeLayer]:[]));
 useEffect(()=>{if(location.pathname.startsWith(root))setSemiOpen(true);if(activeLayer)setOpen(previous=>new Set([...previous,activeLayer]));},[location.pathname,activeLayer]);
 function toggle(id:string){setOpen(previous=>{const next=new Set(previous);next.has(id)?next.delete(id):next.add(id);return next;});}
 return <div className="subnav industry-tree" aria-label="产业研究树">
  <Link to="/industry" aria-current={location.pathname==='/industry'?'page':undefined}>产业总览</Link>
  <ComputeResearchMenu/>
  <div className="industry-tree-row" data-ancestor={location.pathname.startsWith(root)}>
   <Link to={root} aria-current={location.pathname===root&&!params.get('section')?'page':undefined}>半导体</Link>{updates.badge('semiconductors','半导体')}
   <button aria-label={(semiOpen?'收起':'展开')+'半导体研究层级'} aria-expanded={semiOpen} aria-controls="industry-semiconductor-tree" onClick={()=>setSemiOpen(v=>!v)}><ChevronRight size={14} style={{transform:semiOpen?'rotate(90deg)':'none'}}/></button>
  </div>
  {updates.status}
  {semiOpen&&<motion.div id="industry-semiconductor-tree" role="group" aria-label="半导体八层" initial={reduced?false:{opacity:0,y:-3}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:uiMotion.normal}}>
   <Link className="industry-tree-fundamentals" to={root+'?section=fundamentals'} aria-current={location.pathname===root&&params.get('section')==='fundamentals'?'page':undefined}>产业基本面</Link>
   {semiconductorLayers.map(layer=><div key={layer.id} className="industry-tree-layer">
    <div className="industry-tree-row" data-ancestor={activeLayer===layer.id}>
     <Link to={semiconductorLayerPath(layer.id)} aria-current={location.pathname===semiconductorLayerPath(layer.id)||layer.id==='cleanroom'&&activeLayer==='cleanroom'?'page':undefined}>{layer.name}</Link>{updates.badge(layer.id,layer.name)}
     {layer.id!=='cleanroom'&&<button aria-label={(open.has(layer.id)?'收起':'展开')+layer.name+'子项'} aria-expanded={open.has(layer.id)} aria-controls={'industry-subtree-'+layer.id} onClick={()=>toggle(layer.id)}><ChevronRight size={14} style={{transform:open.has(layer.id)?'rotate(90deg)':'none'}}/></button>}
    </div>
    {layer.id!=='cleanroom'&&open.has(layer.id)&&<motion.div id={'industry-subtree-'+layer.id} className="industry-tree-children" initial={reduced?false:{opacity:0,y:-3}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:uiMotion.normal}}>{layer.children.map(child=><div className="industry-tree-row" key={child[0]}><Link to={semiconductorChildPath(layer.id,child[0])} aria-current={location.pathname===semiconductorChildPath(layer.id,child[0])||location.pathname.includes('/companies')&&activeLayer===layer.id&&params.get('from')===child[0]?'page':undefined}>{child[1]}</Link>{updates.badge(child[0],child[1])}</div>)}</motion.div>}
   </div>)}
  </motion.div>}
  {industrySectors.map(s=><ValueResearchMenu key={s.id} root={'/industry/'+s.id} name={s.name}/>)}
  {updates.panel}
 </div>;
}
