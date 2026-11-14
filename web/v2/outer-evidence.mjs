const day=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'');
export function outerEvidence(outer={},meta={},asof){
 const reference=outer.reference_day||asof,cutoff=Date.parse(reference+'T23:59:59+08:00');
 return (outer.metrics||[]).filter(r=>typeof r.value==='number'&&Number.isFinite(r.value)&&r.value>0).flatMap(r=>{
  const verified=typeof r.as_of_beijing==='string'&&/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(r.as_of_beijing),stamp=verified?r.as_of_beijing:String(r.as_of||''),d=stamp.slice(0,10);
  if(day(d)&&d>reference)return [];
  const instant=verified?Date.parse(r.quote_at||stamp.replace(' ','T')+'+08:00'):NaN;
  const stale=!day(d)||!verified||!Number.isFinite(instant)||cutoff-instant>96*3600000;
  return [{id:String(r.id),label:String(r.label||r.id),value:r.value,pct:typeof r.chg_pct==='number'&&Number.isFinite(r.chg_pct)?r.chg_pct:null,asOf:stamp||'未提供',sourceTime:String(r.as_of||'未提供'),timeZone:verified?'北京时间':'原始时间 · 时区未核验',sourceTimeZone:r.source_timezone||'未核验',stale,source:meta.source||'站内外围行情',fetchedAt:r.fetched_at||meta.fetched_at||null}];
 });
}
