// Public, manually reviewed disclosure snapshot. No prototype/demo financials.
// Updating this bundle requires checking the original filings and a new version.
export const industrySnapshot={
 id:'ai-compute-20261029-v1',asOf:'2026-10-29',reviewedOn:'2026-10-30',
 title:'AI 算力',scope:'全球需求与供给线索 → A股光器件兑现案例',
 sources:[
  {id:'msft',title:'微软 FY2027 Q1 财报',publisher:'Microsoft Investor Relations',published:'2026-10-28',period:'2026-07-01 至 2026-09-30',location:'Business Highlights；Cash Flows Statements',url:'https://www.microsoft.com/en-us/Investor/earnings/FY-2027-Q1/press-release-webcast',note:'资产设备新增的现金支出口径，不含融资租赁；不能等同纯AI资本开支。',summary:'资产设备现金投入393.67亿美元，上年同期193.94亿美元；Azure收入同比增长48%。'},
  {id:'nvda',title:'英伟达 FY2027 Q2 财报',publisher:'NVIDIA Newsroom',published:'2026-08-26',period:'截至2026-07-26的财季',location:'Q2 Fiscal 2027 Summary；Data Center',url:'https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-second-quarter-fiscal-2027',note:'集团GAAP毛利率不是数据中心分部利润率；海外数据不能直接映射A股订单。',summary:'数据中心收入890亿美元，同比增长117%；集团GAAP毛利率75.0%。'},
  {id:'tfc',title:'天孚通信 2026 年第三季度报告',publisher:'公司披露文件 · 新浪公告PDF转载',published:'2026-10-29',period:'2026-01-01 至 2026-09-30（累计）',location:'PDF第1–4页：主要财务指标、变动说明',url:'https://file.finance.sina.com.cn/211.154.219.97%3A9494/MRGG/CNSESZ_STOCK/2026/2026-10/2026-10-29/12670897.PDF',note:'未经审计；同比采用报告所列调整后口径。应收、库存增幅是相对年初，不能混成同比。',summary:'营收47.51亿元、归母净利20.83亿元、经营现金流14.62亿元；公司披露高速光器件需求受AI与数据中心建设推动。'}
 ],
 company:{code:'300394',name:'天孚通信',role:'高速光器件 · 首批披露核验案例，不是筛选排名',revenue:4751099905,profit:2083459571.46,operatingCash:1461851321.62,priorProfit:1465355835.83,priorCash:1344182030.69,epsNineMonths:1.9119,revenueGrowth:21.25,profitGrowth:42.18,cashGrowth:8.75,receivablesVsYearStart:73.33,inventoryVsYearStart:178.65},
 chain:[
  {name:'云与应用',driver:'预算、云收入与算力利用率',evidence:'微软现金投入和Azure收入支持需求线索，但不是纯AI投资额。',risk:'投资回报不足、客户缩减预算。',source:'msft'},
  {name:'芯片与系统',driver:'交付规模、产品组合与成本',evidence:'英伟达数据中心收入扩张，集团毛利提供盈利线索；缺少全产业利润统计。',risk:'供给释放、价格竞争与出口限制。',source:'nvda'},
  {name:'高速互联',driver:'端口数量、速率、良率与回款',evidence:'天孚披露需求增长和利润增长，但收入未在此快照拆分至具体客户或规格。',risk:'销量增长未转化为现金、应收与存货积累。',source:'tfc'},
  {name:'机房与供电',driver:'机柜交付、能耗与资本回收',evidence:'本版尚未纳入该环节经营原始披露，不作获利判断。',risk:'电力约束、交付延期与折旧负担。',source:null}
 ],
 checkpoints:[
  {name:'需求是否延续',when:'下一轮云厂商财报或预算调整',check:'同口径资本投入、云收入与利用率',invalidate:'若投入或需求下修，重新评估需求扩张假设。',source:'msft'},
  {name:'盈利是否有现金支撑',when:'公司下一份定期报告披露后',check:'同一累计期经营现金流 / 归母净利润；应收周转',invalidate:'若现金匹配持续走弱且应收积累，撤回“高质量兑现”假设。',source:'tfc'},
  {name:'备货是否转为交付',when:'公司经营说明、存货与交付数据更新后',check:'存货构成、跌价准备、交付与回款',invalidate:'若备货未转交付并出现减值，重估利润持续性。',source:'tfc'},
  {name:'价格是否透支假设',when:'价格明显变化或年度盈利假设修订时',check:'记录价格、盈利年度、年度EPS与PE假设',invalidate:'若需要的盈利超出可解释范围，不用产业热度替代估值论证。',source:null}
 ]
} as const;
