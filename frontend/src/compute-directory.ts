export const COMPUTE_ROOT='/industry/ai-compute';
export const COOLING_ROOT=COMPUTE_ROOT+'/liquid-cooling';
export const computeModules=[
 {id:'gpu',name:'GPU / AI 芯片',note:'计算核心与软件生态',description:'训练与推理需求经过芯片架构、软件适配和服务器交付，才成为公司收入。自研芯片、通用 GPU 与国产加速卡分开研究。'},
 {id:'hbm',name:'HBM 与存储',note:'带宽、容量与封装配套',description:'存储容量与带宽制约计算效率，产品价格、良率与供需周期决定利润弹性；不能把存储景气等同于全部存储公司的盈利。'},
 {id:'optical',name:'高速互联',note:'光模块、光器件与交换',description:'机柜内扩展与机柜间互联采用不同技术。关注速率升级、客户验证、量产良率和降价，不以算力总投入直接推算单家公司订单。'},
 {id:'pcb',name:'PCB 与载板',note:'高层数、高速材料与制造',description:'板层、材料等级和良率影响单位价值与产能约束。制造、基材与封装载板不是同一产品市场。'},
 {id:'liquid-cooling',name:'数据中心液冷',note:'冷板、CDU 与系统交付',description:'从芯片取热到机房排热，跟踪产品验证、批量交付、项目验收与回款。需求扩张和股东回报分开判断。'},
 {id:'power',name:'电源与供配电',note:'电源、UPS / HVDC 与配电',description:'机柜功率提升传到电源转换与机房配电；电压架构、效率、可靠性和认证影响供应商位置。'},
 {id:'idc',name:'IDC 与算力运营',note:'上架、利用率与资本回收',description:'运营商出售机柜、电力配套或算力服务；投资回收取决于客户合同、利用率、电价、折旧及融资成本，而非机柜数量本身。'},
 {id:'packaging',name:'先进封装',note:'互联密度、产能与良率',description:'芯片与存储集成带来封装需求。产线扩建要经过设备投放、良率爬坡和客户验证，不能把规划产能当已实现利润。'}
];
