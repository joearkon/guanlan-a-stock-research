import {useEffect,useState,Suspense} from 'react';
import {BellPlus,X} from 'lucide-react';
import {Drawer,Skeleton} from './components';
import {OfficialRuleEditor as BoardAlertEditor} from './OfficialServices';
import {usePrivacy} from './Privacy';
import {motion} from 'motion/react';
import {uiMotion} from './motion-tokens';
import {useUiReducedMotion} from './personal-preferences';
const RuleEditor=BoardAlertEditor;
export default function FollowAlertOffer({account}:{account:string}){
 const [offer,setOffer]=useState<any>(null),[open,setOpen]=useState(false),[selected,setSelected]=useState(0),{hidden}=usePrivacy(),reduced=useUiReducedMotion();
 useEffect(()=>{setOffer(null);setOpen(false);const receive=(e:any)=>{if(account==='guest'||e.detail?.accountId!==account||!Array.isArray(e.detail.targets))return;const targets=e.detail.targets.filter((t:any)=>t&&['stock','board'].includes(t.targetType)&&typeof t.name==='string'&&(t.targetType==='board'||/^\d{6}$/.test(t.code))).slice(0,30);if(targets.length){setOffer({account,targets});setSelected(0);setOpen(false);}};window.addEventListener('guanlan-follow-alert-offer',receive);return()=>window.removeEventListener('guanlan-follow-alert-offer',receive);},[account]);
 if(!offer||offer.account!==account)return null;const target=offer.targets[selected]||offer.targets[0];
 return <><motion.aside className="follow-alert-offer" aria-label="关注后的提醒选项" role="status" initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:uiMotion.panel,ease:uiMotion.ease}}>
  <div><BellPlus size={18}/><strong>关注已保存</strong><button className="icon-button" aria-label="暂不设置异动提醒" onClick={()=>setOffer(null)}><X size={16}/></button></div>
  <p>{hidden?'新关注对象':target.name}{offer.targets.length>1?' 等 '+offer.targets.length+' 个对象':''} · 可按需设置异动提醒</p><p className="provenance">不会自动开启规则、声音或系统推送。</p><button className="outline-button" onClick={()=>setOpen(true)}>开启异动提醒</button>
 </motion.aside><Drawer open={open} onOpenChange={setOpen} title="设置关注对象的异动提醒">{offer.targets.length>1&&<label>选择新关注对象<select aria-label="选择新关注对象" value={selected} onChange={e=>setSelected(Number(e.target.value))}>{offer.targets.map((t:any,i:number)=><option key={i} value={i}>{hidden?'对象 '+(i+1):t.name}</option>)}</select></label>}<Suspense fallback={<Skeleton label="异动提醒设置"/>}>{target.targetType==='stock'?<RuleEditor key={target.code} code={target.code} movement onSaved={()=>{setOpen(false);setOffer(null);}}/>:<BoardAlertEditor key={target.provider+':'+target.code} target={target.choose?undefined:target} onSaved={()=>{setOpen(false);setOffer(null);}}/>}</Suspense></Drawer></>;
}
