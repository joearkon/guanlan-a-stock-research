export type TourEdition='saas'|'harness';
export type TourStep={id:string;target:string;fallback?:string;group:string;title:string;body:string;actions:string[];tip:string;link?:{href:string;label:string}};
const baseSteps:TourStep[]=[
 {id:'navigation',target:'navigation',group:'从这里开始',title:'从这里切换工作区',body:'观澜把看盘、复盘与研究放在同一个工作台。先找到今天想做的事。',actions:['盘中先到盯盘，看市场情绪、题材支撑和异动。','收盘后到复盘，看环境、筛选与资金披露。','需要深入时，进入产业研究或带着问题问观澜。'],tip:'侧栏底部可收起/展开导航；引导只作说明，不会修改资料或运行AI。'},
 {id:'search',target:'search',group:'搜索与个股',title:'搜索一家公司',body:'输入名称或六位代码，也支持拼音首字母；从联想结果打开行情抽屉。',actions:['按 Ctrl / ⌘ + K 快速定位搜索。','个股档案独立查看K线、财务和公告，不要求先加入自选。','正式笔记和AI报告在「我的股票 → 我的研究」管理。'],tip:'搜索、加入自选和创建研究是三个独立动作，选中证券不会自动保存。'},
 {id:'monitor',target:'monitor',fallback:'navigation',group:'盯盘',title:'从盘面变化找到活跃方向',body:'盯盘看实时动态、异动接力与竞价；先看群体表现，再核对个股事件。',actions:['热点题材看同向强股、支撑比例，展开梯队核对成员。','上榜角标只统计各方向前10，点开可看5/10日分布及同日双向记录。','提醒需另行保存、启用与渠道授权；关注不等于自动订阅。'],tip:'单股急拉不等于板块共振；休市读历史快照，缺档不补成0或未上榜。'},
 {id:'data',target:'data-status',fallback:'navigation',group:'资料时效',title:'先核对时间和来源',body:'顶部交易状态和资料日期分别看：休市、盘中，不代表每条报价同样新。',actions:['报价看时点，财报看报告期，龙虎榜看披露日。','右下角读取状态和模块来源用于核对缓存、日期与缺项。','更新失败保留旧内容和原日期，不把昨天资料改成今天。'],tip:'日历未覆盖会显示待核验；获取时间不等于披露时间，读取成功不等于实时。'},
 {id:'review',target:'review',fallback:'navigation',group:'复盘',title:'复盘：先看环境，再看接力',body:'市场全景、情绪与接力、方向与支撑各有分工，保留各自业务日期。',actions:['市场全景核对指数、量能、涨跌分布和风险偏好。','情绪与接力区分连续板、多日多板、首板和已披露席位。','方向与支撑看题材持续性；板块资金与雷达有独立入口。'],tip:'连续板不等于区间多次涨停；历史晋级率不是未来胜率，不把席位披露当实时持仓。'},
 {id:'screener',target:'review',fallback:'navigation',group:'条件观测',title:'自己筛选，不必只看平台预设',body:'在「复盘 → 条件观测」先选平台预设，再组合自己的条件。',actions:['默认盘后收盘，明确切换后才读盘中共享快照。','主板、创业板>10%、双创>15%可继续调整，行业/概念与更多价量条件在抽屉里。','草稿不会立即查询；点击应用后看结果，常用条件可保存为方案。'],tip:'涨幅下限严格大于；完整范围先筛选再分页，缺数据单列，阅读不会自动重排。'},
 {id:'funds',target:'review',fallback:'navigation',group:'资金足迹与分歧',title:'资金的单日与累计分开看',body:'进入「条件观测 → 资金足迹与分歧」，观察近期机构披露与价格分歧。',actions:['选择近5/10日，核对窗口起止和机构买方出现日数。','最近机构披露是单日数据，窗口机构净额看对应汇总口径；累计榜不重复相加。','表头可排序，逐日依据可展开；读取最新才换批次。'],tip:'披露不是连续买入或机构当前持仓；缺档、待收录、金额冲突与不符合分别保留。'},
 {id:'industry-map',target:'industry',fallback:'navigation',group:'产业研究',title:'沿产业链找到公司的位置',body:'从产业总览进入算力、半导体、AI应用、影视、机器人等已开放方向。',actions:['先看环节组成与需求传导，再进入公司业务。','核对财务、公告、报告期和原文，不只看概念名称。','目录和完整案例分开；没有找到公司也可创建自己的研究。'],tip:'建设中不是研究完成；业务相关不等于本轮必然受益，不补造订单和客户关系。'},
 {id:'industry-report',target:'industry',fallback:'navigation',group:'研报与版本',title:'读报告，再保存个人研究',body:'平台发布研究与自己的研究分开管理，更新入口保持紧凑。',actions:['点击「研报更新」看摘要、来源和历史版本。','选择公司或研究其他对象，先进入草稿并确认身份。','明确发送才运行AI，平台资料更新不自动改写自己的结论。'],tip:'查看、刷新和历史恢复不重新调用模型；失败保留旧报告与原日期。'},
 {id:'battle',target:'battle',fallback:'navigation',group:'我的作战看板',title:'搭建我的作战看板',body:'把市场、关注对象、资金和研究放在自己的观察屏幕。',actions:['从已开放组件中选择需要的内容。','同一屏关注指数、题材和自己的观察池。','组件复用共享资料，不另行扫描全市场。'],tip:'布局按账号保存在当前浏览器，暂不跨设备同步；清理浏览器数据会丢失布局。'},
 {id:'battle-add',target:'battle-add',fallback:'battle',group:'我的作战看板',title:'添加需要的观察组件',body:'在看板右上角点击「添加组件」，按需要组合。',actions:['搜索并选择一个或多个已开放组件。','同类组件可配置不同证券或板块。','组件设置修改名称、对象和显示状态。'],tip:'不会自动加入自选、修改持仓或调用AI；移除组件不删除原始记录。'},
 {id:'battle-layout',target:'battle-layout',fallback:'battle',group:'我的作战看板',title:'调整大小与排列顺序',body:'用移动与尺寸手柄安排自己的阅读顺序。',actions:['按住移动手柄拖动，松手保存；手机滑动内容优先滚动页面。','通过尺寸手柄或组件设置调整宽高。','Escape取消当前调整，误操作可撤销。'],tip:'隐藏不等于删除；布局管理可恢复隐藏组件，替换预设会要求确认。'},
 {id:'stocks',target:'stocks',fallback:'navigation',group:'自选与持仓',title:'区分自选和真实持仓',body:'自选保存关注对象，持仓只记录自己确认的股数和成本。',actions:['按分组查看，名称/代码、现价和涨跌幅优先显示，其他列可横向阅读。','电脑用「管理 / 编辑」；手机长按股票行打开操作，也可用备用入口。','截图识别或表格导入后逐行核对，明确新增、覆盖或跳过，再保存。'],tip:'截图识别不是成交流水，缺失数字不猜；观察与AI分析不会替你下单。'},
 {id:'research',target:'stocks',fallback:'navigation',group:'我的研究',title:'找回保存的研究与历史',body:'从「我的股票 → 我的研究」建立公司、产业或专题档案。',actions:['确认研究对象、资料截止日期和重点，再选择AI报告或文字笔记。','保留报告历史、引用与修订理由，不用新内容覆盖旧结论。','按公司或关键词查找，再决定哪些依据需要复核。'],tip:'阅读、刷新和历史恢复不重新生成报告；文字笔记不调用AI。'},
 {id:'ask',target:'ask',fallback:'navigation',group:'AI研究',title:'带着上下文问观澜',body:'从具体页面准备问题，更容易保留对象和公开证据版本。',actions:['检查草稿里的公司、板块与资料日期。','平台AI按账号权限和额度使用，深度思考以发送前选择为准。','确认发送才启动研究，等待或恢复失败时先核对原任务。'],tip:'打开页面不自动调用模型；失败或刷新不自动另起收费任务，模型结论仍需核验。'},
 {id:'account',target:'account',fallback:'navigation',group:'偏好与帮助',title:'说明和偏好，随时回来找',body:'设置适合自己的主题、字号和阅读方式，需要时可以重新开始引导。',actions:['个性化设置可选明暗主题、小/标准/大字号及减少动画。','隐私模式遮挡个人股数和成本，不影响公开行情；不能代替账号安全。','使用说明可重开引导，版本更新可看每次实际发布内容。'],tip:'可随时跳过、关闭或按Escape退出，不更改自选、持仓和研究设置。'}
];
const agent:TourStep={id:'local-agent',target:'local-ai',fallback:'ask',group:'自己的 AI Agent',title:'连接自己的 AI Agent',body:'先登录观澜读取共享资料，再连接自己的AI；这是两个独立账号。',actions:['从问观澜下方的「本地 AI Agent」或右上角状态灯打开配置。','选择Codex、WorkBuddy / CodeBuddy、Claude Code或DeepSeek，只检测选中的一项。','核对费用来源，主动测试并连接；成功后摘要显示当前Agent，可随时更换。'],tip:'检测不调用模型，连接测试和研究用自己的供方额度。失败不换平台扣费；不承诺手机可调用桌面Agent。',link:{href:'/next/local-ai',label:'配置自己的 AI Agent'}};
export function tourSteps(mobile:boolean,updates:boolean,edition:TourEdition='saas'):TourStep[]{
 const all=edition==='harness'?baseSteps.flatMap(s=>s.id==='ask'?[agent,s]:[s]):baseSteps;
 const ids=['navigation','monitor','funds','stocks','data','local-agent','ask'];
 return (updates?all.filter(s=>ids.includes(s.id)):all).map(s=>{
  let step={...s,actions:[...s.actions]};
  if(s.id==='navigation'){step.title=updates?(mobile?'手机常用入口重新整理':'最近的功能更新'):s.title;if(mobile){step.body='底部固定：首页、盯盘、复盘、我的股票、更多；产业研究和看板从「更多」进入。';step.tip='更多 → 使用说明 → 重新开始新手引导，可重看完整流程；不新增或调整更多菜单。';}}
  if(edition==='harness'&&s.id==='research'){step.body='从「我的股票 → 我的研究」建立自己的本地档案。';step.tip='报告、笔记和历史按账号保存在本机，不自动覆盖官网个人资料；阅读不运行AI。';}
  if(edition==='harness'&&s.id==='stocks')step.tip='自选、持仓和方案按账号保存在本机，不自动同步官网；录入不代表成交，也不会自动下单。';
  if(edition==='harness'&&s.id==='ask'){step.body='连接后由自己选择的Agent自主研究，保留原生Markdown、表格与来源链接。';step.actions=['先看页面中的当前Agent、连接状态和费用来源，必要时主动更换。','检查问题和选定公开证据，明确发送后才使用自己的供方额度。','问观澜、AI盘面点评和个人AI研究共用这项配置，失败不自动换引擎。'];step.tip='本地是连接与调度，不是模型完全离线；不会自动发送持仓成本。刷新、恢复历史不重复执行。';}
  if(edition==='harness'&&s.id==='monitor')step.actions[2]='本地提醒入口前往官网管理，保存规则、启用和渠道授权分别确认。';
  if(mobile&&['industry-map','industry-report','battle','battle-add','battle-layout','research'].includes(s.id)){step.target='more';step.fallback='navigation';step.body=(s.id.startsWith('industry')?'更多 → 产业价值研究。':s.id==='research'?'更多 → 我的研究。':'更多 → 我的作战看板。')+step.body;}
  if(mobile&&['review','screener','funds'].includes(s.id))step.body=(s.id==='review'?'点击底部「复盘」。':'更多 → 复盘与观测 → 条件观测。')+step.body;
  if(mobile&&s.id==='account'){step.target='more';step.body='更多 → 界面偏好调整主题与字号；更多 → 使用说明可重新开始引导。';}
  if(mobile&&s.id==='ask')step.actions=[step.actions[0],'手机回车只换行，明确点击发送才启动；历史和依据按需展开。',step.actions[2]];
  return step;
 });
}
