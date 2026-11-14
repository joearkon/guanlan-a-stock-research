const routes=new Set(['/','/watchlist','/holdings','/portfolio-review','/market-observation','/review','/emotion','/radar-observation','/monitor','/relay','/auction','/notifications']);
export function safeResearchReturn(value:any):string|null{
 if(typeof value!=='string'||value.length>2000||!value.startsWith('/')||value.startsWith('//')||/[\\\u0000-\u001f]/.test(value))return null;
 try{const u=new URL(value,'https://guanlan.invalid'),industry=/^\/industry(?:\/(?:ai-compute|semiconductors)(?:\/(?:equipment(?:\/(?:etch|deposition))?|layers\/[a-z-]+(?:\/[a-z-]+)?|companies\/\d{6}|advanced-process))?)?$/.test(u.pathname);return u.origin==='https://guanlan.invalid'&&(routes.has(u.pathname)||industry)?u.pathname+u.search+u.hash:null;}catch{return null;}
}
