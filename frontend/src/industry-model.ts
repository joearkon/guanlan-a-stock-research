import {industrySnapshot as s} from './industry-snapshot';
import {validDate} from './portfolio-data';
export type Assumptions={price:string;priceDate:string;eps:string;pe:string;year:string};
export function valueExpectations(input:Assumptions,today:string){
 const price=Number(input.price),eps=Number(input.eps),pe=Number(input.pe),year=Number(input.year);
 if(!input.price.trim()||!Number.isFinite(price)||price<=0||price>1e8)throw Error('请填写大于0的记录价格');
 if(!input.eps.trim()||!Number.isFinite(eps)||eps<=0||eps>1e6)throw Error('请填写大于0的年度EPS假设；不自动年化前三季度EPS');
 if(!input.pe.trim()||!Number.isFinite(pe)||pe<=0||pe>1e6)throw Error('请填写大于0的PE假设');
 if(!validDate(input.priceDate)||input.priceDate>today)throw Error('请填写真实的价格日期，不得晚于今天');
 if(!Number.isInteger(year)||year<Number(input.priceDate.slice(0,4))||year>Number(today.slice(0,4))+10)throw Error('请明确盈利年度，且不得早于价格年份');
 return {assumedValue:eps*pe,impliedEPS:price/pe,requiredGrowth:((price/pe)/eps-1)*100,scenarioReturn:(eps*pe/price-1)*100};
}
export function snapshotNeedsReview(today:string){return !validDate(today)||Date.parse(today)-Date.parse(s.reviewedOn)>7*86400000;}
export function reviewDraft(valuation:{input:Assumptions;result:ReturnType<typeof valueExpectations>}|null){
 const valuationText=valuation?`估值（用户假设，非预测）：价格${valuation.input.price}元，日期${valuation.input.priceDate}；${valuation.input.year}年度EPS ${valuation.input.eps}元，PE ${valuation.input.pe}倍；假设价值${valuation.result.assumedValue.toFixed(2)}元，价格要求EPS ${valuation.result.impliedEPS.toFixed(4)}元。`:'估值：尚未填写价格与年度盈利假设，不能判断便宜或透支。';
 return {title:'AI算力 / 天孚通信 · 四问与复核计划',dataDate:s.asOf,evidenceRefs:s.sources.map(e=>({title:e.title,url:e.url,dataDate:e.published})),content:[`公开研究快照：${s.id}；资料截至${s.asOf}，核验${s.reviewedOn}。以下为待用户确认的研究草稿，不是买卖指令。`,'产业判断：需求与供给龙头披露支持扩张线索，尚不足以确认全产业利润池扩大。','公司判断：已见累计利润增长，但现金增速落后利润，持续获利仍需复核。',valuationText,'复核计划（手工记录，不代表自动监控或通知已开启）：',...s.checkpoints.map(c=>`${c.name}：${c.when}；核验${c.check}；失效条件：${c.invalidate}`)].join('\n\n')};
}
