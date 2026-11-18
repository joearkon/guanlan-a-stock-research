import test from 'node:test';
import assert from 'node:assert/strict';
import { stat, readFile } from 'node:fs/promises';
import { themeArtwork, getThemeArtwork } from '../v2/theme-artwork.mjs';

test('related themes reuse the exact same static artwork', () => {
  for (const [names, id] of [
    [['光通信', '光模块', 'CPO概念', '光互连'], 'optical'],
    [['存储芯片', 'HBM', 'DRAM', 'NAND闪存'], 'memory'],
    [['人形机器人', '机器人概念', '工业机器人'], 'robot'],
    [['AI算力', '数据中心', 'IDC', '算力租赁'], 'compute'],
    [['储能', '新能源', '新型储能', '风电'], 'energy'],
    [['创新药', '生物医药', 'CXO', '医疗器械'], 'biomed'],
    [['商业航天', '卫星导航', '军工航天'], 'aerospace'],
  ]) {
    for (const name of names) assert.equal(getThemeArtwork(name), themeArtwork[id]);
  }
});

test('common concept sectors resolve to thirty-one distinct local thumbnails', () => {
  const cases = [
    ['光通信', 'optical'], ['存储芯片', 'memory'], ['机器人', 'robot'],
    ['算力', 'compute'], ['储能', 'energy'], ['生物医药', 'biomed'],
    ['游戏', 'gaming'], ['半导体', 'semiconductor'], ['半导体设备', 'chip-equipment'],
    ['AI应用', 'ai-app'], ['消费电子', 'consumer-electronics'],
    ['工业自动化', 'industrial-automation'], ['低空经济', 'low-altitude'],
    ['商业航天', 'aerospace'], ['新能源汽车', 'ev'],
    ['智能驾驶', 'autonomous-driving'], ['锂电池', 'battery'],
    ['光伏', 'solar'], ['电网设备', 'power-grid'], ['核电', 'nuclear'],
    ['稀土', 'rare-earth'], ['黄金', 'gold'], ['军工', 'defense'],
    ['银行', 'finance'], ['基建', 'infrastructure'], ['白酒', 'food-beverage'],
    ['农业', 'agriculture'], ['旅游', 'tourism'],
    ['网络安全', 'cybersecurity'], ['国产软件', 'domestic-software'],
    ['电商', 'e-commerce'],
  ];
  assert.equal(cases.length, 31);
  for (const [name, id] of cases) assert.equal(getThemeArtwork(name), themeArtwork[id], name);
  assert.equal(new Set(cases.map(([, id]) => themeArtwork[id]?.src)).size, 31);
});

test('published compound board labels reuse a related thumbnail', () => {
  for (const [name, id] of [
    ['游戏研发 / 运营', 'gaming'],
    ['游戏开发 / 运营', 'gaming'],
    ['云游戏 / 互动娱乐', 'gaming'],
    ['医疗器械 / 诊断', 'biomed'],
    ['人形机器人 / 执行器', 'robot'],
    ['创新药 / 生物科技', 'biomed'],
    ['高端白酒', 'food-beverage'],
    ['电商 / 直播零售', 'e-commerce'],
    ['乳品 / 调味 / 食品加工', 'food-beverage'],
  ]) assert.equal(getThemeArtwork(name), themeArtwork[id], name);
});

test('every configured war-room relay board has a relevant local thumbnail', async () => {
  // Names are copied from stock-warroom/data/theme_linkage_pools.json (109 fixed pools).
  const names = `出版发行 / 内容版权 | AI端侧芯片 | 数字芯片设计 / SoC | 光互联 | 高速 PCB / HDI | PCB 弹性 / 接力 | CCL / 电子铜箔 | 封装基板 / IC载板 | FPC / 软板 | IDC运营 / 数据中心 | AI服务器 / 交换机 | 服务器电源 | 液冷 / 温控 | AI 应用 | AI 内容 / 数字营销 | 半导体设备 / 测试 | CMP / 湿电子化学品 | 前驱体 / 光刻材料 | 靶材 / 高纯金属材料 | 存储芯片 | 半导体厂务 / 洁净室 | 功率半导体 | 被动元件 / 陶瓷材料 | 高端被动元件 / 车规军工 | 通信射频 / 电磁屏蔽 | 锂资源 / 锂矿 | 正负极材料 | 电解液 / 锂盐 | 锂电铜箔 | 隔膜 / 涂覆材料 | 动力电芯 / 储能电池 | 固态电池 | 固态电解质 / 硅碳负极 | 固态设备 / 制造工艺 | 稀土 / 永磁 | 钨 / 硬质合金 | 锗 / 红外材料 | 人形机器人 / 执行器 | 智能驾驶 / 智能座舱 | 汽车热管理 / 电驱 | 特高压 / 电网设备 | 电力运营 / 火电水电 | 电网侧储能 / PCS | 储能电芯 / 系统集成 | 储能热管理 / 消防 | 新能源整车 / 车企 | 新能源动力 / 电驱 | 辅助驾驶 / 感知 | 创新药 / 生物科技 | CDMO / 原料药服务 | 医疗器械 / 诊断 | 有机硅 / 硅材料 | 氟化工 / 制冷剂 | 磷化工 / 磷肥 | 农药 / 化肥 | 钛白粉 / 颜料 | 纯碱 / 玻纤 | 光芯片 / 光电器件 | 半导体硅片 / 硅材料 | 家电 / 智能家居 | 美妆个护 / 医美 | 服装品牌 / 家纺 | 虚拟电厂 / 电力交易 | 核电 / 核电设备 | 电池回收 / 再生材料 | 机器人丝杠 / 精密传动 | 工业机器人 / 机器视觉 | 光伏主链 / 组件 | 风电 / 海风设备 | 绿电运营 / 水风光 | 工商业储能 / 户储 | 百货零售 / 仓储物流 | 电商 / 直播零售 | 母婴 / 宠物经济 | 运动户外 / 露营 | 家居建材 / 家装 | 商超零售 / 跨境零售 | 食品饮料 / 餐饮 | 旅游酒店 / 出行服务 | 影视消费总览 / 制作与院线 | 剧集制作 / 内容IP | 电影制作 / 发行 | 院线放映 / 影院运营 | 微短剧 / 内容IP | 短剧投流 / 发行 | 游戏研发 / 运营 | 云游戏 / 互动娱乐 | CRO / 研发服务总览 | CRO 临床前 / 安全性评价 | CRO 临床研究 / BE / 药学研发 | 种业 / 生物育种 | 粮油加工 / 粮食供应链 | 生猪养殖 / 周期 | 饲料 / 动保 | 高端白酒 | 区域白酒 / 弹性 | 啤酒 / 区域啤酒 | 黄酒 / 区域酒 | 黄金珠宝 / 饰品零售 | 餐厨用品 / 竹木日用 | 乳品 / 调味 / 食品加工 | 工业制冷 / 空冷设备 | 焦炭 / 焦化联产 | 精细化工 / 食品饲料添加剂 | 高速公路 / 交通运营 | 航空发动机 / 零部件 | 民爆装备 / 智能制造 | 铅酸蓄电池 / 传统电池 | 房地产 / 跨境物流（事件观察）`.split(' | ');
  assert.equal(names.length, 109);
  const missing = names.filter(name => !getThemeArtwork(name));
  assert.deepEqual(missing, [], `uncovered war-room boards: ${missing.join('、')}`);
});

test('normalizes casing, spaces and board suffix without guessing unrelated industries', () => {
  assert.equal(getThemeArtwork(' cpo 板块 '), themeArtwork.optical);
  assert.equal(getThemeArtwork('ＡＩ算力'), themeArtwork.compute);
  for (const name of ['', null, undefined, {}, '光伏玻璃价格', '<img src=x>']) {
    assert.equal(getThemeArtwork(name), null);
  }
});

test('current fine-sector labels resolve to meaningful new and existing local illustrations',()=>{
 for(const [name,id] of [['水产饲料','aquaculture'],['水产养殖','aquaculture'],['烘焙食品','food-processing'],['预加工食品','food-processing'],['动力煤','coal'],['炼焦煤','coal'],['普钢','steel'],['金属制品','precision-machinery'],['城商行Ⅲ','finance'],['公用事业','utilities'],['综合','diversified']])assert.equal(getThemeArtwork(name)?.id,id,name);
});

test('known primary-industry identity provides a display-only sector fallback without guessing membership from words',()=>{
 const roots=['11','22','23','24','27','28','33','34','35','36','37','41','42','43','45','46','48','49','51','61','62','63','64','65','71','72','73','74','75','76','77'];
 for(const root of roots){const context=Object.freeze({primaryIndustryCode:'SW'+root+'0101',industryPath:[]});const art=getThemeArtwork('尚未建立独立插画的细分',context);assert.ok(art?.src,root);assert.equal(context.primaryIndustryCode,'SW'+root+'0101');}
 assert.equal(getThemeArtwork('未核验新概念'),null);assert.equal(getThemeArtwork('未核验新概念',{primaryIndustryCode:'SW990101'}),null);
 assert.equal(getThemeArtwork('半导体设备',{primaryIndustryCode:'SW270108'})?.id,'chip-equipment');
 assert.equal(getThemeArtwork('芯片概念 · 集成电路封测',{primaryIndustryCode:'SW270107'})?.id,'semiconductor');
});

test('all assets are local, immutable and small enough for card thumbnails', async () => {
  assert.ok(Object.isFrozen(themeArtwork));
  for (const art of Object.values(themeArtwork)) {
    assert.ok(Object.isFrozen(art));
    assert.match(art.src, /^\/v2\/assets\/theme-[a-z0-9-]+\.(png|webp)$/);
    assert.equal(art.decorative, true);
    const asset = new URL(`../v2/assets/${art.src.split('/').at(-1)}`, import.meta.url);
    assert.ok((await stat(asset)).size < 60000, `${art.id} must not ship a full-resolution generation`);
    const bytes = await readFile(asset);
    assert.ok(bytes.length > 500);
    if (art.src.endsWith('.webp')) assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
});

test('portal, packaged-chip testing and IT service cards get distinct exact artwork without changing classification',()=>{
 for(const [name,id,code] of [['门户网站','web-portal','SW720704'],['集成电路封测','chip-packaging','SW270107'],['IT服务Ⅲ','it-services','SW710301']]){
  const context=Object.freeze({primaryIndustryCode:code});
  assert.equal(getThemeArtwork(name,context)?.id,id,name);
  assert.equal(getThemeArtwork(name)?.id,id,name+' without taxonomy');
 }
 assert.equal(getThemeArtwork('印制电路板')?.id,'pcb');
 assert.equal(getThemeArtwork('IT服务订单增长消息'),null);
});
