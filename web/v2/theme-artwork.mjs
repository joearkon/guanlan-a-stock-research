// Presentation-only taxonomy. Sharing artwork does not imply a shared stock pool,
// supply-chain relationship, ranking, or research conclusion.
const entries = [
  ['optical', '光通信', 'theme-optical.png', ['光通信', '光模块', 'CPO', '光互连', '光纤通信']],
  ['memory', '存储芯片', 'theme-memory.png', ['存储芯片', '存储器', 'HBM', 'DRAM', 'NAND', 'NAND闪存']],
  ['robot', '机器人', 'theme-robot.png', ['机器人', '人形机器人', '人形机器人 / 执行器', '工业机器人', '具身智能']],
  ['compute', '算力基础设施', 'theme-compute-v1.webp', ['算力', 'AI算力', '人工智能算力', '数据中心', 'IDC', '算力租赁', '服务器', '智算中心']],
  ['energy', '新能源与储能', 'theme-energy-v1.webp', ['新能源', '储能', '风电', '电池储能', '新型储能']],
  ['biomed', '医药与生物技术', 'theme-biomed-v1.webp', ['医药', '生物医药', '创新药', '创新药 / 生物科技', 'CXO', '医疗器械', '医疗器械 / 诊断', '生物技术']],
  ['gaming', '游戏', 'theme-gaming.webp', ['游戏', '网络游戏', '云游戏', '游戏开发', '游戏运营', '游戏开发 / 运营', '游戏研发 / 运营', '云游戏 / 互动娱乐']],
  ['semiconductor', '半导体', 'theme-semiconductor.webp', ['半导体', '芯片', '集成电路', '晶圆制造']],
  ['chip-equipment', '半导体设备', 'theme-chip-equipment.webp', ['半导体设备', '芯片设备', '光刻机', '晶圆设备']],
  ['ai-app', 'AI应用', 'theme-ai-app.webp', ['AI应用', '人工智能应用', 'AI软件', '大模型应用']],
  ['consumer-electronics', '消费电子', 'theme-consumer-electronics.webp', ['消费电子', '智能手机', '智能穿戴', '智能终端']],
  ['industrial-automation', '工业自动化', 'theme-industrial-automation.webp', ['工业自动化', '智能制造', '工业母机', '智能工厂']],
  ['low-altitude', '低空经济', 'theme-low-altitude.webp', ['低空经济', 'eVTOL', '飞行汽车', '通用航空']],
  ['aerospace', '商业航天', 'theme-aerospace.webp', ['商业航天', '卫星互联网', '航天航空', '卫星通信', '卫星导航', '军工航天']],
  ['ev', '新能源汽车', 'theme-ev.webp', ['新能源汽车', '新能源车', '电动汽车', '汽车整车']],
  ['autonomous-driving', '智能驾驶', 'theme-autonomous-driving.webp', ['智能驾驶', '自动驾驶', '车路云', '无人驾驶']],
  ['battery', '锂电池', 'theme-battery.webp', ['锂电池', '动力电池', '固态电池', '电池']],
  ['solar', '光伏', 'theme-solar.webp', ['光伏', '光伏发电', '太阳能', '光伏设备']],
  ['power-grid', '电网设备', 'theme-power-grid.webp', ['电网设备', '智能电网', '特高压', '电力设备']],
  ['nuclear', '核电', 'theme-nuclear.webp', ['核电', '核能', '核电设备']],
  ['rare-earth', '稀土', 'theme-rare-earth.webp', ['稀土', '稀土永磁', '磁性材料']],
  ['gold', '黄金有色', 'theme-gold.webp', ['黄金', '有色金属', '贵金属', '铜概念']],
  ['defense', '国防军工', 'theme-defense.webp', ['军工', '国防军工', '军工电子', '航空装备']],
  ['finance', '银行金融', 'theme-finance.webp', ['银行', '金融', '证券', '金融科技']],
  ['infrastructure', '基建工程', 'theme-infrastructure.webp', ['基建', '基础建设', '建筑工程', '轨道交通']],
  ['food-beverage', '白酒食品', 'theme-food-beverage.webp', ['白酒', '高端白酒', '食品饮料', '酿酒', '乳业', '乳品 / 调味 / 食品加工']],
  ['agriculture', '农业种业', 'theme-agriculture.webp', ['农业', '种业', '粮食安全', '农林牧渔']],
  ['tourism', '文旅消费', 'theme-tourism.webp', ['旅游', '文旅', '景区', '酒店餐饮']],
  ['cybersecurity', '网络安全', 'theme-cybersecurity.webp', ['网络安全', '数据安全', '信息安全', '信创安全']],
  ['domestic-software', '国产软件', 'theme-domestic-software.webp', ['国产软件', '信创', '操作系统', '工业软件']],
  ['e-commerce', '电商零售', 'theme-e-commerce.webp', ['电商', '电子商务', '直播电商', '直播零售', '电商 / 直播零售']],
  ['publishing', '出版版权', 'theme-publishing.webp', ['出版', '版权', '图书发行']],
  ['pcb', '电子电路', 'theme-pcb.webp', ['PCB', '印制电路板', '覆铜板', '电子铜箔']],
  ['chemical', '化工材料', 'theme-chemical.webp', ['化工材料', '精细化工', '化工']],
  ['beauty', '美妆医美', 'theme-beauty.webp', ['美妆', '医美', '化妆品']],
  ['apparel', '服饰家纺', 'theme-apparel.webp', ['服装', '家纺', '服饰']],
  ['pet', '宠物经济', 'theme-pet.webp', ['宠物', '宠物经济', '母婴']],
  ['retail-logistics', '仓储物流', 'theme-retail-logistics.webp', ['仓储物流', '零售物流', '物流']],
  ['cinema', '影视院线', 'theme-cinema.webp', ['影视', '电影', '院线', '影院']],
  ['home', '家居建材', 'theme-home.webp', ['家居', '家装', '智能家居']],
  ['outdoor', '运动户外', 'theme-outdoor.webp', ['运动户外', '露营', '户外装备']],
  ['aquaculture', '水产与饲料', 'theme-aquaculture-v1.webp', ['水产饲料', '水产养殖', '水产品加工']],
  ['food-processing', '食品加工', 'theme-food-processing-v1.webp', ['烘焙食品', '预加工食品', '食品加工', '其他食品', '食品综合']],
  ['coal', '煤炭', 'theme-coal-v1.webp', ['煤炭', '动力煤', '炼焦煤', '焦煤', '焦炭']],
  ['steel', '钢铁', 'theme-steel-v1.webp', ['钢铁', '普钢', '特钢', '冶钢原料', '板材', '长材']],
  ['utilities', '公用事业', 'theme-utilities-v1.webp', ['公用事业', '水务', '水力发电', '水电', '燃气', '电力运营']],
  ['precision-machinery', '精密机械与金属制品', 'theme-precision-machinery-v1.webp', ['机械设备', '金属制品', '轴承', '齿轮', '减速器', '丝杠', '工程机械器件', '通用设备', '专用设备']],
  ['diversified', '综合产业', 'theme-diversified-v1.webp', ['综合', '综合Ⅲ']],
];

export const themeArtwork = Object.freeze(Object.fromEntries(entries.map(([id, label, filename]) => [
  id, Object.freeze({ id, label, src: `/v2/assets/${filename}`, decorative: true }),
])));

function normalize(value) {
  return typeof value === 'string'
    ? value.normalize('NFKC').replace(/\s+/g, '').replace(/(?:概念|板块)$/, '').toLowerCase()
    : '';
}

const aliases = new Map(entries.flatMap(([id, , , names]) => names.map(name => [normalize(name), id])));

// Exact fixed-pool names from the war-room taxonomy. Do not fuzzy-match arbitrary
// user text: a near word is not evidence that two industries share constituents.
const warRoomAliases = {
  publishing: ['出版发行 / 内容版权'],
  semiconductor: ['AI端侧芯片', '数字芯片设计 / SoC', '功率半导体', '被动元件 / 陶瓷材料', '高端被动元件 / 车规军工', '半导体硅片 / 硅材料'],
  optical: ['光互联', '光芯片 / 光电器件'],
  pcb: ['高速 PCB / HDI', 'PCB 弹性 / 接力', 'CCL / 电子铜箔', '封装基板 / IC载板', 'FPC / 软板', '通信射频 / 电磁屏蔽'],
  compute: ['IDC运营 / 数据中心', 'AI服务器 / 交换机', '服务器电源', '液冷 / 温控', '工业制冷 / 空冷设备'],
  'ai-app': ['AI 应用', 'AI 内容 / 数字营销'],
  'chip-equipment': ['半导体设备 / 测试', '半导体厂务 / 洁净室'],
  chemical: ['CMP / 湿电子化学品', '前驱体 / 光刻材料', '靶材 / 高纯金属材料', '有机硅 / 硅材料', '氟化工 / 制冷剂', '磷化工 / 磷肥', '钛白粉 / 颜料', '纯碱 / 玻纤', '焦炭 / 焦化联产', '精细化工 / 食品饲料添加剂'],
  memory: ['存储芯片'],
  battery: ['锂资源 / 锂矿', '正负极材料', '电解液 / 锂盐', '锂电铜箔', '隔膜 / 涂覆材料', '动力电芯 / 储能电池', '固态电池', '固态电解质 / 硅碳负极', '固态设备 / 制造工艺', '电池回收 / 再生材料', '铅酸蓄电池 / 传统电池'],
  'rare-earth': ['稀土 / 永磁'],
  gold: ['钨 / 硬质合金', '锗 / 红外材料', '黄金珠宝 / 饰品零售'],
  robot: ['人形机器人 / 执行器', '机器人丝杠 / 精密传动', '工业机器人 / 机器视觉'],
  'autonomous-driving': ['智能驾驶 / 智能座舱', '辅助驾驶 / 感知'],
  ev: ['汽车热管理 / 电驱', '新能源整车 / 车企', '新能源动力 / 电驱'],
  'power-grid': ['特高压 / 电网设备', '电力运营 / 火电水电', '虚拟电厂 / 电力交易', '绿电运营 / 水风光'],
  energy: ['电网侧储能 / PCS', '储能电芯 / 系统集成', '储能热管理 / 消防', '工商业储能 / 户储', '风电 / 海风设备'],
  biomed: ['创新药 / 生物科技', 'CDMO / 原料药服务', '医疗器械 / 诊断', 'CRO / 研发服务总览', 'CRO 临床前 / 安全性评价', 'CRO 临床研究 / BE / 药学研发'],
  agriculture: ['农药 / 化肥', '种业 / 生物育种', '粮油加工 / 粮食供应链', '生猪养殖 / 周期', '饲料 / 动保'],
  home: ['家电 / 智能家居', '家居建材 / 家装', '餐厨用品 / 竹木日用'],
  beauty: ['美妆个护 / 医美'],
  apparel: ['服装品牌 / 家纺'],
  nuclear: ['核电 / 核电设备'],
  solar: ['光伏主链 / 组件'],
  'retail-logistics': ['百货零售 / 仓储物流', '商超零售 / 跨境零售', '房地产 / 跨境物流（事件观察）'],
  'e-commerce': ['电商 / 直播零售'],
  pet: ['母婴 / 宠物经济'],
  outdoor: ['运动户外 / 露营'],
  'food-beverage': ['食品饮料 / 餐饮', '高端白酒', '区域白酒 / 弹性', '啤酒 / 区域啤酒', '黄酒 / 区域酒', '乳品 / 调味 / 食品加工'],
  tourism: ['旅游酒店 / 出行服务'],
  cinema: ['影视消费总览 / 制作与院线', '剧集制作 / 内容IP', '电影制作 / 发行', '院线放映 / 影院运营', '微短剧 / 内容IP', '短剧投流 / 发行'],
  gaming: ['游戏研发 / 运营', '云游戏 / 互动娱乐'],
  infrastructure: ['高速公路 / 交通运营'],
  aerospace: ['航空发动机 / 零部件'],
  'industrial-automation': ['民爆装备 / 智能制造'],
  finance: ['城商行Ⅲ', '农商行Ⅲ', '国有大型银行Ⅲ', '股份制银行Ⅲ', '证券Ⅲ', '保险Ⅲ', '多元金融'],
};
for (const [id, names] of Object.entries(warRoomAliases)) {
  for (const name of names) aliases.set(normalize(name), id);
}

// These are presentation fallbacks for explicit official SW identities only.
// They do not assign a security to an industry, infer company business, or affect signals.
const primaryArtwork=Object.freeze({
 '11':'agriculture','22':'chemical','23':'steel','24':'gold','27':'semiconductor','28':'ev',
 '33':'home','34':'food-processing','35':'apparel','36':'home','37':'biomed',
 '41':'utilities','42':'retail-logistics','43':'home','45':'e-commerce','46':'tourism',
 '48':'finance','49':'finance','51':'diversified','61':'home','62':'infrastructure',
 '63':'energy','64':'precision-machinery','65':'defense','71':'domestic-software',
 '72':'publishing','73':'optical','74':'coal','75':'chemical','76':'utilities','77':'beauty',
});
const leafArtwork=Object.freeze({SW110403:'aquaculture',SW340406:'food-processing',SW340802:'food-processing',SW270108:'chip-equipment',SW270107:'semiconductor',SW650101:'aerospace'});
/** Unknown unclassified themes still return null; no substring or stock-pool inference. */
export function getThemeArtwork(name,context={}) {
  const exact=themeArtwork[aliases.get(normalize(name))];if(exact)return exact;
  const code=typeof context?.primaryIndustryCode==='string'?context.primaryIndustryCode:'';
  if(!/^SW\d{6}$/.test(code))return null;
  return themeArtwork[leafArtwork[code]||primaryArtwork[code.slice(2,4)]]||null;
}
export function handleArtworkError(event,doc=document){
 const img=event.target;if(!img?.matches?.('img.w-theme-art'))return;
 const fallback=doc.createElement('div');fallback.className='w-theme-art w-theme-art-empty';fallback.setAttribute('aria-hidden','true');fallback.textContent='◇';img.replaceWith(fallback);
}
