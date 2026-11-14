import {pinyin} from 'pinyin-pro';
import type {SecurityAsset} from './security-lookup';

// Loaded only for an alphabetic query. Cache names, not an account's selections.
const names=new Map<string,readonly string[]>();
export function buildSecurityInitials(free:any,extra:SecurityAsset[]=[]):ReadonlyMap<string,readonly string[]>{
 const result=new Map<string,readonly string[]>();
 const labels=[...Object.values(free?.uni||{}).map((row:any)=>row?.[0]),...(free?.etfs||[]).map((row:any)=>row.name),...extra.map(row=>row.name)];
 for(const name of labels){
  if(typeof name!=='string'||!name||result.has(name))continue;
  let aliases=names.get(name);
  if(!aliases){
   const initials=pinyin(name,{pattern:'first',toneType:'none',type:'array'}).join('').replace(/[^a-z0-9]/gi,'').toLowerCase();
   aliases=[...new Set([initials,...(/^\*?st/i.test(name)?[initials.replace(/^st/,'')]:[])])].filter(Boolean);
   if(names.size>=20000)names.clear();names.set(name,aliases);
  }
  result.set(name,aliases);
 }
 return result;
}
