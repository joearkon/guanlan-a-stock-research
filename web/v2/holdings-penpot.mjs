const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=(value,digits=0)=>Number(value).toLocaleString('zh-CN',{minimumFractionDigits:digits,maximumFractionDigits:digits});
const board=code=>/^30/.test(code)?'创业板':/^68/.test(code)?'科创板':/^(60|61)/.test(code)?'沪市主板':/^(00|01)/.test(code)?'深市主板':'A股';
const amount=value=>Number.isFinite(Number(value))&&Number(value)>=0?Number(value):null;
const quoteFor=(quotes,code)=>{const row=quotes?.[code],price=Number(row?.price);return Number.isFinite(price)&&price>0&&/^\d{4}-\d{2}-\d{2}$/.test(String(row?.asof||''))?{price,asof:row.asof,source:row.source||'已发布行情'}:null;};

export function holdingShareFromPublished(rows,published,code){
 const asof=published?.asof;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(asof||'')))return null;
 const positions=(Array.isArray(rows)?rows:[]).filter(row=>/^\d{6}$/.test(String(row?.code||'')));
 if(!positions.length)return null;
 let total=0,selected=null;
 for(const row of positions){
  const shares=Number(row.shares),price=Number(published.uni?.[row.code]?.[1]);
  if(!Number.isFinite(shares)||shares<=0||!Number.isFinite(price)||price<=0)return null;
  const value=shares*price;total+=value;
  if(row.code===code)selected=value;
 }
 return selected!==null&&total>0?{percent:Math.round(selected/total*10000)/100,asof}:null;
}

export function holdingsMarkup({rows=[],quotes={},preview=false,selected='',query='',sort='value',link=code=>`/v2/stock?code=${encodeURIComponent(code)}`}={}){
 const positions=(Array.isArray(rows)?rows:[]).filter(item=>/^\d{6}$/.test(String(item?.code||'')));
 const enriched=positions.map(item=>{const code=String(item.code),shares=amount(item.shares),cost=amount(item.cost),quote=quoteFor(quotes,code);return{...item,code,shares,cost,quote,value:shares!==null&&quote?shares*quote.price:null,gain:shares!==null&&quote&&cost!==null?shares*(quote.price-cost):null};});
 const dates=[...new Set(enriched.map(row=>row.quote?.asof).filter(Boolean))];
 const complete=enriched.length>0&&enriched.every(row=>row.value!==null)&&dates.length===1;
 const total=complete?enriched.reduce((sum,row)=>sum+row.value,0):null;
 const totalGain=complete&&enriched.every(row=>row.gain!==null)?enriched.reduce((sum,row)=>sum+row.gain,0):null;
 const highest=total>0?Math.max(...enriched.map(row=>row.value/total))*100:null;
 const needle=String(query||'').trim().toLocaleLowerCase();
 const visible=enriched.filter(row=>!needle||`${row.code} ${row.name||''}`.toLocaleLowerCase().includes(needle));
 if(sort==='value')visible.sort((a,b)=>(b.value??-1)-(a.value??-1));
 const chosen=visible.find(row=>row.code===String(selected))||visible[0];
 const previewQuery=preview?'?preview=1':'',selectedName=chosen?esc(chosen.name||chosen.code):'选择持仓证券';
 const rowMarkup=visible.length?visible.map(row=>{
  const active=chosen===row,weight=total>0&&row.value!==null?row.value/total*100:null;
  return `<tr class="ph-row ${active?'is-selected':''}" ${active?`data-selected="${esc(row.code)}"`:''}><th scope="row"><a href="/v2/holdings?${preview?'preview=1&amp;':''}selected=${esc(row.code)}${needle?'&amp;q='+encodeURIComponent(String(query).trim().slice(0,60)):''}" data-holding-select="${esc(row.code)}"><strong>${esc(row.name||row.code)}</strong><small>${row.code} · ${board(row.code)} · A股</small></a></th>
   <td>${row.cost===null?'—':money(row.cost,2)}</td><td>${row.shares===null?'—':money(row.shares)} 股</td><td>${row.value===null?'—':'¥ '+money(row.value)}</td>
   <td class="${row.gain===null?'':row.gain>=0?'ph-up':'ph-down'}">${row.gain===null?'—':`${row.gain>=0?'+':'−'}¥ ${money(Math.abs(row.gain))}`}</td><td>${weight===null?'—':money(weight,2)+'%'}</td><td>${row.quote?'收盘':'报价缺失'}</td><td><a class="ph-research" href="${esc(link(row.code))}">研究 →</a></td></tr>`;
 }).join(''):`<tr><td colspan="8" class="ph-empty"><strong>${positions.length?'没有匹配的持仓证券':'暂无持仓记录'}</strong><span>${positions.length?'请调整搜索条件。':'请先在账号中录入持仓，页面不会使用设计示例补空。'}</span></td></tr>`;
 const status=!positions.length?'尚未录入持仓':dates.length===1?`${dates[0]} 收盘快照`:'报价日期不一致或未取得报价';
 const selectedWeight=chosen&&total>0&&chosen.value!==null?money(chosen.value/total*100,2)+'%':'—';
 return `<section class="stock-workspace penpot-holdings"><header class="ph-heading"><div><h1>自选与持仓</h1><p>持仓 · 当前账号资料，不进入问观澜上下文</p>${preview?'<span class="stock-preview-badge">演示数据</span>':''}</div><nav class="stock-workspace-tabs" data-penpot-view-tabs aria-label="自选与持仓视图"><a href="/v2/watchlist${previewQuery}">观察池</a><a href="/v2/holdings${previewQuery}" aria-current="page">持仓</a></nav></header>
 <div class="ph-layout"><div class="ph-left"><div class="ph-summary"><div><small>持仓证券</small><strong>${positions.length} 只</strong></div><div><small>参考市值</small><strong>${total===null?'—':'¥ '+money(total)}</strong></div><div><small>浮动盈亏</small><strong>${totalGain===null?'—':`${totalGain>=0?'+':'−'}¥ ${money(Math.abs(totalGain))}`}</strong></div><div><small>最高权重</small><strong>${highest===null?'—':money(highest,2)+'%'}</strong></div></div>
  <div class="ph-data-status"><span>数据状态：${esc(status)} · 价格为参考报价 · 成本、股数属于当前账号</span><button type="button" data-holding-action="source">查看数据说明 →</button></div>
  <div class="ph-toolbar"><div><button type="button" class="ph-primary" data-holding-action="add">+ 录入持仓</button><button type="button" data-holding-action="import">导入</button><button type="button" data-holding-action="refresh">刷新</button></div><div><button type="button" data-holding-action="sort">按市值排序 ↓</button><label><span class="sr-only">搜索名称或代码</span><input data-holding-search type="search" placeholder="搜索名称 / 代码" value="${esc(query)}"></label></div></div>
  <section class="ph-list" aria-label="持仓证券列表"><div class="ph-table-wrap"><table><thead><tr><th>证券名称 / 类型</th><th>持仓成本</th><th>持仓股数</th><th>参考市值</th><th>浮动盈亏</th><th>组合权重</th><th></th><th>研究</th></tr></thead><tbody>${rowMarkup}</tbody></table></div><div class="ph-list-footer">共 ${visible.length} 只 · 成本、股数和盈亏只用于当前账号页面展示与计算，不会作为问观澜上下文发送。</div></section></div>
  <aside class="ph-detail" aria-label="持仓证券详情"><header><h2>${selectedName}</h2><span>${chosen?chosen.code+' · A股 · '+board(chosen.code):'—'}</span><p>${chosen?'已录入持仓':'等待选择持仓证券'}</p></header>
   <div class="ph-detail-metrics"><div><small>持仓成本</small><strong>${chosen&&chosen.cost!==null?'¥ '+money(chosen.cost,2)+' · '+(chosen.shares===null?'—':money(chosen.shares))+' 股':'—'}</strong></div><div><small>组合权重</small><strong>${selectedWeight} · 仅本页</strong></div></div>
   <section class="ph-detail-box ph-entry"><h3>研究入口</h3><p>查看公司档案、产业映射、财务与估值、催化与风险。</p>${chosen?`<a href="${esc(link(chosen.code))}">打开个股档案 →</a>`:''}</section>
   <section class="ph-detail-box"><h3>当前数据边界</h3><p>${chosen?.quote?`参考价来自 ${esc(chosen.quote.asof)} 的${esc(chosen.quote.source)}；`:'当前报价缺失；'}盘中、停牌或报价异常时不计算盈亏。</p></section>
   <section class="ph-detail-box"><h3>状态处理</h3><p>加载中保留上次快照 · 获取失败说明原因 · 数据过期显示日期并禁止伪称盈亏。</p></section>
   <small class="ph-privacy">将携带：${chosen?esc(chosen.name||chosen.code):'所选证券'}、当前研究入口与公开资料<br>不携带：成本、股数、市值、浮动盈亏</small>
  </aside></div><p class="ph-bottom-boundary">持仓、成本、股数和盈亏不进入问观澜上下文。暂无持仓引导录入；数据失败、过期均保留日期和原因。</p></section>`;
}
