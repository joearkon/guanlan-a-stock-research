// Browser-side filtering of the complete published candidate set. No requests.
export function participationGroups(row,window='daily'){
 const groups=(row.seats||[]).filter(g=>window==='all'||g.window===window),seen=new Map();
 for(const g of groups){
  const fingerprint=JSON.stringify([g.day,g.window,g.window==='daily'?'':g.reasonCode,g.conflict,g.seats.map(s=>[s.identity,s.buy,s.sell,s.net,s.association?.label||'']).sort((a,b)=>String(a[0]).localeCompare(String(b[0])))]);
  const prior=seen.get(fingerprint);if(prior)prior.reasons.push(g.reason);else seen.set(fingerprint,{...g,reasons:[g.reason]});
 }
 return [...seen.values()];
}
export function matchesParticipation(row,{window='daily',institution='all',known='all',text=''}={}){
 const groups=participationGroups(row,window);
 const institutionMatch=institution==='all'||groups.some(g=>institution==='net-buy'?g.institutionNet>0:institution==='net-sell'?g.institutionNet<0:institution==='buy'?g.institutionBuy>0:institution==='incomplete'?g.institutionRows>0&&(g.institutionBuy==null||g.institutionSell==null||g.institutionNet==null):false);
 const knownMatch=known==='all'||groups.some(g=>g.seats.some(s=>s.association&&(known==='present'||known==='net-buy'&&!g.conflict&&s.net>0||known==='net-sell'&&!g.conflict&&s.net<0||known==='uncertain'&&s.association.status==='disputed')));
 const words=[row.code,row.name,...(row.themes||[]).map(t=>t.name),...groups.flatMap(g=>g.seats.flatMap(s=>[s.name,s.association?.label||'']))].join(' ').toLowerCase();
 return institutionMatch&&knownMatch&&(!text||words.includes(text.trim().toLowerCase()));
}
