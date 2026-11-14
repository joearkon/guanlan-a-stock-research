import {createContext,useContext,useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {motion} from 'motion/react';
import {ArrowLeft,ArrowRight,Compass,X} from 'lucide-react';
import {useUiReducedMotion,useMobileLayout} from './personal-preferences';
import {uiMotion} from './motion-tokens';
import './onboarding.css';

const version='v2',key=(account:string,layout:string)=>'guanlan.onboarding.'+version+'.'+encodeURIComponent(account)+'.'+layout;
const baseSteps=[
 {id:'navigation',target:'navigation',group:'认识工作区',title:'从这里切换工作区',body:'按研究目的选择入口，不需要一次看完所有页面。',actions:['盯盘：看实时变化、异动接力与竞价。','复盘：看市场、资金与事件证据。','产业研究：看生意、经营兑现与价值。'],tip:'侧栏底部按钮收起/展开导航；悬停图标只显示名称，不自动展开。'},
 {id:'search',target:'search',group:'搜索与个股',title:'搜索一家公司',body:'输入名称或六位代码，从联想结果打开个股行情抽屉。',actions:['按 Ctrl / ⌘ + K 快速定位搜索。','产业研究下方的「个股档案」独立查看K线、财务与公告，不要求先加入自选。','深挖结论与报告在「我的股票 → 我的研究」管理。'],tip:'搜索与加入自选是两个动作；选中证券不会自动加入名单。'},
 {id:'review',target:'review',fallback:'navigation',group:'复盘',title:'复盘：先看环境，再看接力',body:'在复盘里切换市场全景、情绪与接力、方向与支撑。',actions:['市场全景核对指数、量能、涨跌分布与业务日期。','情绪与接力区分连续板天梯、多日多板、真正首板和已披露龙虎榜。','个股名称打开行情抽屉；板数、原始原因和席位证据独立核对。'],tip:'单日榜与多日累计不能混加；高换手、机构净买和高板都不等于买点。'},
 {id:'screener',target:'review',fallback:'navigation',group:'条件观测',title:'自己筛选，不必只看平台预设',body:'在复盘的「条件观测」中，先选预设，再按需要组合条件。',actions:['默认盘后收盘；明确切换后才使用盘中共享快照。','主板涨停、创业板>10%、双创>15%等预设可继续修改。','行业、概念和更多价量条件在筛选抽屉里调整，点击应用后查询；方案可保存到账户。'],tip:'涨幅下限严格大于；先全范围筛选再分页，缺数据单列。阅读不会自动重排或重新抓全市场。'},
 {id:'industry-map',target:'industry',group:'产业研究',title:'沿产业链找到公司的位置',body:'先看产业如何组成，再下钻到环节和公司。',actions:['从产业总览选择算力、半导体、AI应用、影视、机器人等已开放主题。','沿价值链 / BOM 查看需求如何传到业务，公司目录与完整财报案例分别展示。','进入公司详情，核对赚钱方式、业务受益条件、壁垒、财报和原文。'],tip:'建设中表示尚未完成研究；公司业务相关不等于本轮一定受益，目录收录不等于已完成尽调。'},
 {id:'data',target:'data-status',group:'资料时效',title:'先核对时间和来源',body:'右下角可查看正在读取什么，以及哪些资料来自缓存。',actions:['报价看报价时间，财报看报告期。','点击指标或报告来源，回到原文核对口径。','更新失败保留旧数据，同时保留原来的日期。'],tip:'获取时间不是披露时间；读取成功和缓存命中都不等于实时。'},
 {id:'industry-report',target:'industry',group:'产业研究',title:'读报告，再保存个人研究',body:'平台公开研究、后台研报更新和你自己的研究分开管理。',actions:['点击小型「研报更新」入口，查看本轮摘要、来源和历史版本。','公司目录中查看业务依据；没有找到目标公司，可从「研究其他公司」进入个人草稿。','公司详情阅读经营与四问；确认发送个人研究才会调用模型。'],tip:'阅读、刷新与恢复旧版本不重复调用模型；更新失败保留原报告与原日期，未取得资料不编造。'},
 {id:'battle',target:'battle',group:'我的作战看板',title:'搭建我的作战看板',body:'在「我的股票」上方打开自己的观察工作区。',actions:['先选择适合自己的布局预设。','组合市场、自选、持仓和研究等已开放面板。','组件复用共享资料，不另行扫描全市场。'],tip:'布局按账号保存在当前浏览器，暂不跨设备同步；清理浏览器数据会丢失布局。'},
 {id:'battle-add',target:'battle-add',fallback:'battle',group:'我的作战看板',title:'添加需要的观察组件',body:'在看板右上角点「添加组件」，按需要选取内容。',actions:['搜索组件名称，选择一个或多个组件。','同类组件可分别配置不同证券对象。','组件设置可修改名称、对象或显示状态。'],tip:'配置观察对象不会自动加入自选、修改持仓，也不会调用AI。'},
 {id:'battle-layout',target:'battle-layout',fallback:'battle',group:'我的作战看板',title:'调整大小与排列顺序',body:'点击「编辑布局」，按自己的阅读顺序摆放。',actions:['按住拖动柄移动，松开后保存顺序。','拖动尺寸柄，或在设置里调整宽高。','按 Escape 取消本次调整，需要时可撤销。'],tip:'隐藏不等于删除；布局管理可恢复隐藏组件，替换预设会先要求确认。'},
 {id:'stocks',target:'stocks',group:'我的股票',title:'区分自选和真实持仓',body:'自选用于观察，持仓只记录你确认发生的交易或录入。',actions:['持仓支持截图本地识别或表格导入；裁剪表格并遮挡个人信息后开始识别。','逐行核对证券、股数、成本，已有持仓明确选择覆盖、新增或跳过，确认后才保存。','拖动柄保存手动顺序；每行「管理 / 编辑」处理分组、移除或持仓。'],tip:'截图识别不等于真实成交流水；缺失数字不猜。页面分析不是成交记录，AI不会替你下单。'},
 {id:'research',target:'stocks',group:'我的研究',title:'找回保存的研究与历史',body:'从「我的股票 → 我的研究」回看当前账号保存的内容。',actions:['按公司与关键词查找个人研究记录。','阅读资料日期、引用和旧版本，再决定是否修订。','已完成AI报告可从问观澜历史会话恢复。'],tip:'阅读、刷新和历史恢复不等于重新调用模型。'},
 {id:'ask',target:'ask',group:'AI研究',title:'带着上下文问观澜',body:'从具体页面发起，更容易保留研究对象与证据版本。',actions:['先检查草稿中的公司、板块和资料日期。','按本次需要选择普通 / Skill及深度思考。','确认发送才启动研究，不要因等待重复提交。'],tip:'模型调用可能消耗额度；失败或刷新不会自动另起一个收费任务。'},
 {id:'account',target:'account',group:'说明与偏好',title:'说明和偏好，随时回来找',body:'在「我的」里设置阅读习惯，并随时重新开启引导。',actions:['个性化设置：主题、紧凑度、导航与减少动画。','关于与使用说明：查看数据、保存及研究边界。','新手引导：从头再看，不影响已有设置或资料。'],tip:'可随时跳过或按 Escape 关闭，不修改自选、持仓或触发模型。'}
];
function tourSteps(mobile:boolean,updates:boolean){
 const selected=updates?baseSteps.filter(s=>['navigation','review','screener','industry-report','stocks'].includes(s.id)):baseSteps;
 return selected.map(s=>{
  if(s.id==='navigation')return {...s,title:updates?(mobile?'手机常用入口重新整理':'最近的功能更新'):s.title,body:mobile?'底部固定：首页、盯盘、复盘、我的股票、更多；产业研究从「更多」进入。':s.body,tip:mobile?'「更多 → 使用说明 → 重新开始新手引导」可重看完整流程；更多菜单名称和顺序不变。':s.tip};
  if(mobile&&['industry-map','industry-report','battle','battle-add','battle-layout','research'].includes(s.id))return {...s,target:'more',fallback:'navigation',body:(s.id.startsWith('industry')?'从「更多 → 产业价值研究」进入。':s.id==='research'?'从「更多 → 我的研究」进入。':'从「更多 → 我的作战看板」进入。')+s.body};
  if(mobile&&s.id==='search')return {...s,actions:['点击顶部搜索，支持名称、六位代码或拼音首字母。','选中真实证券后打开行情抽屉，行业或概念可查看相关板块。','「更多 → 个股档案」查看完整资料，「更多 → 我的研究」回看个人研究。']};
  if(mobile&&s.id==='review')return {...s,body:'点击底部「复盘」，进入市场观测；三个页签保留各自业务日期。'};
  if(mobile&&s.id==='screener')return {...s,body:'从「更多 → 复盘与观测 → 条件观测」进入，先选预设，再组合条件。'};
  if(mobile&&s.id==='ask')return {...s,body:'从顶部或「更多 → 问观澜」进入，历史会话与研究依据按需打开。',actions:['输入问题并明确点击发送；手机换行不会直接发送。','专家模式仅预填问题，深度思考以发送前选择为准。','旧任务恢复失败可重新核对，或暂不恢复；不会自动重提旧任务。']};
  return s;
 });
}
const Tour=createContext({start:()=>{}});
export const useOnboarding=()=>useContext(Tour);
export default function OnboardingProvider({account,ready,children}:{account:string;ready:boolean;children:ReactNode}){
 const mobile=useMobileLayout(),layout=mobile?'mobile':'desktop',visited=useRef(new Set<string>()),[state,setState]=useState<{account:string;layout:string;index:number;kind:'full'|'updates'}|null>(null),[warning,setWarning]=useState('');
 const steps=tourSteps(mobile,state?.kind==='updates');
 const eligible=ready&&!!account&&account!=='guest';
 useEffect(()=>{const visit=account+'.'+layout;if(!eligible||visited.current.has(visit))return;visited.current.add(visit);if(state?.account===account)return;let seen=false,returning=false;try{const valid=(s:any,v:string)=>s?.version===v&&['completed','skipped'].includes(s.status),read=(k:string)=>{try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}};seen=valid(read(key(account,layout)),version);returning=valid(read('guanlan.onboarding.v1.'+encodeURIComponent(account)),'v1')||valid(read(key(account,mobile?'desktop':'mobile')),version);}catch{}if(!seen)setState({account,layout,index:0,kind:returning?'updates':'full'});},[account,eligible,layout,mobile,state]);
 const start=()=>{if(eligible){setWarning('');setState({account,layout,index:0,kind:'full'});}};
 const finish=(status:'completed'|'skipped')=>{if(!state)return;try{for(const mode of new Set([state.layout,layout]))localStorage.setItem(key(state.account,mode),JSON.stringify({version,status,kind:state.kind}));setWarning('');}catch{setWarning('当前浏览器无法保存引导状态；刷新后可能再次出现。');}setState(null);};
 const active=eligible&&state?.account===account;
 return <Tour.Provider value={{start}}>{children}{warning&&<p className="sr-only" role="status">{warning}</p>}{active&&<Guide steps={steps} updates={state.kind==='updates'} index={state.index} onPrevious={()=>setState({...state,index:state.index-1})} onNext={()=>state.index===steps.length-1?finish('completed'):setState({...state,index:state.index+1})} onSkip={()=>finish('skipped')}/>}</Tour.Provider>;
}
type Rect={left:number;top:number;width:number;height:number};
function Guide({steps,updates,index,onPrevious,onNext,onSkip}:{steps:ReturnType<typeof tourSteps>;updates:boolean;index:number;onPrevious:()=>void;onNext:()=>void;onSkip:()=>void}){
 const step=steps[index],reduced=useUiReducedMotion(),mobile=useMobileLayout(),card=useRef<HTMLDivElement>(null),next=useRef<HTMLButtonElement>(null);
 const [box,setBox]=useState<{target:Rect|null;left:number;top:number;width:number;viewport:[number,number]}>({target:null,left:16,top:80,width:340,viewport:[0,0]});
 useLayoutEffect(()=>{
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
 return <Dialog.Root open onOpenChange={open=>!open&&onSkip()}><Dialog.Portal><Dialog.Overlay className="tour-overlay"><svg width="100%" height="100%" aria-hidden="true"><path d={outline} fill="rgba(0,0,0,.65)" fillRule="evenodd"/>{r&&<rect x={r.left} y={r.top} width={r.width} height={r.height} rx={7} className="tour-spotlight"/>}</svg></Dialog.Overlay><Dialog.Content asChild onOpenAutoFocus={e=>{e.preventDefault();next.current?.focus();}} onInteractOutside={e=>e.preventDefault()}><motion.div ref={card} className="tour-card" style={{left:box.left,top:box.top,width:box.width}} initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:uiMotion.normal,ease:uiMotion.ease}}>
  <div className="tour-card-top"><span><Compass size={16}/>{updates?'最近功能更新':'观澜快速上手'}</span><button type="button" className="icon-button" aria-label="关闭引导" onClick={onSkip}><X size={17}/></button></div>
  <motion.div key={step.id} initial={reduced?false:{opacity:0,x:5}} animate={{opacity:1,x:0}} transition={{duration:reduced?0:uiMotion.normal}}><span className="tour-group">{step.group}</span><Dialog.Title>{step.title}</Dialog.Title><Dialog.Description>{step.body}</Dialog.Description><ol className="tour-task-list" aria-label="操作步骤">{step.actions.map(a=><li key={a}>{a}</li>)}</ol><p className="tour-tip">{step.tip}</p>{updates&&index===steps.length-1&&<a className="tour-release-link" href="/next/updates" onClick={onSkip}>查看完整版本更新</a>}</motion.div>
  <div className="tour-progress" aria-label="引导进度"><span>{index+1} / {steps.length}</span><div aria-hidden="true">{steps.map((s,i)=><i key={s.id} data-current={i===index} data-done={i<index}/>)}</div></div>
  <div className="tour-actions"><button type="button" className="tour-skip" onClick={onSkip}>跳过引导</button><div>{index>0&&<button type="button" className="outline-button" onClick={onPrevious}><ArrowLeft size={14}/>上一步</button>}<button ref={next} type="button" className="primary" onClick={onNext}>{index===steps.length-1?(updates?'继续使用':'开始使用'):'下一步'}<ArrowRight size={14}/></button></div></div>
 </motion.div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
