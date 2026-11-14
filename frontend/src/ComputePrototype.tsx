import {createRoot} from 'react-dom/client';
import {BrowserRouter,Link,Navigate,Route,Routes,useLocation} from 'react-router-dom';
import {Cpu,Home,Layers3,Star} from 'lucide-react';
import Sidebar,{SidebarLabel} from './Sidebar';
import {PreferenceProvider,usePreferences} from './personal-preferences';
import ComputeResearch,{ComputeResearchMenu,ComputeDebug} from './ComputeResearch';
import {COMPUTE_ROOT} from './compute-research';
import brandMark from '../../web/v2/assets/imgGuanlanLogoMarkHdPng.png';
import './style.css';
import './theme.css';
import './motion.css';
import './typography.css';
import './industry-tree.css';
function Shell(){const {preferences,save}=usePreferences(),location=useLocation();return <><Sidebar><Link className="brand" to={COMPUTE_ROOT}><img src={brandMark} alt="观澜" onError={e=>{e.currentTarget.style.visibility='hidden';}}/><div><strong>观澜</strong><small>专业的A股研究平台</small></div></Link><nav aria-label="主导航"><Link to={COMPUTE_ROOT}><Home/><SidebarLabel>首页</SidebarLabel></Link><Link to={COMPUTE_ROOT} className="active"><Layers3/><SidebarLabel>产业价值研究</SidebarLabel></Link><ComputeResearchMenu/><a href="http://127.0.0.1:38933/next/my-research" target="_blank" rel="noopener noreferrer"><Star/><SidebarLabel>我的股票 · 我的研究</SidebarLabel></a></nav></Sidebar><header className="topbar"><span>产业价值研究</span><span className="compute-preview-top-note">本地交互预览 · 未发布线上</span><button className="outline-button" onClick={()=>save({theme:preferences.theme==='light'?'dark':'light'})}>{preferences.theme==='light'?'切换深色':'切换浅色'}</button><Link className="outline-button" to="/debug">Debug</Link></header><main className="route-content"><Routes location={location}><Route path="/" element={<Navigate to={COMPUTE_ROOT} replace/>}/><Route path="/debug" element={<ComputeDebug/>}/><Route path="*" element={<ComputeResearch/>}/></Routes></main><footer><span><Cpu size={13}/> AI 算力 · 液冷研究样板</span><span>公开证据冻结包 · 不抓取实时行情 · 零自动模型调用</span></footer></>;}
createRoot(document.getElementById('root')!).render(<BrowserRouter basename="/next/compute-preview"><PreferenceProvider account="compute-local-prototype"><Shell/></PreferenceProvider></BrowserRouter>);
