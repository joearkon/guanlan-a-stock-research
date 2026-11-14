import {financialData} from './financial-data';
export function mergeHistory(payload:any,pages:any[]=[]){
 let before=payload.bars?.[0]?.time,bars=[...(payload.bars||[])];
 for(const page of pages){
  if(page.code!==payload.code||page.period!==payload.period||page.adjustment!==payload.adjustment)throw Error('历史标的、周期或复权口径不一致');
  if(!page.window||page.window.before!==before||page.bars.some(b=>b.time>=before||b.time<page.window.start||b.time>page.window.end))throw Error('历史分页日期不一致');
  bars=[...page.bars,...bars];before=page.window.start;
 }
 financialData({bars});return {...payload,bars};
}
