export function expandFundsView(data:any){
 if(data?.transport!=='funds-light-v1')return data;
 const dictionary=data.dictionary||{},resolve=(refs:any[])=>Array.isArray(refs)?refs.filter(r=>Object.hasOwn(dictionary,r.code)).map(r=>({...dictionary[r.code],...(r.overlap?{overlap:r.overlap}:{})})):[];
 return {...data,rows:Object.values(dictionary),ranks:Object.fromEntries(Object.entries(data.ranks||{}).map(([k,v])=>[k,resolve(v as any[])])),relativeStrength:{...data.relativeStrength,inflow:resolve(data.relativeStrength?.inflow),outflow:resolve(data.relativeStrength?.outflow)},changes:Object.fromEntries(Object.entries(data.changes||{}).map(([k,v])=>[k,Array.isArray(v)?resolve(v):v]))};
}
