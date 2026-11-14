export function focusSectors<T extends {code?:string}>(rows:T[],code:string){
 const selected=code?rows.find(row=>row.code===code):null;
 return selected?[selected,...rows.filter(row=>row!==selected).slice(0,23)]:rows.slice(0,24);
}
