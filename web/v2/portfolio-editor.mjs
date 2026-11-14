const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kinds=[['stock','证券'],['etf','ETF'],['concept','概念'],['industry','行业']];
const typeLabel=kind=>kinds.find(([key])=>key===kind)?.[1]||'证券';

export function portfolioEditorMarkup({mode='watchlist',query='',kind='stock',results=[],selected=''}={}){
 if(!['watchlist','holdings'].includes(mode))return '';
 if(mode==='holdings')kind='stock';
 const choices=results.length?results.map(item=>{
  const active=item.code===selected;
  return `<button type="button" class="pe-choice${active?' is-selected':''}" data-editor-choice="${e(item.kind||'stock')}:${e(item.code)}" aria-pressed="${active}"><strong>${e(item.name)}</strong><small>${e(item.code)} · ${typeLabel(item.kind||'stock')}</small><span>资料日期 ${e(item.asof||'未提供')} · ${e(item.source||'来源未提供')}</span></button>`;
 }).join(''):'<p class="pe-empty">当前目录无匹配结果；请核对名称或代码。</p>';
 const categories=mode==='watchlist'?`<div class="pe-kinds" role="tablist" aria-label="关注对象类型">${kinds.map(([key,label])=>`<button type="button" role="tab" data-editor-kind="${key}" aria-selected="${key===kind}">${label}</button>`).join('')}</div>`:'';
 const fields=mode==='holdings'?'<div class="pe-position"><label>持仓股数 *<input name="shares" type="number" min="100" step="1" required placeholder="输入实际股数"></label><label>成本价（元）*<input name="cost" type="number" min="0.01" step="0.01" required placeholder="输入实际成本价"></label><label>记录日期 *<input name="recordDate" type="date" required></label><label>组合 / 账户（可选）<input name="basket" maxlength="40" placeholder="选择或新建分组"></label></div>':'<label class="pe-reason">可选：关注原因（写入观察池，之后可编辑）<textarea name="reason" maxlength="600" rows="2" placeholder="例如：核对订单兑现与估值变化"></textarea></label>';
 return `<dialog class="portfolio-editor" data-portfolio-editor open aria-labelledby="portfolio-editor-title"><form method="dialog" data-editor-form><header><h2 id="portfolio-editor-title">${mode==='holdings'?'录入持仓':'添加关注'}</h2><p>${mode==='holdings'?'仅录入你确认的账户事实；公开行情与持仓数据分开。':'从证券、ETF、概念或行业加入研究队列'}</p></header><label class="pe-search"><span class="sr-only">搜索名称 / 代码 / 概念</span><input name="query" data-editor-search type="search" autocomplete="off" placeholder="搜索名称 / 代码 / 概念" value="${e(query)}"></label>${categories}<p class="pe-hint">搜索结果 · 资料日期与来源在加入前可见</p><div class="pe-choices" role="group" aria-label="搜索结果">${choices}</div>${fields}<p class="pe-feedback" data-editor-feedback role="status"></p><footer><button type="button" data-editor-cancel>取消</button><button type="submit" class="pe-primary">${mode==='holdings'?'保存持仓':'添加并保存'}</button></footer></form></dialog>`;
}

export function createPortfolioEditorController({account,mode='watchlist',onSaved=()=>{},preview=false,initialCode=''}={}){
 let kind='stock',query='',results=[],selected='';
 const search=value=>{query=String(value||'').trim();results=account.findAssets(query,kind);selected='';return results;};
 if(/^\d{6}$/.test(String(initialCode))){search(initialCode);if(results.some(item=>item.kind==='stock'&&item.code===initialCode))selected=initialCode;}
 return {
  get state(){return {kind,query,results,selected};},
  search,
  setKind(value){if(!kinds.some(([key])=>key===value))throw Error('不支持此关注对象类型');kind=value;return search(query);},
  select(valueKind,code){if(valueKind!==kind||!results.some(item=>item.kind===kind&&item.code===code))throw Error('请选择目录中的关注对象');selected=code;},
  async save(reason='',position={}){
   if(preview)throw Error('演示模式不能写入真实账号');
   if(!selected)throw Error('请选择目录中的关注对象');
   let item;
   if(mode==='holdings'){
    const shares=Number(position.shares),cost=Number(position.cost),recordDate=String(position.recordDate||'');
    if(!Number.isInteger(shares)||shares<100)throw Error('请输入有效的持仓股数');
    if(!Number.isFinite(cost)||cost<=0)throw Error('请输入有效的成本价');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(recordDate))throw Error('请输入记录日期');
    item=await account.savePosition(selected,{shares,cost,recordDate,...(String(position.basket||'').trim()?{basket:String(position.basket).trim().slice(0,40)}:{})});
   }else item=await account.addAsset(kind,selected,{reason:String(reason).trim()});
   onSaved(item);return item;
  },
 };
}
