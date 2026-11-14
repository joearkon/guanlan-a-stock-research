// Product-business associations, not supplier confirmations or benefit rankings.
import equipmentEvidence from '../../shared/semiconductor-equipment-evidence.json';
import layerEvidence from '../../shared/semiconductor-layer-evidence.json';
export function semiconductorCompanyLayer(code:string){return layerEvidence.find(l=>l.business.some(c=>c.code===code))?.id||(equipmentEvidence.some(e=>e.business.some(c=>c.code===code))?'equipment':null);}
export const semiconductorCompanies=[
 {code:'688012',name:'中微公司',layer:'equipment',processes:['etch','deposition'],role:'等离子体刻蚀、薄膜及 MOCVD 设备',source:'https://www.amec-inc.com/uploads/files/20250902/17568042727426.pdf',sourceLabel:'公司产品介绍（2025年版）',basis:'公司公开产品介绍列示刻蚀、薄膜及 MOCVD 产品；不同薄膜路线的客户验证与收入贡献须分别核验。',limit:'产品覆盖不能证明本轮扩产的订单归属；MOCVD 的应用需求不能代替所有集成电路沉积需求。'},
 {code:'002371',name:'北方华创',layer:'equipment',processes:['etch','deposition'],role:'刻蚀、PVD、CVD 等半导体装备',source:'https://www.naura.com/',sourceLabel:'公司官网产品目录',basis:'官网产品目录列示等离子刻蚀、物理气相沉积和化学气相沉积设备。',limit:'设备品类覆盖不等于所有工艺可替代；新增订单、验收与产品收入仍需对应披露。'},
 {code:'688072',name:'拓荆科技',layer:'equipment',processes:['deposition'],role:'PECVD、ALD及沟槽填充薄膜设备',source:'https://static.cninfo.com.cn/finalpage/2026-08-21/1225486631.PDF',sourceLabel:'2026半年报 · 第41、56页',basis:'半年报列示PECVD、ALD及沟槽填充产品，按机型区分产业化应用和验证；不能把产品目录整体视作已实现订单。',limit:'薄膜设备业务支持研究关联；客户验证、销售与产能指引应逐机型核对，不能由海外扩产直接确认受益。'},
 {code:'688147',name:'微导纳米',layer:'equipment',processes:['deposition'],role:'半导体ALD、PEALD及CVD设备',source:'https://static.cninfo.com.cn/finalpage/2026-04-29/1225246676.PDF',sourceLabel:'2025年报 · 第12–14页',basis:'年报半导体产品表列示iTomic ALD/PEALD与iTronix CVD系列，并分别标明应用、验证或开发阶段。',limit:'光伏与半导体设备要分开；样机、合同履行和已实现销售不是同一阶段，也不能把光伏订单当半导体收入。'},
 {code:'688981',name:'中芯国际',layer:'manufacturing',processes:['foundry'],role:'晶圆制造与代工',source:'',sourceLabel:'既有产业跟踪目录 · 业务原文待补',basis:'按已有产业目录纳入制造端财报跟踪；具体工艺、客户与产能须查对应披露。',limit:'公司财报不代表整个制造行业，不能从单家公司增长推算行业市场份额。'},
];
export const semiconductorLayerPath=(id:string)=>id==='equipment'?'/industry/semiconductors/equipment':'/industry/semiconductors/layers/'+id;
