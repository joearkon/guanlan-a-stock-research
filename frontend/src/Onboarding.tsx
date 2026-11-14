import {createContext,useContext,useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {motion} from 'motion/react';
import {ArrowLeft,ArrowRight,Compass,X} from 'lucide-react';
import {useUiReducedMotion,useMobileLayout} from './personal-preferences';
import {uiMotion} from './motion-tokens';
import './onboarding.css';
import {tourSteps,type TourEdition}from'./onboarding-content';

const version='v3';
const key=(edition:TourEdition,account:string,layout:string)=>'guanlan.onboarding.'+version+'.'+edition+'.'+encodeURIComponent(account)+'.'+layout;
const Tour=createContext({start:()=>{},edition:'saas' as TourEdition});
export const useOnboarding=()=>useContext(Tour);
export default function OnboardingProvider({account,ready,edition='saas',children}:{account:string;ready:boolean;edition?:TourEdition;children:ReactNode}){
 const mobile=useMobileLayout(),layout=mobile?'mobile':'desktop',visited=useRef(new Set<string>()),[state,setState]=useState<{account:string;edition:TourEdition;layout:string;index:number;kind:'full'|'updates'}|null>(null),[warning,setWarning]=useState('');
 const steps=tourSteps(mobile,state?.kind==='updates',edition),eligible=ready&&!!account&&account!=='guest';
 useEffect(()=>{
  const visit=edition+'.'+account+'.'+layout;if(!eligible||visited.current.has(visit))return;visited.current.add(visit);if(state?.account===account&&state.edition===edition)return;
  let seen=false,returning=false;
  try{
   const valid=(s:any,v:string)=>s?.version===v&&['completed','skipped'].includes(s.status),read=(k:string)=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}},current=read(key(edition,account,layout)),other=read(key(edition,account,mobile?'desktop':'mobile'));
   seen=valid(current,version)&&current.edition===edition;
   returning=valid(other,version)&&other.edition===edition||['desktop','mobile'].some(mode=>valid(read('guanlan.onboarding.v2.'+encodeURIComponent(account)+'.'+mode),'v2'))||valid(read('guanlan.onboarding.v1.'+encodeURIComponent(account)),'v1');
  }catch{}
  if(!seen)setState({account,edition,layout,index:0,kind:returning?'updates':'full'});
 },[account,edition,eligible,layout,mobile,state]);
 const start=()=>{if(eligible){setWarning('');setState({account,edition,layout,index:0,kind:'full'});}};
 const finish=(status:'completed'|'skipped')=>{if(!state)return;try{for(const mode of new Set([state.layout,layout]))localStorage.setItem(key(state.edition,state.account,mode),JSON.stringify({version,edition:state.edition,status,kind:state.kind}));setWarning('');}catch{setWarning('当前浏览器无法保存引导状态；刷新后可能再次出现。');}setState(null);};
 const active=eligible&&state?.account===account&&state.edition===edition;
 return <Tour.Provider value={{start,edition}}>{children}{warning&&<p className="sr-only" role="status">{warning}</p>}{active&&<Guide steps={steps} updates={state.kind==='updates'} index={state.index} onPrevious={()=>setState({...state,index:state.index-1})} onNext={()=>state.index===steps.length-1?finish('completed'):setState({...state,index:state.index+1})} onSkip={()=>finish('skipped')}/>}</Tour.Provider>;
}
type Rect={left:number;top:number;width:number;height:number};
function Guide({steps,updates,index,onPrevious,onNext,onSkip}:{steps:ReturnType<typeof tourSteps>;updates:boolean;index:number;onPrevious:()=>void;onNext:()=>void;onSkip:()=>void}){
 const step=steps[index],reduced=useUiReducedMotion(),mobile=useMobileLayout(),card=useRef<HTMLDivElement>(null),next=useRef<HTMLButtonElement>(null);
 const [box,setBox]=useState<{target:Rect|null;left:number;top:number;width:number;viewport:[number,number]}>({target:null,left:16,top:80,width:340,viewport:[0,0]});
 useLayoutEffect(()=>{
  if(card.current)card.current.scrollTop=0;
  const targets=[...document.querySelectorAll<HTMLElement>('[data-tour="'+step.target+'"]'),...document.querySelectorAll<HTMLElement>('[data-tour="'+(step.fallback||step.target)+'"]')];
  const target=targets.find(node=>{const r=node.getBoundingClientRect();return r.width>0&&r.height>0;});target?.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'instant'});
  const measure=()=>{const w=window.innerWidth,h=window.innerHeight,width=Math.min(360,w-24),height=Math.min(card.current?.offsetHeight||310,h-24),raw=target?.getBoundingClientRect();let r:Rect|null=null;
   if(raw&&raw.width>0&&raw.height>0){const left=Math.max(8,raw.left-6),top=Math.max(8,raw.top-6),right=Math.min(w-8,raw.right+6),bottom=Math.min(h-8,raw.bottom+6);if(right>left&&bottom>top)r={left,top,width:right-left,height:bottom-top};}
   let left=(w-width)/2,top=(h-height)/2;
   if(w<640){left=12;top=Math.max(12,r&&r.top>h/2?Math.min(h-height-16,r.top-height-12):h-height-16);}else if(r){if(r.left+r.width+width+32<w){left=r.left+r.width+16;top=r.top;}else{left=Math.max(12,Math.min(r.left,w-width-12));top=r.top+r.height+height+28<h?r.top+r.height+16:r.top-height-16;}}
   top=Math.max(12,Math.min(top,h-height-12));const value={target:r,left,top,width,viewport:[w,h] as [number,number]};setBox(old=>JSON.stringify(old)===JSON.stringify(value)?old:value);
  };measure();window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;if(target)observer?.observe(target);if(card.current)observer?.observe(card.current);return()=>{window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true);observer?.disconnect();};
 },[step.id,mobile]);
 const r=box.target,[w,h]=box.viewport,outline=r?`M0 0H${w}V${h}H0Z M${r.left} ${r.top}v${r.height}h${r.width}v-${r.height}Z`:`M0 0H${w}V${h}H0Z`;
 return <Dialog.Root open onOpenChange={open=>!open&&onSkip()}><Dialog.Portal><Dialog.Overlay className="tour-overlay"><svg width="100%" height="100%" aria-hidden="true"><path d={outline} fill="rgba(0,0,0,.65)" fillRule="evenodd"/>{r&&<rect x={r.left} y={r.top} width={r.width} height={r.height} rx={7} className="tour-spotlight"/>}</svg></Dialog.Overlay><Dialog.Content asChild onOpenAutoFocus={e=>{e.preventDefault();card.current?.focus({preventScroll:true});}} onInteractOutside={e=>e.preventDefault()}><motion.div ref={card} className="tour-card" style={{left:box.left,top:box.top,width:box.width}} initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:uiMotion.normal,ease:uiMotion.ease}}>
  <div className="tour-card-top"><span><Compass size={16}/>{updates?'最近功能更新':'观澜快速上手'}</span><button type="button" className="icon-button" aria-label="关闭引导" onClick={onSkip}><X size={17}/></button></div>
  <motion.div key={step.id} initial={reduced?false:{opacity:0,x:5}} animate={{opacity:1,x:0}} transition={{duration:reduced?0:uiMotion.normal}}><span className="tour-group">{step.group}</span><Dialog.Title>{step.title}</Dialog.Title><Dialog.Description>{step.body}</Dialog.Description><ol className="tour-task-list" aria-label="操作步骤">{step.actions.map(a=><li key={a}>{a}</li>)}</ol><p className="tour-tip">{step.tip}</p>{step.link&&<a className="tour-release-link" href={step.link.href} onClick={onSkip}>{step.link.label}</a>}{updates&&index===steps.length-1&&<a className="tour-release-link" href="/next/updates" onClick={onSkip}>查看完整版本更新</a>}</motion.div>
  <div className="tour-progress" aria-label="引导进度"><span>{index+1} / {steps.length}</span><div aria-hidden="true">{steps.map((s,i)=><i key={s.id} data-current={i===index} data-done={i<index}/>)}</div></div>
  <div className="tour-actions"><button type="button" className="tour-skip" onClick={onSkip}>跳过引导</button><div>{index>0&&<button type="button" className="outline-button" onClick={onPrevious}><ArrowLeft size={14}/>上一步</button>}<button ref={next} type="button" className="primary" onClick={onNext}>{index===steps.length-1?(updates?'继续使用':'开始使用'):'下一步'}<ArrowRight size={14}/></button></div></div>
 </motion.div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
