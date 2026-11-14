import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {Eye,EyeOff,ShieldCheck} from 'lucide-react';
import './privacy.css';
type PrivacyState={hidden:boolean;warning:string;available:boolean;toggle:()=>void};
const PrivacyContext=createContext<PrivacyState>({hidden:false,warning:'',available:false,toggle:()=>{}});
const storageKey=(account:string)=>'guanlan.privacy.v1.'+encodeURIComponent(account);
function read(account:string){
 if(!account||account==='guest')return true;
 try{const value=localStorage.getItem(storageKey(account));return value===null?false:value!=='false';}catch{return true;}
}
export function PrivacyProvider({account,children}:{account:string;children:ReactNode}){
 const [state,setState]=useState(()=>({account,hidden:read(account),warning:''}));
 // Re-scope before children render; never expose the previous account's choice.
 if(state.account!==account)setState({account,hidden:read(account),warning:''});
 useEffect(()=>{const sync=(e:StorageEvent)=>{if(e.key===storageKey(account)||e.key===null)setState({account,hidden:read(account),warning:''});};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[account]);
 const available=!!account&&account!=='guest',hidden=state.account===account?state.hidden:read(account);
 function toggle(){if(!available)return;const next=!hidden;let warning='';try{localStorage.setItem(storageKey(account),String(next));}catch{warning='隐私设置仅本次会话生效；浏览器未允许保存。';}setState({account,hidden:next,warning});}
 return <PrivacyContext.Provider value={{hidden,warning:state.warning,available,toggle}}>{children}</PrivacyContext.Provider>;
}
export const usePrivacy=()=>useContext(PrivacyContext);
export function PrivacyToggle(){const p=usePrivacy();if(!p.available)return null;return <span className="privacy-control"><button type="button" className={'outline-button privacy-toggle'+(p.hidden?' is-private':'')} aria-label={p.hidden?'关闭隐私模式':'开启隐私模式'} aria-pressed={p.hidden} title={p.hidden?'隐私模式：已隐藏个人持仓数据':'隐藏股数、成本、持仓金额与盈亏；公开行情不受影响'} onClick={p.toggle}>{p.hidden?<EyeOff size={17}/>:<Eye size={17}/>}<span>{p.hidden?'已隐藏':'隐私'}</span></button>{p.warning&&<span className="privacy-warning" role="status">{p.warning}</span>}</span>;}
export function PrivateValue({children}:{children:ReactNode}){const {hidden}=usePrivacy();return hidden?<span className="private-value" aria-label="已隐藏">***</span>:<>{children}</>;}
export function PrivacyGuard({children}:{children:ReactNode}){const p=usePrivacy();return p.hidden?<div className="privacy-guard"><ShieldCheck size={22}/><div><strong>隐私模式已开启</strong><p>此区域包含个人记录或输入内容，关闭隐私模式后查看和编辑。仅遮挡显示，不修改原始数据。</p><PrivacyToggle/></div></div>:<>{children}</>;}
