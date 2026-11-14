export function findAssets(free:any,query:string,kind:string,initials?:ReadonlyMap<string,readonly string[]>):any[]{
 const term=query.trim().toLocaleLowerCase();if(!term)return [];
 let items:any[]=[];
 if(kind==='stock')items=Object.entries(free?.uni||{}).filter(([code])=>/^\d{6}$/.test(code)).map(([code,row]:[string,any])=>({code,name:row[0],source:free.meta?.universe?.source||'站内证券目录'}));
 if(kind==='etf')items=(free?.etfs||[]).map(x=>({...x,source:free.meta?.etfs?.source||'站内ETF目录'}));
 if(kind==='industry')items=(free?.sw?.boards||[]).map(x=>({...x,source:free.meta?.sw?.source||'站内行业目录'}));
 if(kind==='concept')items=(free?.sector_flow?.groups?.concept||[]).map(x=>({...x,code:(free.sector_flow?.sources?.concept||'concept')+':'+x.code,source:free.sector_flow?.sources?.concept||'站内概念目录'}));
 return items.filter(x=>x.code&&x.name&&(String(x.code).toLocaleLowerCase().includes(term)||x.name.toLocaleLowerCase().includes(term)||initials?.get(x.name)?.some(alias=>alias.includes(term)))).slice(0,12).map(x=>({...x,code:String(x.code),kind,asof:free.asof}));
}
export function validDate(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
export function savePosition(profile:any,draft:any,free:any):any{
 const {code,shares,cost,recordDate,basket}=draft;if(!/^\d{6}$/.test(code)||!free?.uni?.[code])throw Error('证券目录中没有此代码');
 if(!Number.isInteger(shares)||shares<100||shares>1e9||!Number.isFinite(cost)||cost<=0||cost>1e7)throw Error('股数须为100至10亿的整数，成本须大于0且不超过1000万');
 if(recordDate&&!validDate(recordDate))throw Error('记录日期无效');if(String(basket||'').length>40)throw Error('分组不能超过40字');
 const next=structuredClone(profile);next.positions??=[];const index=next.positions.findIndex(p=>p.code===code),row={code,name:free.uni[code][0],shares,cost,...(recordDate?{recordDate}:{}),...(basket?{basket:String(basket).trim()}:{})};
 if(index<0){if(next.positions.length>=20)throw Error('持仓最多20项');next.positions.push(row);}else next.positions[index]=row;return next;
}
export function applyPortfolioImport(profile:any,plan:any,version:number,free:any):any{
 if(plan?.baseVersion!==version)throw Error('账户资料已变化，请重新预览');if(!['watchlist','holdings'].includes(plan?.kind)||!Array.isArray(plan.operations)||!plan.operations.length||plan.operations.length>500)throw Error('导入计划无效');
 let next=structuredClone(profile);next.pool??=[];next.positions??=[];const seen=new Set();
 for(const op of plan.operations){if(op.kind!=='stock'||!/^\d{6}$/.test(op.code)||!free?.uni?.[op.code]||seen.has(op.code))throw Error('证券目录缺失或文件存在重复代码');seen.add(op.code);if(!['add','replace'].includes(op.action))throw Error('导入操作无效');
  if(plan.kind==='holdings'){const exists=next.positions.some(r=>r.code===op.code);if(op.action==='add'&&exists||op.action==='replace'&&!exists)throw Error('持仓已变化，请重新预览');next=savePosition(next,op,free);}
  else{if(op.action!=='add'||next.pool.some(r=>(r.kind||'stock')==='stock'&&r.code===op.code&&!r.archived))throw Error('已有研究记录不能覆盖');if(String(op.reason||'').length>600)throw Error('关注原因超过600字');const archived=next.pool.find(r=>(r.kind||'stock')==='stock'&&r.code===op.code&&r.archived);if(archived)delete archived.archived;else next.pool.push({kind:'stock',code:op.code,name:free.uni[op.code][0],reason:String(op.reason||'').trim(),addedAt:new Date().toISOString(),added:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai'}).format(new Date())});}
 }
 if(next.pool.filter(r=>!r.archived).length>30||next.positions.length>20)throw Error('导入后超过账户容量');return next;
}
