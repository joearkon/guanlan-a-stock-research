import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {ReactFlow,Handle,Position,Controls,Background,type Node,type NodeProps} from '@xyflow/react';
import {motion} from 'motion/react';
import {Maximize2,Workflow} from 'lucide-react';
import {semiconductorLayerPath} from './semiconductor-companies';
import {taxonomySource} from './semiconductor-directory';
import {useUiReducedMotion} from './personal-preferences';
import '@xyflow/react/dist/style.css';
import './semiconductor-map.css';
const structure=[
 {id:'eda',name:'EDA / IP',description:'工具、验证与可复用IP支撑芯片设计。',x:0,y:130},
 {id:'design',name:'芯片设计',description:'把应用需求转化为芯片功能与电路。',x:260,y:130},
 {id:'manufacturing',name:'晶圆制造',description:'通过晶圆工艺制造器件；区分代工与IDM。',x:520,y:130},
 {id:'packaging',name:'封装测试',description:'完成封装、互连及测试，验证产品功能。',x:780,y:130},
 {id:'applications',name:'终端应用',description:'计算、通信、汽车、工业和消费等终端需求。',x:1040,y:130},
 {id:'cleanroom',name:'洁净室与厂务',description:'提供厂房洁净环境与公用工程。',x:260,y:0},
 {id:'equipment',name:'半导体设备',description:'通过光刻、刻蚀、沉积等设备实现工艺。',x:520,y:0},
 {id:'materials',name:'半导体材料',description:'提供硅片、气体、化学品及封装材料。',x:780,y:0},
 {id:'power',name:'功率与分立器件',description:'按器件与应用另设研究分支，可能跨设计、制造与封装。',x:780,y:270},
];
const connections=[['eda','design'],['design','manufacturing'],['manufacturing','packaging'],['packaging','applications'],['cleanroom','manufacturing'],['equipment','manufacturing'],['materials','manufacturing'],['materials','packaging'],['power','applications']];
type IndustryNode=Node<{name:string;active:boolean;support:boolean;choose:()=>void},'research'>;
function ResearchNode({data}:NodeProps<IndustryNode>){return <><Handle type="target" position={Position.Left}/><button className="sc-map-node" aria-label={'选择'+data.name} aria-pressed={!!data.active} onClick={()=>data.choose()}><Workflow size={17}/><strong>{data.name}</strong><small>{data.support?'生产支撑':'产业环节'}</small></button><Handle type="source" position={Position.Right}/></>;}
const nodeTypes={research:ResearchNode};
export default function SemiconductorMap({layers}:{layers:any[]}){
 const [selected,setSelected]=useState('manufacturing'),[compact,setCompact]=useState(()=>window.matchMedia?.('(max-width:900px)').matches??true),[notice,setNotice]=useState('');
 const container=useRef<HTMLElement>(null),reduced=useUiReducedMotion();
 useEffect(()=>{const media=window.matchMedia?.('(max-width:900px)');if(!media)return;const sync=()=>setCompact(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync);},[]);
 const item=structure.find(n=>n.id===selected)!,layer=layers.find(l=>l.id===selected),near=new Set(connections.filter(([a,b])=>a===selected||b===selected).flat());
 const names=(index:number)=>connections.filter(c=>c[1-index]===selected).map(c=>structure.find(n=>n.id===c[index])!.name).join('、');
 const nodes=structure.map(n=>({id:n.id,type:'research',position:{x:n.x,y:n.y},width:210,height:80,data:{...n,active:n.id===selected,support:['cleanroom','equipment','materials'].includes(n.id),choose:()=>setSelected(n.id)},className:near.has(n.id)?'is-related':''}));
 const edges=connections.map(([source,target])=>({id:source+'-'+target,source,target,type:'smoothstep',animated:false,style:{stroke:source===selected||target===selected?'var(--accent)':'var(--line)',strokeWidth:source===selected||target===selected?2:1.5}}));
 const fullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(container.current?.requestFullscreen)await container.current.requestFullscreen();else setNotice('当前浏览器不支持全屏，可使用图内缩放与适应视图。');}catch{setNotice('未能进入全屏，可使用图内缩放与适应视图。');}};
 return <section className="sw-section sc-map" ref={container} aria-label="半导体产业流程地图"><header><div><h2>产业流程地图</h2><p>选择环节，查看上下游与对应研究入口</p></div>{!compact&&<button className="outline-button" onClick={fullscreen}><Maximize2 size={16}/>全屏</button>}</header>
 {compact?<nav className="sc-map-mobile" aria-label="产业地图节点">{structure.map(n=><button key={n.id} aria-label={'选择'+n.name} aria-pressed={selected===n.id} onClick={()=>setSelected(n.id)}><Workflow size={16}/><span>{n.name}</span></button>)}</nav>:<div className="sc-map-canvas"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:0.08}} minZoom={0.4} maxZoom={1.8} nodesDraggable={false} nodesConnectable={false} edgesReconnectable={false} elementsSelectable={false} nodesFocusable={false} edgesFocusable={false} zoomOnScroll={false} zoomOnDoubleClick={false} deleteKeyCode={null}><Controls showInteractive={false}/><Background gap={24} color="var(--line)"/></ReactFlow></div>}
 <motion.div key={selected} initial={reduced?false:{opacity:0,transform:'translateY(3px)'}} animate={{opacity:1,transform:'translateY(0px)'}} transition={{duration:reduced?0:0.15}} className="sc-map-detail" role="region" aria-label="当前产业节点"><h3>{item.name}</h3><p>{layer?.description||item.description}</p><p className="provenance">上游 / 支撑：{names(0)||'本图未单列'}；下游：{names(1)||'终端需求与使用场景'}</p>{layer&&<><Link className="outline-button" to={semiconductorLayerPath(layer.id)}>查看本层指标与证据</Link><div className="sc-map-companies">{layer.companies.slice(0,4).map((c:any)=><Link key={c.code} to={'/industry/semiconductors/companies/'+c.code+'?fromLayer='+layer.id}>研究{c.name}</Link>)}</div></>}<small>简化产业结构，不据结构关系确认采购或受益；具体产品BOM进入细分环节查看。</small></motion.div>
 {notice&&<p role="status">{notice}</p>}<a className="sw-source" href={taxonomySource} target="_blank" rel="noopener noreferrer">结构参考 · OECD半导体价值链</a></section>;
}
