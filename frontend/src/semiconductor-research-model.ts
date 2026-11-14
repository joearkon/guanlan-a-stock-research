// Research organization and questions, not verified supply links or conclusions.
// Reference: local Vibe-Research sectorPrompts genericTrack / sectorSteps;
// Penpot industry-vibe detail + advanced-process exports (2026-10-24).
export type ResearchNode={id:string;name:string;upstream:string;downstream:string;question:string;check:string;counter:string;codes:string[];stage:number};
export const semiconductorNodes:ResearchNode[]=[
 {id:'design',name:'芯片设计',upstream:'EDA、IP 与设计服务',downstream:'晶圆制造、封装与终端应用',question:'设计导入能否转化为持续出货，而不是只有产品发布？',check:'比较产品进度、客户认证、收入结构与研发投入；客户或订单关系需单独核验。',counter:'认证推迟、出货不及预期或存货增长快于收入。',codes:[],stage:1},
 {id:'manufacturing',name:'芯片制造',upstream:'设备、材料与芯片设计',downstream:'封装测试与终端需求',question:'产能利用率和产品结构变化，是否带来利润与现金兑现？',check:'核对同报告期稼动率、晶圆价格、折旧、毛利率和资本开支，区分成熟与先进工艺。',counter:'新增产能未转为出货，或价格改善但库存与回款恶化。',codes:['688981'],stage:2},
 {id:'packaging',name:'封装测试',upstream:'晶圆、基板、设备与材料',downstream:'成品芯片与系统集成',question:'先进封装需求增加，是否真正转为交付与盈利？',check:'分开比较工艺路线、良率、认证与产能爬坡；不把不同封装路线视为相同市场。',counter:'产能已建成但良率、客户认证或出货尚未兑现。',codes:[],stage:3},
 {id:'materials',name:'半导体材料',upstream:'基础原料、提纯与配方',downstream:'制造及封装工艺',question:'验证通过、批量导入与持续供货，分别走到了哪一步？',check:'按材料品类核对纯度、认证周期、客户验证、销售结构和回款，不能笼统判断国产化。',counter:'只有送样或验证，缺少量产收入与可追溯供货记录。',codes:[],stage:0},
 {id:'equipment',name:'半导体设备',upstream:'核心零部件、软件与工艺能力',downstream:'晶圆制造及封装扩产',question:'晶圆厂资本开支，能否沿订单、交付、验收传到设备收入？',check:'分开记录新增订单、在手订单、交付、验收与现金回款；工艺适用范围和客户认证须核验。',counter:'订单或交付增长，但验收延迟、合同负债变化或回款不匹配。',codes:['002371','688012'],stage:0},
 {id:'discrete',name:'分立器件',upstream:'衬底、外延、设备与材料',downstream:'汽车、工业、能源及消费应用',question:'产品升级和下游需求，是否足以抵消价格与扩产压力？',check:'按功率器件等产品类别核对价格、产能、库存与终端结构，不与逻辑芯片直接混比。',counter:'扩产快于需求，价格下行侵蚀毛利，库存持续上升。',codes:[],stage:2},
];
export const advancedProcessNodes:ResearchNode[]=[
 {id:'capacity',name:'扩产与洁净室',upstream:'需求预测、融资与建设计划',downstream:'设备采购及产线投产',question:'规划产能是否已经形成实际建设、采购和投产节点？',check:'将规划、开工、设备搬入、试产和量产分开，核对各自来源和时间。',counter:'只有扩产公告，实际建设或设备采购推迟。',codes:[],stage:0},
 {id:'lithography',name:'光刻与涂胶显影',upstream:'光学、光源、光刻胶与精密运动',downstream:'图形转移及后续工艺',question:'关键性能、验证与量产适用范围，是否有独立披露支持？',check:'分别核对曝光与涂胶显影的工艺角色、验证状态和量产应用，避免把整机与配套混为一谈。',counter:'实验或验证进展被误当作稳定量产和规模收入。',codes:[],stage:2},
 {id:'etch-film',name:'刻蚀与薄膜',upstream:'射频、真空、气体与关键零部件',downstream:'晶圆前道工艺',question:'工艺复杂度增加，是否转化为已验收设备和持续收入？',check:'按刻蚀、沉积等工艺分开核对设备适用范围、客户验证、验收与服务收入。',counter:'研发投入或出货增加，但认证、验收和回款尚未兑现。',codes:['002371','688012'],stage:2},
 {id:'cleaning',name:'清洗与热处理',upstream:'化学品、温控与工艺零部件',downstream:'晶圆制造工序',question:'工序增加是否带来可验证的设备需求和产品升级？',check:'核对适用工艺、认证、产能和收入贡献，不仅比较设备台数。',counter:'量产可靠性未获验证，或售价改善不足以覆盖研发及交付成本。',codes:[],stage:2},
 {id:'metrology',name:'检测与量测',upstream:'光学、电子束、算法与精密控制',downstream:'工艺控制与良率验证',question:'检测能力和量产线导入，是否已形成可复核的客户应用？',check:'区分缺陷检测与尺寸量测，核对灵敏度、吞吐量、验证和收入结构。',counter:'产品参数改善但量产验证、客户导入或服务能力仍不足。',codes:[],stage:2},
 {id:'components',name:'核心零部件',upstream:'基础材料、精密加工与控制技术',downstream:'半导体设备整机',question:'零部件是否已经通过整机验证并形成持续供货？',check:'按品类核对验证、替换难度、批量供货和收入占比；供应关系必须有具体来源。',counter:'送样通过但未持续采购，或单一客户占比带来风险。',codes:[],stage:2},
 {id:'materials',name:'材料与耗材',upstream:'原料、提纯、配方与制造',downstream:'设备使用及晶圆工艺',question:'耗材用量、验证周期与客户扩产之间是否有真实传导？',check:'按材料品类核对用量、寿命、认证与复购，不把一次性设备需求当作经常性收入。',counter:'供货未规模化，或终端稼动率下降导致复购减弱。',codes:[],stage:2},
 {id:'manufacturing',name:'晶圆制造',upstream:'前道设备、材料与工艺集成',downstream:'封装测试与终端应用',question:'设备和工艺进展是否最终转成良率、出货与盈利？',check:'核对量产阶段、良率、稼动率、资本开支、折旧和现金，不能仅以工艺节点名称判断。',counter:'扩产与技术进展未转成稳定出货，资本开支和折旧压力持续。',codes:['688981'],stage:3},
];
export const researchSteps=[
 {id:'sources',title:'资料与口径',description:'先读披露，再确定可比较的范围',task:'先整理可访问的财报、公告与公开研报；区分资料发布日期、报告期、金额单位及调整口径，按后续研究栏目建立证据索引。'},
 {id:'overview',title:'产业总览',description:'是什么、需求从哪里来、处在哪一段',task:'解释本环节解决的问题、需求驱动与当前阶段；核对市场规模和变化的年份、地区与口径，不用单一公司的增长外推全行业。'},
 {id:'technology',title:'技术路线',description:'路线差别、关键参数与验证进度',task:'比较技术路线、关键性能、验证和量产阶段；明确哪些参数或技术变化会改变竞争格局，未核实的量产进度保留为缺口。'},
 {id:'value',title:'价值量与卡口',description:'钱花在哪里，利润为何能留下',task:'拆分产业链环节、价值量口径、供给约束和替代路径；区分价值量增加、定价权与利润增长，核对设备、材料或工艺究竟限制了什么。'},
 {id:'competition',title:'全球格局',description:'按环节比较壁垒和竞争位置',task:'逐环节比较全球参与者、竞争位置与壁垒；区分全球竞争力和特定替代场景，提及公司只记录有来源的业务角色，不确认未经披露的客户订单。'},
 {id:'validation',title:'持续验证',description:'验证信号、反证与下一次复核',task:'总结技术路线与兑现的不确定性、定价权及可公开跟踪的指标；列出数据入口、更新频率、判断失效条件和下次复核事项，不声称已创建自动监控。'},
] as const;
export function semiconductorNode(id:string|null,advanced=false){const nodes=advanced?advancedProcessNodes:semiconductorNodes;return nodes.find(n=>n.id===id)||nodes[advanced?2:1];}
export function semiconductorPrompt(node:ResearchNode,stepId:string,advanced=false,year=new Date().getFullYear()){
 const step=researchSteps.find(s=>s.id===stepId)||researchSteps[0];
 return `研究「半导体${advanced?' / 先进制程设备':''} / ${node.name}」的【${step.title}】。先用本轮可访问的披露，补充${year}与${year-1}年资料；资料库不可访问时明确说明。\n${step.task}\n当前问题：${node.question}\n固定输出：结论与可信度；证据表（来源、原文链接、发布日期、报告期、单位及口径）；事实、推断与反证；资料缺口及下一步。关键数字与公式须可核验，未取得就留缺口，不预设卡口、排名或量产结论。最后对应产业利润池、公司兑现、价格预期、持续验证四问；缺少有日期的价格和年度盈利假设时不做估值结论。只完成本步，不自动连续执行或发送通知。`;
}
