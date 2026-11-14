// Poll the shared dossier receipts, not every external source. Source caches
// independently decide whether collection is due. Query pauses hidden/offline.
export function stockRefreshInterval(query:any){
 const s=query.state,failures=s.fetchFailureCount||0;
 if(failures)return Math.min(300000,60000*2**Math.min(failures,3));
 const pending=Object.values(s.data?.sources||{}).some((r:any)=>r?.status==='pending');
 if(pending)return (s.dataUpdateCount||0)<7?12000:60000;
 const delay=s.data?.refreshPolicy?.checkAfterMs;
 return Number.isFinite(delay)?Math.max(30000,Math.min(900000,delay)):300000;
}
