export const SEMI_BOM_VERSION='semi-bom-v1-20261030';
export type BomBranch='etch'|'deposition';
export type BomPart={id:string;name:string;role:string;demand:string;quantity:string;constraint:string;validation:string};
export const bomBranches={
 etch:{name:'刻蚀',description:'有选择地移除材料，把图形转移到晶圆结构中。',route:'导体 / 介质刻蚀、反应离子刻蚀与原子层刻蚀需分别核验。',source:'https://www.lamresearch.com/products/our-processes/etch/',
 parts:[
  {id:'chamber',name:'工艺腔体与反应控制',role:'组织反应环境与晶圆表面处理；研究重点是选择性、均匀性和结构控制。',demand:'工艺步骤、材料组合与结构复杂度改变工艺要求；不能仅按晶圆产能推算设备需求。',quantity:'观察工艺步骤、腔体配置与单片处理时间；未取得机型、配置和采购单价，不计算占比。',constraint:'不同材料、深宽比和量产条件下的工艺窗口不能互相替代。',validation:'核对适用工艺、量产验证、设备验收与复购，不以产品发布代替交付。'},
  {id:'rf',name:'等离子体与射频系统',role:'在等离子体刻蚀路线中形成和控制反应条件，须按具体机型核验配置。',demand:'随工艺控制精度变化研究功率控制与匹配需求，而不是直接预测采购金额。',quantity:'数量、功率等级、射频源配置与单价尚无当前机型披露。',constraint:'性能指标、匹配稳定性、可靠性与整机验证共同构成约束。',validation:'查明具体产品、整机认证和批量供货证据；未经披露不确认供应商。'},
  {id:'gas',name:'气体、真空与耗材',role:'围绕反应环境、工艺气体与维护耗材核查运行需求。',demand:'新设备投入与存量设备稼动率分别影响一次性配置和后续消耗。',quantity:'流量、腔体寿命、维护周期和单片消耗未取得，不推算经常性收入。',constraint:'纯度、泄漏控制、工艺兼容性和污染控制需逐项验证。',validation:'把设备出货、耗材复购、服务收入拆开；核对利用率与回款变化。'},
 ] satisfies BomPart[]},
 deposition:{name:'薄膜沉积',description:'在晶圆上形成介电层或导电材料薄膜。',route:'CVD、ALD、PVD 等路线按材料、结构与工艺适用性分别研究。',source:'https://www.lamresearch.com/products/our-processes/deposition/',
 parts:[
  {id:'chamber',name:'工艺腔体与反应控制',role:'控制成膜过程；研究薄膜厚度、均匀性、覆盖与材料适用范围。',demand:'从新增产线及工艺步骤追踪需求，不把层数增加直接等同收入同比。',quantity:'观察工艺步骤、腔体配置与单片处理时间；未取得机型、配置和采购单价，不计算占比。',constraint:'不同沉积路线的温度、材料和结构要求不同，不能共用一张成本表。',validation:'按路线核验验证进度、产能、交付、验收与持续服务收入。'},
  {id:'gas',name:'前驱体与供气控制',role:'在相应化学沉积路线中提供反应材料并控制输送。',demand:'按薄膜材料、工艺路线和客户验证跟踪需求，区分送样与批量采购。',quantity:'单片耗量、转换效率、规格与成交价格尚未取得，不填国产化率。',constraint:'纯度、稳定性、工艺配方和客户验证可能形成约束，须有具体证据。',validation:'核查材料认证、复购、产品收入与应收变化，不确认未经披露的客户。'},
  {id:'thermal',name:'温控、真空与维护',role:'围绕反应环境稳定性、设备运行和维护消耗核查配套。',demand:'存量设备利用率、维护周期与新增设备数量分别驱动不同需求。',quantity:'配套数量、寿命及价格依机型而变，当前未建立金额BOM。',constraint:'可靠性、污染控制、工艺兼容性与本地服务能力需要共同验证。',validation:'区分安装交付、维保和耗材收入，持续追踪毛利率与现金回款。'},
 ] satisfies BomPart[]},
} as const;

export function fourQuestionPrompt(node:string,branch:BomBranch|null,snapshot:string){
 return `对半导体 / ${node}${branch?' / '+bomBranches[branch].name:''}做证据驱动的四问研判。${branch?'BOM版本：'+SEMI_BOM_VERSION:'研究结构：semi-tree-20261030'}；财报回执：${snapshot||'未取得'}。核对原文、报告期、单位和同口径比较；框架不确认采购或供应关系。固定回答：1产业利润池是否扩大；2公司利润与现金能否兑现；3价格预期要求什么（无价格日期和年度盈利假设就留缺口）；4反证与下次核验。每问列事实、推断、反证、来源及缺口，结论限有证据支持/部分支持/出现反证/资料不足。数字可核验，不补造，不以股价代替景气，不输出买卖指令。仅本次，不自动重跑。`;
}
