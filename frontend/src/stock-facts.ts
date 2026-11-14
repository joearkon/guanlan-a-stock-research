export function manualExcerpt(records:any[],kind:'inference'|'invalidation'):string{
 const body=(records||[]).find(r=>r.origin==='manual'&&typeof r.answer==='string')?.answer||'',label=kind==='inference'?'研究判断|判断':'失效与复核|失效条件',match=body.match(new RegExp('(?:^|[\\n。])\\s*(?:'+label+')[：:]\\s*([^\\n]{1,400})'));
 return match?.[1]?.split(/(?=失效与复核[：:]|失效条件[：:]|待复核[：:])/)[0].trim().slice(0,260)||'';
}
