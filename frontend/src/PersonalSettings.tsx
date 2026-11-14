import {useState} from 'react';
import {Palette,BookOpen,RotateCcw,Check} from 'lucide-react';
import {defaultPreferences,entryPages,usePreferences,type Preferences} from './personal-preferences';
import './personal-settings.css';
export default function PersonalSettings({onClose}:{onClose:()=>void}){
 const {preferences,save}=usePreferences(),[draft,setDraft]=useState<Preferences>(()=>({...preferences,topics:[...preferences.topics]})),[topics,setTopics]=useState(preferences.topics.join('，')),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 const set=(key:keyof Preferences,value:string)=>{setDraft(v=>({...v,[key]:value}));setSaved(false);setError('');};
 return <form className="personal-settings" onSubmit={e=>{e.preventDefault();const list=topics.split(/[,，、\n]/).map(x=>x.trim()).filter(Boolean);if(list.length>8||list.some(x=>x.length>24)){setError('最多保存8个方向，每个方向不超过24字。');return;}try{save({...draft,topics:list});setSaved(true);setError('');}catch{setSaved(false);setError('设置未保存：浏览器存储不可用或空间不足。草稿仍保留，请允许站点存储后重试。');}}}>
  <p className="settings-scope">仅保存此浏览器，按账号隔离；暂不同步其他设备。</p>
  <section aria-labelledby="appearance-title"><h3 id="appearance-title"><Palette size={18}/>界面偏好</h3><p>调整阅读与操作体验，不改变行情刷新频率。</p>
   <label className="settings-row"><span>外观主题<small>适合当前环境的明暗对比</small></span><select aria-label="外观主题" value={draft.theme} onChange={e=>set('theme',e.target.value)}><option value="dark">深色</option><option value="light">浅色</option></select></label>
   <label className="settings-row"><span>页面字号<small>缩放界面文字，图表坐标不变；触控区域不缩小，手机输入框保留可读字号下限。浏览器仍可自由缩放。</small></span><select aria-label="页面字号" value={draft.fontScale} onChange={e=>set('fontScale',e.target.value)}><option value="small">小号 · 90%</option><option value="standard">标准 · 100%</option><option value="large">大号 · 110%</option></select></label>
   <label className="settings-row"><span>信息密度<small>只调整留白，行情与操作文字不缩小</small></span><select aria-label="信息密度" value={draft.density} onChange={e=>set('density',e.target.value)}><option value="comfortable">标准</option><option value="compact">紧凑</option></select></label>
   <label className="settings-row"><span>显示模式<small>自动按屏宽切换；手机版用底部导航，桌面版用侧栏。内容始终自适应，不改变数据。</small></span><select aria-label="显示模式" value={draft.displayMode} onChange={e=>set('displayMode',e.target.value)}><option value="auto">自动适配（推荐）</option><option value="mobile">手机版 · 底部导航</option><option value="desktop">桌面版 · 侧边导航</option></select></label>
   <label className="settings-row"><span>桌面导航状态<small>仅影响侧栏，底部收起／展开按钮仍可随时切换</small></span><select aria-label="导航状态" value={draft.sidebar} onChange={e=>set('sidebar',e.target.value)}><option value="auto">随屏幕大小</option><option value="expanded">展开</option><option value="collapsed">仅图标</option></select></label>
   <label className="settings-row"><span>动态效果<small>系统要求减少动画时始终优先遵循</small></span><select aria-label="动态效果" value={draft.motion} onChange={e=>set('motion',e.target.value)}><option value="system">跟随系统</option><option value="reduced">减少动画</option></select></label>
  </section>
  <section aria-labelledby="research-title"><h3 id="research-title"><BookOpen size={18}/>研究偏好</h3><p>帮助进入常用工作流，不改变题材判断与榜单排序。</p>
   <label className="settings-row"><span>默认进入页面<small>仅新打开首页入口时跳转，不覆盖直接链接</small></span><select aria-label="默认进入页面" value={draft.defaultPage} onChange={e=>set('defaultPage',e.target.value)}>{entryPages.map(([path,label])=><option value={path} key={path}>{label}</option>)}</select></label>
   <label className="settings-row"><span>普通回答详略<small>仅影响表达；固定报告仍完整输出必需章节和数字依据</small></span><select aria-label="普通回答详略" value={draft.reportDetail} onChange={e=>set('reportDetail',e.target.value)}><option value="concise">简明</option><option value="standard">标准</option><option value="detailed">详细</option></select></label>
   <label className="settings-topics">常用题材方向<textarea aria-label="常用题材方向" rows={2} value={topics} placeholder="例如：商业航天，半导体设备，机器人" onChange={e=>{setTopics(e.target.value);setSaved(false);setError('');}}/><small>最多8个，用逗号分隔；作为异动接力的快捷检索，不自动筛掉其他题材。</small></label>
   <p className="settings-boundary">深度思考仍在每次提问时单独选择，不随偏好开启或关闭。</p>
  </section>
  {error&&<p role="alert" className="local-error">{error}</p>}{saved&&<p role="status" className="settings-saved"><Check size={16}/>设置已保存</p>}
  <div className="settings-actions"><button type="button" className="outline-button" onClick={()=>{setDraft({...defaultPreferences,topics:[]});setTopics('');setSaved(false);setError('');}}><RotateCcw size={15}/>恢复默认</button><span/><button type="button" className="outline-button" onClick={onClose}>{saved?'完成':'取消'}</button><button className="primary" type="submit">保存设置</button></div>
 </form>;
}
