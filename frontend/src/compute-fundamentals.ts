import {researchReleases} from './research-versions';

// Dated public-source packet, read locally. It is not a live market-data feed.
export const computeFundamentalsRelease=researchReleases.find(r=>r.id==='compute-fundamentals')!;
export const computeFundamentalSources={
 miit:{name:'工信部',title:'2025 年通信业统计公报解读',date:'2026-01-29',url:'https://nmca.miit.gov.cn/zwgk/zcwj/zcjd/art/2026/art_e336caa756854011b8d5e03656f448e1.html'},
 china:{name:'IDC',title:'中国 AI 云市场追踪报告，2025 · 公开解读',date:'2026-10-08',url:'https://www.idc.com/resource-center/blog/idc首次定义ai云市场，2025年中国市场规模达684亿元/'},
 infra:{name:'IDC',title:'AI Infrastructure Spending · Q4 2025',date:'2026-04-16',url:'https://www.idc.com/resource-center/blog/ai-infrastructure-spending-caps-historic-year-at-90-billion-in-q4-2025-2029-spending-to-eclipse-1-trillion/'},
 server:{name:'IDC',title:'Servers Market Insights · Q2 2026',date:'2026-10-09',url:'https://www.idc.com/promo/servers/'},
 cloud:{name:'Synergy Research',title:'Q2 Cloud Market Passes $143 Billion',date:'2026-07-30',url:'https://www.srgresearch.com/articles/q2-cloud-market-passes-143-billion-highest-growth-rate-in-eight-years'},
 energy:{name:'IEA',title:'Key Questions on Energy and AI',date:'2026-04-16',url:'https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary'},
} as const;

export type ComputeMetric={id:string;label:string;value:string;unit:string;change:string;period:string;kind:'官方统计'|'机构统计'|'机构历史估算'|'机构预测';scope:string;basis:string;source:keyof typeof computeFundamentalSources;tone?:'capacity'|'demand'|'constraint'};
export const computeFundamentalGroups:{id:string;title:string;description:string;metrics:ComputeMetric[]}[]=[
 {id:'domestic',title:'国内供给与应用',description:'智能算力、机架和 AI 云需求分列，三家运营商样本不冒充全国算力总量。',metrics:[
  {id:'smart',label:'可调度智能算力 · 三家运营商',value:'>94.4',unit:'EFLOPS · FP16',change:'同比 +87.6%',period:'2025 年末 / 对比 2024 年末',kind:'官方统计',scope:'中国电信、中国移动、中国联通；可调度规模，不是全国全部智能算力。',basis:'同比采用工信部披露值。FP16 不与 FP32 通用算力直接相加。',source:'miit',tone:'capacity'},
  {id:'racks',label:'对外服务机架 · 三家运营商',value:'93.8',unit:'万架',change:'同比约 +13.0%',period:'2025 年末 / 对比 2024 年末',kind:'官方统计',scope:'三家基础电信企业对外服务机架，含非 AI 机架。',basis:'原文 93.8 万架，年增 10.8 万架；上年为 83.0 万架。约同比 = 10.8 ÷ 83.0 × 100% = 13.0%，基于原文舍入值推算。',source:'miit',tone:'capacity'},
  {id:'china-cloud',label:'中国 AI 云市场规模',value:'684',unit:'亿元',change:'首次披露 · 未提供同口径同比',period:'2025 全年',kind:'机构统计',scope:'IDC 新定义的 AI 云市场；不等于中国全部云计算市场。',basis:'采用 IDC 报告公开解读的规模；没有可比上期规模，不编造增速。',source:'china',tone:'demand'},
  {id:'tokens',label:'企业级 MaaS Token 调用量',value:'1,994',unit:'万亿 Token',change:'同比增长约 16 倍 · 原文口径',period:'2025 全年 / 对比 2024 全年',kind:'机构统计',scope:'中国企业级 MaaS 调用量；不是模型收入、付费金额或全社会 Token 用量。',basis:'沿用 IDC「同比增长约16倍」表述，不将增长倍数误写为期末倍数，也不转成未披露的精确百分比。',source:'china',tone:'demand'},
 ]},
 {id:'global',title:'全球需求与基础设施投入',description:'硬件投资与云服务消费是不同链路，统计范围有重叠，不相加为产业总额。',metrics:[
  {id:'ai-year',label:'全球 AI 基础设施支出',value:'3,180',unit:'亿美元',change:'同比约 +107.8% · 推算',period:'2025 全年 / 对比 2024 全年',kind:'机构统计',scope:'IDC AI 基础设施口径；与服务器收入、云服务支出存在重叠。',basis:'2025 年 3,180 亿美元，2024 年 1,530 亿美元；约同比 = (3,180 ÷ 1,530 − 1) × 100% = 107.8%。使用公布的舍入金额计算，不沿用原表中不一致的百分比。',source:'infra',tone:'demand'},
  {id:'ai-quarter',label:'全球 AI 基础设施季度支出',value:'899',unit:'亿美元',change:'同比 +62.2%',period:'2025 第四季度 / 对比 2024 第四季度',kind:'机构统计',scope:'IDC AI 服务器及存储口径；是全年支出的子集，不另行累加。',basis:'同比采用来源表格 62.2%；正文使用约 62% 的舍入表述。',source:'infra',tone:'demand'},
  {id:'cloud',label:'全球云基础设施服务支出',value:'1,434',unit:'亿美元',change:'同比 +43%',period:'2026 第二季度 / 对比 2025 第二季度',kind:'机构统计',scope:'IaaS、PaaS、托管私有云，含非 AI 业务；不是纯 AI 收入。',basis:'来源精确规模为 143.4 billion USD，标题按 143 billion 舍入。同比采用来源 43%。',source:'cloud',tone:'demand'},
  {id:'servers',label:'全球服务器市场收入',value:'1,663',unit:'亿美元',change:'同比 +52.0%',period:'2026 第二季度 / 对比 2025 第二季度',kind:'机构统计',scope:'全球服务器厂商收入，包含通用与 AI 服务器；不等于 AI 单一市场。',basis:'166.3 billion USD × 10 = 1,663 亿美元；同比采用 IDC 披露值。',source:'server',tone:'demand'},
 ]},
 {id:'delivery',title:'实物交付与能耗约束',description:'把金额增长与实物增长分开；能耗上升是部署压力，不直接等于利润改善。',metrics:[
  {id:'shipments',label:'全球服务器出货量增速',value:'+15.4',unit:'%',change:'同比增速 · 非收入增速',period:'2026 第二季度 / 对比 2025 第二季度',kind:'机构统计',scope:'全球全部服务器；来源公开页未披露同季度出货台数。',basis:'同季收入增长 52.0%，台数增长 15.4%；产品结构与价格影响不能视作同等台数扩张。',source:'server',tone:'capacity'},
  {id:'electricity',label:'全球数据中心用电量',value:'485',unit:'TWh',change:'同比 +17%',period:'2025 全年 / 对比 2024 全年',kind:'机构历史估算',scope:'IEA 全部数据中心历史估算，含非 AI 负载；不是 AI 专属用电。',basis:'历史估算规模与 17% 增速均来自 IEA 2026 报告；不同报告版本不拼接计算。',source:'energy',tone:'constraint'},
  {id:'ai-power',label:'AI 数据中心用电增速',value:'+50',unit:'%',change:'同比增速 · 非算力增速',period:'2025 全年 / 对比 2024 全年',kind:'机构历史估算',scope:'IEA AI-focused 数据中心子口径；未以全部数据中心用电量乘此增速。',basis:'增速采用 IEA 披露值；原文未在此处给出该子类用电总量，不用 485 TWh 代替。',source:'energy',tone:'constraint'},
 ]},
];
export const computeForecasts:ComputeMetric[]=[
 {id:'ai-2026',label:'全球 AI 基础设施支出预测',value:'4,870',unit:'亿美元',change:'预计同比约 +53%',period:'2026E 全年 / 对比 2025 全年',kind:'机构预测',scope:'IDC 2026-04-16 预测版本，不是 2026 全年实际结果。',basis:'采用该版本预测 487 billion USD 及约 53% 增长。后续修订需要新版本核对，不覆盖历史值。',source:'infra',tone:'demand'},
 {id:'power-2030',label:'全球数据中心用电情景',value:'950',unit:'TWh',change:'较 2025 年约 1.96 倍 · 非同比',period:'2030E / 基期 2025 全年',kind:'机构预测',scope:'IEA 中央情景，全部数据中心；不是保证实现的产能或订单。',basis:'950 ÷ 485 ≈ 1.96 倍，是五年规模比较，未冒充年度同比。',source:'energy',tone:'constraint'},
];
