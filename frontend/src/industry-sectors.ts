export type SectorChild={id:string;name:string;description:string;path?:string;ready?:boolean};
export type Sector={id:string;name:string;kind:'产业'|'投资风格';description:string;children:SectorChild[];ready?:boolean;cases?:{code:string;name:string;stage:string}[]};
export const industrySectors:Sector[]=[
 {id:'ai-applications',name:'AI 应用',kind:'产业',ready:true,cases:[{code:'002230',name:'科大讯飞',stage:'智能交互与行业应用'},{code:'688111',name:'金山办公',stage:'办公软件'},{code:'300170',name:'汉得信息',stage:'企业实施'},{code:'688095',name:'福昕软件',stage:'智能文档'}],description:'软件业背景、AI付费与企业交付分层研究，核验主业、投资收益与现金。',children:[
  {id:'software',name:'软件与办公应用',description:'产品付费、续费、推理成本与利润兑现。'},
  {id:'content',name:'内容与交互应用',description:'内容授权、用户付费、获客和合规。'},
  {id:'enterprise',name:'企业与办公应用',ready:true,description:'四家公司赚钱业务、利润现金、壁垒与四问报告。'}]},
 {id:'media',name:'影视传媒',kind:'产业',ready:true,description:'电影、院线、视频平台与AI内容分开研究；从版权和付费需求，追踪利润分账、制作成本与现金。',cases:[{code:'300251',name:'光线传媒',stage:'影视动画与IP'},{code:'002739',name:'儒意电影',stage:'影院与内容'},{code:'300413',name:'芒果超媒',stage:'视频平台'},{code:'300364',name:'中文在线',stage:'IP与AI内容'},{code:'300133',name:'华策影视',stage:'影视制作与版权'},{code:'603103',name:'横店影视',stage:'影院与内容投资'}],children:[
  {id:'film-ai',name:'电影与AI内容',ready:true,description:'电影与视听行业指标、六个价值链环节、六家公司赚钱机制与四问报告。'},
  {id:'advertising',name:'广告与营销',description:'品牌预算、媒介分发、效果结算与回款，建设中。'},
  {id:'publishing',name:'出版与教育内容',description:'版权、产品、渠道和回款，建设中。'}]},
 {id:'gaming',name:'游戏',kind:'产业',ready:true,description:'研发、IP、发行与出海运营：从行业收入到产品生命周期，再核验推广回收与股东现金。',cases:[{code:'002555',name:'三七互娱',stage:'研发发行与出海'},{code:'002602',name:'世纪华通',stage:'国内外游戏运营'},{code:'002517',name:'恺英网络',stage:'研发与IP运营'},{code:'603444',name:'吉比特',stage:'自研与雷霆发行'}],children:[
  {id:'games',name:'游戏研发与发行',ready:true,description:'国内、出海与小游戏行业数据，六个功能环节及四家公司业务和财务兑现。'},
  {id:'platforms',name:'渠道平台与服务',description:'渠道分成、基础服务和技术工具，建设中。'},
  {id:'esports',name:'电竞与线下内容',description:'赛事版权、赞助、场馆和内容经营，建设中。'}]},
 {id:'dividend',name:'红利资产',kind:'投资风格',ready:true,description:'红利是投资风格，不是单一产业。先看整体现金分配，再按水电、煤炭、银行等不同生意核验可持续性。',children:[
  {id:'hydropower',name:'水电',ready:true,description:'来水、电量、电价与资本开支，验证现金回报。'},
  {id:'thermal-power',name:'火电运营',description:'燃料成本、利用小时与电价机制。'},
  {id:'banks',name:'银行',description:'息差、资产质量、资本充足与分配。'},
  {id:'telecom',name:'通信运营',description:'用户收入、网络投入与自由现金。'},
  {id:'utilities',name:'燃气与公用事业',description:'特许经营、价格机制与投资回收。'},
  {id:'coal',name:'煤炭',path:'/industry/coal',description:'按煤价周期、成本和资源约束判断，不因高股息默认稳定。'},
  {id:'oil-gas',name:'石油与天然气',path:'/industry/oil-gas',description:'资源、炼化和销售分开研究，与能源产业共用目录。'}]},
 {id:'consumer',name:'消费',kind:'产业',ready:true,description:'从消费总量、品类与渠道看需求，再看品牌、成本和周转如何形成公司利润。',children:[
  {id:'baijiu',name:'白酒消费',ready:true,description:'产品、品牌、渠道与动销，已研究贵州茅台案例。'},
  {id:'food',name:'食品与调味品',description:'销量、价格、渠道与原料成本。'},
  {id:'beverages',name:'饮料',description:'产品结构、铺货效率与复购。'},
  {id:'dairy',name:'乳制品',description:'原奶成本、需求、库存和渠道。'},
  {id:'appliances',name:'家用电器',description:'内销、出口、更新需求与产品结构。'},
  {id:'beauty',name:'美妆与日化',description:'品牌、获客成本、复购与渠道效率。'},
  {id:'retail',name:'零售与电商',description:'同店、客单、周转和履约成本。'},
  {id:'travel',name:'餐饮与酒店',description:'客流、客单、入住率与门店回报。'}]},
 {id:'robotics',name:'机器人',kind:'产业',ready:true,cases:[{code:'300124',name:'汇川技术',stage:'控制与伺服'},{code:'002472',name:'双环传动',stage:'精密传动'},{code:'688017',name:'绿的谐波',stage:'谐波减速器'},{code:'688160',name:'步科股份',stage:'工控与电机'},{code:'002979',name:'雷赛智能',stage:'运动控制'}],description:'从关键执行部件、感知到控制与整机，区分技术验证、量产和真实交付。',children:[
  {id:'motion',name:'运动控制与精密传动',ready:true,description:'行业产量、五家公司经营与产品验证，工业与人形业务分开。'},
  {id:'reducers',name:'谐波减速器',description:'精度、寿命、成本与量产良率。'},
  {id:'screws',name:'行星滚柱丝杠',description:'负载、效率、加工能力与客户验证。'},
  {id:'motors',name:'无框力矩电机',description:'功率密度、温升与批量交付。'},
  {id:'hands',name:'灵巧手',description:'自由度、可靠性与应用验证。'},
  {id:'sensors',name:'六维力传感器',description:'精度、漂移、寿命与标定。'},
  {id:'control',name:'具身模型与控制',description:'任务成功率、部署成本与真实场景。'}]},
 {id:'batteries',name:'电池与储能',kind:'产业',ready:true,description:'按应用、化学体系和产业链拆解；已开放储能电池与系统，其他分支建设中，不将固态路线进展当成全行业量产。',children:[
  {id:'power',name:'动力电池',description:'装机、价格、产品结构与客户交付。'},
  {id:'storage',name:'储能电池与系统',ready:true,description:'以磷酸铁锂为主线：行业装机与调用、六个功能环节、三家公司经营与四问报告。'},
  {id:'solid-state',name:'固态电池',description:'材料路线、界面、良率与量产验证。'},
  {id:'materials',name:'电池材料',description:'正负极、电解液、隔膜与供需。'},
  {id:'equipment',name:'电池设备',description:'工艺、订单、验收与资本开支。'},
  {id:'recycling',name:'回收与再利用',description:'回收量、金属价格与处理经济性。'}]},
 {id:'coal',name:'煤炭',kind:'产业',description:'分煤种、资源、开采与转化研究，不能用当期煤价或股息代表完整周期。',children:[
  {id:'thermal',name:'动力煤',description:'产量、长协、现货价格与发电需求。'},
  {id:'coking',name:'焦煤与焦炭',description:'钢铁需求、供给与煤焦价差。'},
  {id:'chemicals',name:'煤化工',description:'产品价差、能耗与项目回报。'},
  {id:'equipment',name:'煤机与矿山服务',description:'开采投入、设备订单与服务。'}]},
 {id:'oil-gas',name:'石油与天然气',kind:'产业',description:'上游资源、油服、炼化及管输分别看量、价、成本与资本回报。',children:[
  {id:'upstream',name:'油气勘探与开采',description:'储量、产量、实现价格和开发成本。'},
  {id:'services',name:'油田服务与装备',description:'作业量、利用率、订单和回款。'},
  {id:'refining',name:'炼化与销售',description:'加工量、裂解价差与需求。'},
  {id:'pipelines',name:'管输与天然气运营',description:'输送量、价格机制与网络投入。'}]}
];
export const sectorChildPath=(sector:Sector,child:SectorChild)=>child.path||'/industry/'+sector.id+'/'+child.id;
export const sectorByPath=(path:string)=>industrySectors.find(s=>path==='/industry/'+s.id||path.startsWith('/industry/'+s.id+'/'));
export const industrySources={
 consumption:{title:'国家统计局 · 2025 年社会消费品零售统计',date:'2026-01-19',period:'2025 年度',url:'https://www.stats.gov.cn/sj/zxfbhjd/202601/t20260119_1962323.html',note:'名义增速；社零含商品与餐饮，不含所有服务消费。限额以上品类不是全口径行业销售额。'},
 dividend:{title:'证监会宁夏监管局转载 · 上市公司分红整体统计',date:'2026-03-13',period:'2025 年实施分红 / 截至2025年底',url:'https://www.csrc.gov.cn/ningxia/c104435/c7619678/content.shtml',note:'媒体视点转载统计，不是红利指数收益或当前股息率。实施年度不同于利润归属年度；中期数据含实施或宣告。'}
};
export type SectorMetric={label:string;value:string;unit:string;detail:string};
export const sectorMetrics:Record<string,SectorMetric[]>={
 consumer:[{label:'社会消费品零售总额',value:'501,202',unit:'亿元',detail:'2025 年 · 同比 +3.7%'},{label:'商品零售额',value:'443,220',unit:'亿元',detail:'2025 年 · 同比 +3.8%'},{label:'餐饮收入',value:'57,982',unit:'亿元',detail:'2025 年 · 同比 +3.2%'},{label:'实物商品网上零售额',value:'130,923',unit:'亿元',detail:'2025 年 · 同比 +5.2% · 占社零26.1%'}],
 dividend:[{label:'沪深上市公司实施现金分红',value:'2.55',unit:'万亿元',detail:'2025 年实施口径 · 同比 +6.3%'},{label:'实施现金分红公司',value:'3,548',unit:'家',detail:'2025 年沪深两市 · 非全部A股占比'},{label:'中期分红金额',value:'8,273',unit:'亿元',detail:'2025 财年 · 截至年底实施或宣告，非全部已到账'},{label:'中期分红覆盖',value:'1,128',unit:'家次',detail:'2025 财年 · 截至年底实施或宣告，非去重家数'}]
};
export const comparisons=[
 {id:'ai-applications',name:'企业AI与办公应用',path:'/industry/ai-applications/enterprise',date:'研究整理2026-11-11；行业与公司2026前三季度',earning:'订阅、软件授权与项目实施收费，AI增值与集团收入分开。',metrics:'软件业背景、付费续约、交付毛利与现金；非纯AI市场规模。',capital:'持续研发、推理和交付成本，项目回款与预收分开。',competition:'工作流、格式兼容与行业交付；国产应用不等于核心模型自主。',risk:'付费转化不足、成本与回款、投资损益。',cases:'科大讯飞、金山办公、汉得信息、福昕软件。',source:'工信部与四家公司季报原文；未披露AI独立利润不补造。'},
 {id:'robotics',name:'机器人运动控制与精密传动',path:'/industry/robotics/motion',date:'研究整理2026-11-11；行业与公司2026前三季度',earning:'产品选型与验证后批量交付，不把样机视作订单。',metrics:'工业产量、精度寿命、交付毛利、应收存货与现金。',capital:'研发、制造扩产与营运资本；工控汽车与机器人业务分开。',competition:'具体产品可靠性、客户验证与成本，国产替代不按概念认定。',risk:'验证未量产、价格竞争、备货与回款。',cases:'汇川、双环、绿的、步科、雷赛，集团口径非纯人形收入。',source:'统计局及五家公司季报，更正后文件优先；不造人形份额。'},
 {id:'film-ai',name:'电影与AI内容',path:'/industry/media/film-ai',date:'研究整理2026-11-05；电影2026暑期档，视听2025年度，公司2026前三季度',earning:'版权和作品权益经过制作、发行、放映或平台分账形成利润。',metrics:'票房、人次、票价；会员、广告与版权付费；公司另看项目毛利和现金。',capital:'内容投入早于收入，影院租赁与维护另外约束现金；不把总票房当公司收入。',competition:'创作、IP权利、发行与平台运营；AI工具不保证获客和盈利。',risk:'作品失败、成本刚性、授权与生成内容合规、投流回收。',cases:'光线传媒、儒意电影、芒果超媒、中文在线，按业务位置分层。',source:'电影局、广电总局和四家公司原始披露；独立AI利润未披露则不补造。'},
 {id:'games',name:'游戏研发与发行',path:'/industry/gaming/games',date:'研究整理2026-11-05；行业2026上半年，公司2026前三季度',earning:'研发与发行运营取得用户付费，经渠道分账、履约和成本后形成利润。',metrics:'国内与出海收入、用户；公司另看流水差异、推广回收和经营现金。',capital:'研发、授权和营销前置，产品未来收入不一定能覆盖投入。',competition:'产品品质、长线运营、IP和本地化；不是硬件国产替代率。',risk:'产品衰减、渠道成本、投资损益、汇率及版权合规。',cases:'三七互娱、世纪华通、恺英网络、吉比特，经营表现与覆盖程度分开。',source:'游戏工委报告与公司转引、四家公司季报及业务披露，不将流水、收入混用。'},
 {id:'cleanroom',name:'洁净室与厂务',path:'/industry/semiconductors/layers/cleanroom',date:'研究核对日期与来源见原研究版本',earning:'洁净工程、机电与厂务系统的设计、采购、施工及交付。',metrics:'项目与在手订单、验收、毛利、应收和回款。',capital:'扩厂投资是需求线索，不等于工程商已取得订单。',competition:'工程交付、资质、客户验证、现场经验与供应链管理。',risk:'项目延期、客户集中、低价竞争和现金占用。',cases:'亚翔集成、圣晖集成等，按已核对业务关系纳入。',source:'原研究的公告、财报与报告证据包，不在对比页重新抓取。'},
 {id:'liquid-cooling',name:'数据中心液冷',path:'/industry/ai-compute/liquid-cooling',date:'研究整理 2026-11-02；产品与财务分别标期',earning:'冷板、CDU、连接部件及系统集成交付与服务。',metrics:'机柜热负荷、产品验证、交付、分部毛利与现金。',capital:'数据中心资本开支须经过路线、供应商验证与实际采购。',competition:'热设计、可靠性、系统能力及客户认证。',risk:'路线切换、价格竞争、回款与客户集中。',cases:'英维克、申菱环境、曙光数创等，非纯液冷财务口径。',source:'原研究的产品官网、公司披露及机构研究，规格不作全行业总量。'},
 {id:'hydropower',name:'水电',path:'/industry/dividend/hydropower',date:'研究整理 2026-11-03；行业2026H1，公司2025年度',earning:'稀缺水电资源经调度发电、售电形成收入。',metrics:'全国装机、发电量与利用小时；公司另看电价、资本开支及分红。',capital:'重资产前期投入大，存量运营与新增投资的现金回报分开。',competition:'资源禀赋、梯级调度、运营和融资效率。',risk:'来水、电价、杠杆、利率及买入价格。',cases:'长江电力仅为已核对公司案例，不代表全国水电。',source:'国家能源局行业统计与长江电力2025年报，原文入口见研究页。'},
 {id:'baijiu',name:'白酒消费',path:'/industry/consumer/baijiu',date:'研究整理 2026-11-03；行业与公司2025年度基准',earning:'产品、品牌与渠道组织形成销量和实现价格。',metrics:'规模以上产量、烟酒零售背景；公司另看动销、毛利、库存和现金归因。',capital:'基酒储备、生产与渠道投入不能混为科技设备扩产。',competition:'品牌、产品品质、渠道控制与消费者选择。',risk:'需求、价格体系、渠道库存与竞争。',cases:'贵州茅台仅为已核对公司案例，不代表整个白酒行业。',source:'统计局数据、企业年报引用行业数据与茅台披露，宽口径与公司口径分列。'},
 {id:'storage',name:'储能电池与系统',path:'/industry/batteries/storage',date:'研究整理2026-11-03；行业2025年度，公司2026前三季度，拆分2025年度',earning:'电芯制造、PCS和系统交付各有利润池；电站收益另行研究。',metrics:'投运功率与能量、时长、调用；公司另看毛利、交付、周转与现金。',capital:'电芯扩产与电站投资不是同一主体投入，均不能由规划直接推算订单。',competition:'制造一致性、安全、成本、客户认证及海外交付服务。',risk:'价格竞争、产能回报、回款、安全责任及市场机制变化。',cases:'宁德时代、亿纬锂能与阳光电源，集团口径不当作纯储能。',source:'能源局行业统计和政策、三家公司原始年报/季报；不汇总上下游重复收入。'}
];
