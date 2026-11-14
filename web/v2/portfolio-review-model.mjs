const validNumber=value=>typeof value==='number'&&Number.isFinite(value)&&value>0;
export function buildDailyPortfolioReview(free={},positions=[]){
 const day=String(free.asof||'').slice(0,10);
 const rows=(Array.isArray(positions)?positions:[]).map(position=>{
  const quote=free.uni?.[position.code],price=validNumber(quote?.[1])?quote[1]:null;
  const shares=Number.isInteger(position.shares)&&position.shares>0?position.shares:null;
  return {code:String(position.code||''),name:String(position.name||quote?.[0]||position.code||''),shares,cost:validNumber(position.cost)?position.cost:null,recordDate:position.recordDate||null,price,sourceDate:price?day:null,referenceValue:price&&shares?Math.round(price*shares*100)/100:null,marketValue:null,weight:null};
 });
 const covered=rows.filter(row=>row.referenceValue!==null).length;
 return {day,rows,coverage:`${covered} / ${rows.length}`,ledgerStatus:'缺少逐日持仓及成交明细',dailyPnl:null,operationScore:null,riskScore:null,planScore:null,verdict:rows.length?'已记录当前持仓；先核对逐日台账，再评价操作。':'尚未录入持仓；先建立组合台账，再开始复盘。'};
}
