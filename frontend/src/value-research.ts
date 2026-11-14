// Frozen public evidence, not a live quote or an automated sector verdict.
import {researchReleases} from './research-versions';
import {storageStudy} from './storage-research';
import {mediaStudy,gamingStudy} from './media-research';
import {aiApplicationStudy,roboticsStudy} from './new-industry-research';
export type ValueSource={id:string;title:string;date:string;period:string;url:string;note:string};
type Chapter={id:string;label:string;title:string;answer:string;counter:string;evidenceIds:string[]};
type Node={id:string;name:string;role:string;intro:string;benefit:string;risk:string;track:string[];refs:string[];codes?:string[];icon?:'battery'|'circuit'|'thermo'|'shield'|'factory'|'network'};
export type ValueStudy={id:string;menu:string;title:string;root:string;route:string;version:string;reviewedOn:string;intro:string;verdict:string;signals:[string,string][];sources:ValueSource[];kpis:{label:string;value:string;unit:string;detail:string;scope:string;source:string;tone?:string}[];nodes:Node[];chapters:Chapter[];companies?:ValueStudy['company'][];comparisonId?:string;updateSummary?:string;chainIntro?:string;candidateKeywords?:string;company:{code:string;name:string;role:string;money:string;moat:string;competition:string;cashNote:string;period:string;revenue:number;revenueYoy:number;profit:number;profitYoy:number;cash:number;cashYoy:number;segmentPeriod?:string;verdict?:string;financeRefs?:string[];businessLines?:{name:string;detail:string}[];segments:{name:string;value:number}[];refs:string[];answers:string[]};topics:{id:string;name:string;answer:string;tasks:string[];refs:string[]}[]};
export const valueStudies:ValueStudy[]=[{
 id:'dividend',menu:'红利资产',title:'水电',root:'/industry/dividend',route:'/industry/dividend/hydropower',version:researchReleases[1].version,reviewedOn:researchReleases[1].reviewedOn,
 intro:'水资源经调度变成电量，电价与成本决定利润，资本开支和债务决定多少现金能留给股东。',
 verdict:'现金创造已有依据，红利价值仍取决于买入价格与分配的可持续性。',
 signals:[['利润来源','发电量 × 实现电价，扣除折旧与运营成本'],['核心壁垒','稀缺水电资产、梯级联合调度与运营能力'],['股东回报','分红需放在资本开支、利息及偿债之后核验'],['主要风险','来水、电价、杠杆与估值贴现率']],
 sources:[
  {id:'H1',title:'长江电力 · 2025 年年度报告',date:'2026-04-30',period:'2025 年度 / 2024 同期',url:'https://static.cninfo.com.cn/finalpage/2026-04-30/1225262036.PDF',note:'第2页年度分配预案；第6页主要财务；第9页六座电站发电量；第13页业务构成；第88页合并现金流。使用年报终值，不沿用早期业绩快报。'},
  {id:'H2',title:'国家能源局 · 2026 年上半年可再生能源并网运行',date:'2026-07-30',period:'2026 上半年 / 2026 年6月底',url:'https://www.nea.gov.cn/20260730/3ce671c387574eeeb120fc3825be0399/c.html',note:'全国水电装机4.54亿千瓦，规模以上水电发电量5886亿千瓦时；全国口径不能直接推算一家公司的电量与收入。'}
 ],
 kpis:[
  {label:'全国水电累计装机',value:'4.54',unit:'亿千瓦',detail:'2026 年6月底 · 含常规水电与抽蓄',scope:'行业统计',source:'H2'},
  {label:'全国规模以上水电发电量',value:'5,886',unit:'亿千瓦时',detail:'2026 上半年 · 非公司电量',scope:'行业统计',source:'H2'},
  {label:'全国水电平均利用小时',value:'1,452',unit:'小时',detail:'2026 上半年 · 累计平均利用小时',scope:'行业统计',source:'H2'},
  {label:'全国新增水电并网容量',value:'603',unit:'万千瓦',detail:'2026 上半年 · 常规303、抽蓄300',scope:'行业统计',source:'H2'}
 ],
 nodes:[
  {id:'water',name:'来水与梯级调度',role:'资源与产出',intro:'降水、库容、生态约束与机组运行共同影响可售电量。全国水电增长不意味着每个流域都同向。',benefit:'长江电力运营六座梯级水电站；调度能力将资源转为电量，但枯水年仍会压缩发电空间。',risk:'用一个丰水年作永续基准，会高估正常化盈利。',track:['各流域来水与水库蓄能','电量同比及多年均值','检修与弃水情况'],refs:['H1','H2']},
  {id:'pricing',name:'售电与电价',role:'收入形成',intro:'发电量经过上网结算转为售电收入。交易结构、电价和消纳条件影响单位电量的价值。',benefit:'水电经营与设备制造不是同一利润池：运营商靠售电回收资产投入，而非赚取设备订单差价。',risk:'电量增加但结算电价走弱时，收入和利润未必同比例上升。',track:['上网电量和结算电价','市场化交易与合同结构','境内水电分部毛利'],refs:['H1']},
  {id:'capital',name:'资本开支与偿债',role:'现金约束',intro:'折旧并非当期现金支出，但维护、扩建、收购及债务本息会真实消耗资金。',benefit:'把存量水电现金流、抽蓄新项目与对外投资分开，才能判断分红是否由经营支撑，而非不断加杠杆。',risk:'经营现金流减全部购建支出只是简化现金余量，不等于严格的股东自由现金流。',track:['维护与增长资本开支','债务期限、利息和再融资','投资收益与主业利润分开'],refs:['H1']},
  {id:'dividend',name:'现金与分红',role:'股东回报',intro:'分红来自可分配利润与现金安排；高股息标签不能保证未来现金分配，也不保护买入价格。',benefit:'年报预案全年每股1元包含已派中期0.21元，末期拟派0.79元。不能相加成1.21元，也不能在无同日股价时算当前股息率。',risk:'分配预案、股东会通过与实际实施是不同状态；本版未核验后续实施公告。',track:['分红实施公告与税前每股金额','现金分配与正常化盈利匹配','利率变化与估值敏感性'],refs:['H1']}
 ],
 chapters:[
  {id:'hydro-profit',label:'利润与周期',title:'利润池由电量、电价与成本共同决定',answer:'水电研究的起点是资源兑现，而非单看新增装机。全国水电数据用于观察供给结构；流域来水、调度和交易决定具体运营商的收入。长江电力2025年电量增长快于收入，说明不能把电量增幅直接当作利润增长率。研究判断：现有资产有持续经营依据，但一个丰水期不能代表整个周期。',counter:'需用多年电量与电价资料正常化；本版不是对2026年四季度的盈利预测。',evidenceIds:['H1','H2']},
  {id:'hydro-quality',label:'经营与现金',title:'经营现金是起点，资本约束决定可分配空间',answer:'公司2025年归母利润345.03亿元，经营现金605.63亿元。现金高于利润与重资产折旧特征有关，不能将差额全部视为额外价值。购建资产支出184.88亿元，此外还有投资与偿债；因此需要把现金使用顺序拆开，区分存量运营回报和新增项目收益。',counter:'合并现金不是母公司可立即分配现金；维护与增长支出未完全拆分，不把简化剩余现金称为股东自由现金流。',evidenceIds:['H1']},
  {id:'hydro-price',label:'分红与价格',title:'分红证据不等于估值便宜',answer:'年度预案每股1元提供分配观察锚点，而不是永续承诺。看红利资产应同时检验正常化电量、电价、债务成本和所支付的价格。当前研究未纳入同步报价，不给当前股息率或“合理PE”硬区间；估值比较可在相同价格日引入收益要求和现金增长假设。',counter:'利率上升、来水持续偏弱或再投资回报下降，都可能降低愿意支付的估值。',evidenceIds:['H1']},
  {id:'hydro-check',label:'持续验证',title:'以经营、资金使用和分配三条线维护判断',answer:'低频更新以季报、电量公告、分红实施及重大项目为触发。先比较同口径电量和利润，再核对资本开支、债务与分配。如果经营改善却伴随杠杆和新增投入持续增加，应重新评估现金回报；若现金与分配连续匹配，才增强稳定回报的证据。',counter:'行业目录不是红利股票全量筛选，本次只研究长江电力这一家公司。',evidenceIds:['H1','H2']}
 ],
 company:{code:'600900',name:'长江电力',role:'大型水电运营与电力相关投资',period:'2025 年度',revenue:86241940222.20,revenueYoy:2.07,profit:34502809176.39,profitYoy:6.17,cash:60562925570.41,cashYoy:1.53,
  money:'主要通过运营水电资产、发售电力赚钱。境内水电主营收入756.62亿元；其他行业主营收入103.23亿元，二者不强行凑成合并营业收入。投资收益另行影响利润，不等同于售电收入。',
  moat:'稀缺的流域资产、长期运营和梯级协同形成竞争基础；资产规模本身不是无风险壁垒，仍受水文、市场电价、监管及资本约束。',competition:'不使用国产替代作为判断维度。重点比较资源禀赋、调度效率、单位成本、融资成本与其他电源的交易竞争。',
  cashNote:'合并经营现金减购建支出不包含所有投资与融资安排，不等于可全额分红的现金。',segments:[{name:'境内水电主营收入',value:75661563315.43},{name:'其他行业主营收入',value:10323376439.80}],refs:['H1'],
  answers:[
   '公司位于电力运营环节，靠存量水电资产与调度产生售电现金。扩产只有在投产、发电、结算后才体现收益；新增项目还要比较建设成本和资本回报，不应把规模增加自动写成价值创造。',
   '2025年收入、归母利润、经营现金同比均为正，但增长幅度不同。主业毛利、投资收益与财务费用分别影响利润；应按完整水文周期核验正常化盈利，再判断现金能否覆盖维护、增长投入和债务。',
   '没有纳入同日股价与最新分红实施，暂不判断当前便宜或昂贵。每股分红预案可作为情景输入，不是无风险票息；合理价格取决于所需回报率、长期电量电价和资本开支假设。',
   '持续核对流域来水、售电量价、债务成本及实际分红。若分红依赖更高杠杆、来水偏弱长期化或新增项目回报下降，应下调稳定回报判断；经营和分配持续匹配后才增加信心。'
  ]},
 topics:[{id:'cash-return',name:'分红与资本约束',answer:'当前分配锚点有明确年报依据，但不能把预案当成未来每年的承诺。下一轮研究优先核验实施公告、资本开支性质与母公司现金。',tasks:['核对年度末期分红是否实施，区分所属年度和派发日期','拆分维护、增长和收购支出，避免把全部现金都当分红空间','以枯水、常态、丰水情景检验债务与分配承受力'],refs:['H1']},{id:'water-cycle',name:'来水、电价与正常化盈利',answer:'电量与收入增速不一致，表明单一产量指标不足以估算利润。应把资源周期和交易条件结合，而不是靠某次季报外推永续增长。',tasks:['补入各流域多年电量及来水序列','比较交易与结算电价，分开量与价的贡献','检查新增项目投产时间和资本回报约束'],refs:['H1','H2']}]
},{
 id:'consumer',menu:'消费',title:'白酒消费',root:'/industry/consumer',route:'/industry/consumer/baijiu',version:researchReleases[2].version,reviewedOn:researchReleases[2].reviewedOn,
 intro:'从产品与品牌溢价，到渠道动销、利润和现金。白马是研究对象，不是永远增长或合理估值的结论。',verdict:'品牌盈利基础清晰，增长与渠道回款需要分开检验。',
 signals:[['利润来源','产品组合、售价与销量共同决定'],['核心壁垒','品牌认知、工艺积累与渠道能力'],['经营验证','终端动销、渠道库存与回款'],['主要风险','需求调整、渠道价差与高预期']],
 sources:[
  {id:'C1',title:'贵州茅台 · 2025 年年度报告',date:'2026-04-17',period:'2025 年度 / 2024 同期',url:'https://www.moutaichina.com/mtgf/articleFileDir/2026-04/17/1b9fae59825c41bf9a776892a00565f7.pdf',note:'第6页主要财务与现金变化解释；第18页按产品与渠道收入、毛利率。集团合并现金包含财务公司影响，不能直接解释为白酒终端回款变化。'},
  {id:'C2',title:'国家统计局 · 2025 年社会消费品零售统计',date:'2026-01-19',period:'2025 年度',url:'https://www.stats.gov.cn/sj/zxfbhjd/202601/t20260119_1962323.html',note:'限额以上单位烟酒类零售额6425亿元、增长2.7%；包含烟草及其他酒类，不等于白酒规模、白酒收入增速或贵州茅台销售增速。'},
  {id:'C3',title:'贵州茅台 · 2026 半年度业绩说明会实录（节选）',date:'2026-08-21',period:'2026 上半年业务说明',url:'https://www.moutai.com.cn/mtjt/2026-08/21/article_2026082123470131571.html',note:'管理层对行业调整、市场化改革和预收变化的解释；属于公司观点，应与完整定期报告及渠道证据交叉验证。'},
  {id:'C4',title:'酒鬼酒 · 2025 年年度报告：行业统计转引',date:'2026-04-29',period:'2025 年度',url:'https://disc.static.szse.cn/download/disc/disk03/finalpage/2026-04-29/ae4a8d11-c826-4f0a-92a4-e1757b11a768.PDF',note:'PDF第12页（正文第11页）转引国家统计局：全国规模以上白酒累计产量354.9万千升。仅取行业统计，未将酒鬼酒纳入公司案例；该处没有可核验同比，不补造增速。'}
 ],
 kpis:[
  {label:'限上烟酒零售额增速',value:'+2.7',unit:'%',detail:'2025 同比 · 非白酒单一口径',scope:'较宽消费口径',source:'C2',tone:'up'},
  {label:'限额以上烟酒类零售额',value:'6,425',unit:'亿元',detail:'2025 年 · 包含烟草等，非白酒行业规模',scope:'较宽消费口径',source:'C2'},
  {label:'全国规模以上白酒产量',value:'354.9',unit:'万千升',detail:'2025 年 · 酒鬼酒年报引述国家统计局',scope:'行业统计 · 企业年报转引',source:'C4'}
 ],
 nodes:[
  {id:'product',name:'酿造与产品结构',role:'产品价值',intro:'酿造、储存与勾调形成产品，产能不等于当期可售销量；不同产品与年份不能用一张平均成本表解释。',benefit:'茅台酒与系列酒贡献不同的收入和毛利，核心单品的品牌溢价是研究线索，不代表所有产品都有相同定价能力。',risk:'扩产带来的库存可能多年后才销售，不能把新增基酒吨数直接乘当前零售价当收入。',track:['产品结构与销量','基酒、库存及可售成品的区别','分产品毛利与成本'],refs:['C1']},
  {id:'channel',name:'渠道与终端动销',role:'收入传导',intro:'直销与批发代理是不同收入渠道。公司确认销售、经销商进货和消费者饮用不是同一时点。',benefit:'2025年直销收入增加而批发代理收入减少，渠道迁移与终端需求必须分开，不能把直销占比提高单独当作需求更强。',risk:'缺少同日批价和渠道库存核验，本版不编造库存月数或渠道利润。',track:['直销、批发收入与毛利','批价及渠道价差','经销库存与终端消费证据'],refs:['C1','C3']},
  {id:'brand',name:'品牌与竞争',role:'超额回报基础',intro:'品牌认知、稀缺性与消费场景可以支持价格，但品牌价值要通过长期复购、毛利和现金体现。',benefit:'高毛利说明历史产品定价与成本结构，并不保证未来销量、售价或估值倍数不下降。',risk:'消费场景、价格体系及渠道利益变化都可能削弱利润；无需套用科技行业的卡脖子叙事。',track:['核心单品价格与销量','渠道费用和终端接受度','竞争品牌与消费场景变化'],refs:['C1','C3']},
  {id:'cash',name:'现金与股东回报',role:'经营兑现',intro:'经营利润还要核对回款、税费、营运资本与合并范围。集团财务公司会影响现金流列报。',benefit:'2025年经营现金同比下降的公司解释涉及成员存款与同业存款变化，不能直接得出“卖酒回款下降33.46%”。',risk:'将金融子公司现金、制造业务回款和股东可分配现金混用，会产生错误的质量判断。',track:['合并现金与财务公司因素','合同负债、应收及渠道回款','资本开支、回购及分红实施'],refs:['C1','C3']}
 ],
 chapters:[
  {id:'consumer-pool',label:'需求与利润',title:'消费行业的利润增长要穿透到产品与渠道',answer:'宏观烟酒零售统计只能提供较宽背景，不能替代白酒终端动销。研究以茅台为公司案例：品牌和产品组合是利润来源，渠道迁移影响销售结构。市场化改革的管理层解释值得跟踪，但需要财务和终端资料交叉验证，不将公司的计划写成已经实现的行业复苏。',counter:'单家公司不能代表整个白酒行业；本版未构建全行业量价序列。',evidenceIds:['C1','C2','C3']},
  {id:'consumer-quality',label:'竞争与兑现',title:'高毛利保留优势，但不能忽略增长与现金变化',answer:'公司年报显示直销毛利率较高，同时收入和归母利润同比回落。对消费白马，真正需要比较的是单位经济、品牌持续性和资本回报，而非把“大公司”当作安全证明。合并经营现金受财务公司影响，需要归因后再判断回款质量，不能直接把合并现金降幅当作终端销售恶化幅度。',counter:'没有核验最新渠道库存、批价和完整2026财报，不把存量品牌优势升级为当前买入判断。',evidenceIds:['C1','C3']},
  {id:'consumer-price',label:'价格与预期',title:'好生意仍需合理价格与可检验的盈利假设',answer:'消费品牌的估值取决于需求韧性、价格权、再投资回报与分配。PE可用于盈利情景对照，PB需结合ROE与资本结构解释，不能以高PB直接判贵，也不能以历史高毛利无限上调估值。当前未纳入同日市值、最新盈利及一致预测，不给固定合理倍数或目标价。',counter:'若消费与渠道长期承压，正常化盈利和应付估值都可能下移。',evidenceIds:['C1']},
  {id:'consumer-check',label:'后续验证',title:'用产品、渠道、现金三个维度更新研究',answer:'下一轮更新围绕终端动销、渠道结构和现金归因。把公司说明会的改革目标作为待验证线索，逐期核对产品收入、毛利、合同负债和现金。出现价格体系与利润连续弱化时，应调整判断；只看到品牌宣传或单次渠道补库，不足以确认增长恢复。',counter:'机构目标价与评级若未核对原报告，不显示为权威结论，也不以自编AI分数代替证据。',evidenceIds:['C1','C3']}
 ],
 company:{code:'600519',name:'贵州茅台',role:'高端白酒产品与多渠道销售',period:'2025 年度',revenue:168838102514.79,revenueYoy:-1.21,profit:82320067101.68,profitYoy:-4.53,cash:61522204989.35,cashYoy:-33.46,
  money:'通过茅台酒及系列酒销售赚钱。2025年茅台酒收入1465.00亿元、其他系列酒222.75亿元；这是酒类主营拆分，与合并营业收入存在口径差异。直销与批发是另一种交叉分类，不能再相加。',
  moat:'品牌认知、产品工艺与长期积累支撑较高历史毛利。壁垒是否保持，需要看真实需求、价格体系、产品结构及持续资本回报，而不是用品牌名气代替验证。',competition:'不套用国产替代率。国内外消费选择、品牌竞争、渠道利益与消费者支付意愿才是关键；消费白马也存在需求和估值风险。',
  cashNote:'年报解释现金变化涉及财务公司成员存款及同业存款，不能把合并降幅直接标作卖酒回款降幅。',segments:[{name:'茅台酒主营收入',value:146499906480.49},{name:'其他系列酒主营收入',value:22274678707.16}],refs:['C1','C3'],
  answers:[
   '公司在产品与品牌端获取利润，渠道结构会改变单位售价与费用。白酒消费总量、细分价格带和本公司销售不可互换；品牌的高毛利是历史证据，不等于未来所有产品和渠道都有同样利润。',
   '2025年收入与归母利润同比均下降，不能沿用长期增长的默认叙事。经营现金净额下降还涉及财务公司列报因素，需要把集团资金变化与制造销售回款拆开，再结合产品毛利、库存和合同负债判断持续获利。',
   '不在缺少同步价格和最新正常化盈利时给出合理PE/PB区间。估值要写清销量、售价、利润率、分配与必要回报假设，并检验这些假设需要多强的终端需求支持。高ROE不保证任何价格买入都合理。',
   '优先核对2026完整财报、渠道终端证据与财务公司现金归因。若产品价格、渠道毛利与回款连续走弱，应降低价值判断；若改革转为可核验动销和持续现金改善，才加强盈利韧性结论。'
  ]},
 topics:[{id:'channel-quality',name:'品牌、渠道与真实需求',answer:'直销增长不能单独证明消费者需求增长；需把渠道迁移和终端销量分开。管理层改革说明提供研究方向，不自动构成复苏结论。',tasks:['补齐分产品、分渠道连续期间收入与毛利','核验公开渠道价格和库存，标明采样范围','对照合同负债、终端动销与管理层解释'],refs:['C1','C3']},{id:'cash-quality',name:'现金归因与资本回报',answer:'集团含财务公司，合并现金流不是纯卖酒回款。分离金融活动与制造经营，是比单看现金利润比更重要的首步。',tasks:['拆出财务公司成员存款、同业存款与制造销售现金','对照资本开支、营运资本与分配实施','以正常化盈利检验估值对增长的依赖'],refs:['C1']}]
},storageStudy,mediaStudy,gamingStudy,aiApplicationStudy,roboticsStudy];
export function valueStudyForPath(path:string){return valueStudies.find(s=>path===s.root||path===s.route||path.startsWith(s.route+'/'));}
export function valueCompanyDraft(study:ValueStudy,c=study.company){return {title:study.title+' · '+c.name+'价值研究',dataDate:study.reviewedOn,content:[c.name+'（'+c.code+'）',study.version+' · 研究整理 '+study.reviewedOn+' · 财务期间 '+c.period,c.money,c.moat,c.competition,c.cashNote,...c.answers].join('\n\n'),evidenceRefs:study.sources.filter(s=>c.refs.includes(s.id)).map(s=>({title:s.title,url:s.url,dataDate:s.date}))};}
export function valueQuestion(study:ValueStudy,company:boolean,topic?:string,c=study.company){const primary=study.sources.find(s=>s.id===(c.financeRefs?.[0]||c.refs[0]))||study.sources[0];return [
 `请补查最新财报、公告与研报，研究${company?c.name+'（'+c.code+'）':study.title+'·'+(topic||'产业价值')}的赚钱业务、壁垒与竞争，回答利润空间、持续获利、价格预期、持续验证四问。逐项引用日期与原文，不编造评级或估值。`,
 `基准${study.version}，整理${study.reviewedOn}，财务${c.period}，非最新行情。`,
 company?`${c.role}；合并人民币元：收入${c.revenue}，归母${c.profit}，经营现金${c.cash}。`:'现有分析待复核：'+study.verdict,
 c.cashNote,
 `核心原文（披露${primary.date}）：${primary.url}`
 ].join('\n');}
