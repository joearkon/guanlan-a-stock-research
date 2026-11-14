import {useId} from 'react';
import {Link,useLocation,useSearchParams} from 'react-router-dom';
import {motion} from 'motion/react';
import {semiconductorLayers,semiconductorChildPath} from './semiconductor-directory';
import {semiconductorLayerPath} from './semiconductor-companies';
import {useUiReducedMotion} from './personal-preferences';
import {uiMotion} from './motion-tokens';
import './semiconductor-board.css';
export default function SemiconductorNavigation({layerId,childId}:{layerId?:string;childId?:string}){
 const reduced=useUiReducedMotion(),id=useId(),location=useLocation(),[params]=useSearchParams();
 const active=layerId||(params.get('section')==='fundamentals'?'fundamentals':'overview');
 const options=[{id:'overview',name:'总览',path:'/industry/semiconductors'},{id:'fundamentals',name:'产业基本面',path:'/industry/semiconductors?section=fundamentals'},...semiconductorLayers.map(l=>({id:l.id,name:({equipment:'设备',materials:'材料',power:'功率与分立'} as Record<string,string>)[l.id]||l.name,path:semiconductorLayerPath(l.id)}))];
 const layer=semiconductorLayers.find(l=>l.id===layerId);
 return <><nav className="sb-layer-nav" aria-label="半导体研究层级">{options.map(o=><Link key={o.id} to={o.path} aria-current={active===o.id?'page':undefined}>{active===o.id&&<motion.span aria-hidden="true" className="sb-nav-active" layoutId={'sb-top-'+id} transition={{duration:reduced?0:uiMotion.normal}}/>}<span>{o.name}</span></Link>)}</nav>{layer&&<nav className="sb-child-nav" aria-label={layer.name+'子项'}><Link to={semiconductorLayerPath(layer.id)} aria-current={!childId?'page':undefined}>本层总览</Link>{layer.children.map(c=><Link key={c[0]} to={semiconductorChildPath(layer.id,c[0])} aria-current={childId===c[0]||location.pathname===semiconductorChildPath(layer.id,c[0])?'page':undefined}>{c[1]}</Link>)}</nav>}</>;
}
