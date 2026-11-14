import {BookOpen,Compass,Database,FolderHeart,LayoutDashboard,Search,ScanLine,Cpu}from'lucide-react';
import {useOnboarding}from'./Onboarding';
import './onboarding.css';
export default function HelpCenter({onRestart}:{onRestart?:()=>void}){
 const local=useOnboarding().edition==='harness';
 return <div className="help-center">
  <header><BookOpen size={25}/><h2>观澜 · 研究工作台</h2><p>盯盘看变化，复盘找对象，沿产业链和公开证据继续研究。</p>{onRestart&&<button type="button" className="primary help-tour" onClick={onRestart}><Compass size={17}/>重新开始新手引导</button>}</header>
  <section><Database size={20}/><h3>先看日期，再看结论</h3><p>顶部显示休市、盘中等交易状态，不代表每条报价都实时。报价时间、财报报告期、龙虎榜披露日和采集时间分别核对；右下角可查看读取状态。失败保留旧资料及其原日期，缺档不补零。</p></section>
  <section><ScanLine size={20}/><h3>按自己的条件观察</h3><p>复盘 → 条件观测保留平台预设与自定义，默认盘后，可显式切盘中共享快照。更多价量、行业和概念条件在抽屉中调整，明确应用才查询。</p><p>资金足迹与分歧分开显示近5/10日窗口机构净额与最近单日披露，累计榜不叠加重叠区间。表头可排序、逐日依据可查看；披露不是当前机构持仓。</p><p>{local?'筛选方案、自选、持仓与个人研究按账号保存在本机，不自动覆盖官网个人资料。':'筛选方案、自选、持仓与个人研究使用当前登录账号的云端资料，保存需要明确确认。'}</p></section>
  <section><Cpu size={20}/><h3>{local?'使用自己的 AI Agent':'明确发起AI研究'}</h3>{local?<><p>先选择Codex、WorkBuddy / CodeBuddy、Claude Code或DeepSeek，再检测、测试并连接。环境检测不调用模型，连接测试及研究使用自己的供方额度；状态灯与研究页显示当前Agent。</p><p>连接后可使用问观澜、AI盘面点评和个人AI研究，保留原生回答。模型和联网通常仍在供方云端；不自动发送持仓成本，不因失败换引擎或切平台扣费。</p><a className="outline-button" href="/next/local-ai">配置自己的 AI Agent</a><p>账号安全、提醒与通知继续在官网管理，本地提供入口。</p></>:<p>平台AI按账号权限与额度使用；先核对对象、公开依据和深度思考设置，确认发送才执行。浏览、刷新和重开历史不重新生成，失败先核对原任务，不自动另起收费调用。</p>}</section>
  <section><FolderHeart size={20}/><h3>平台研究与个人研究</h3><p>沿产业链查看公司业务和原文，研报更新入口保留摘要与版本。目录收录不等于尽调完成，建设中不借用其他对象的结论。</p><p>我的股票 → 我的研究可创建公司、产业或专题档案，保存文字笔记、AI报告及历史。平台资料更新不自动改写个人结论，文字笔记不调用AI。</p></section>
  <section><LayoutDashboard size={20}/><h3>自己的看板与关注对象</h3><p>我的作战看板可添加、移动、调尺寸或隐藏观察组件，复用共享资料；移除组件不删除自选和研究。布局只保存在当前浏览器，暂不跨设备同步。</p><p>自选用于观察，持仓只记录确认的股数与成本。电脑用管理/编辑，手机长按股票行打开操作，也有备用入口；截图或表格导入后须逐行核验。</p></section>
  <section><Search size={20}/><h3>偏好与常用操作</h3><p>个性化设置提供主题、小/标准/大字号、导航与减少动画。手机从更多 → 界面偏好进入；隐私模式遮挡个人数字，不代替账号安全。</p><p><kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd> 搜索，<kbd>Esc</kbd> 关闭弹层，<kbd>Tab</kbd> 移动焦点。手机输入回车只换行，明确点击发送才研究。</p><p>桌面“我的 → 新手引导”、手机“更多 → 使用说明 → 重新开始新手引导”可重看；版本更新记录实际发布内容。</p></section>
 </div>;
}
