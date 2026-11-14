// Shared input contract only. This module never sends or verifies an SMS.
export function normalizeSmsPhone(value){
 if(typeof value!=='string'||value.length>32)return null;
 const compact=value.trim().replace(/[ -]/g,'').replace(/^(?:\+86|0086)/,'');
 return /^1[3-9]\d{9}$/.test(compact)?'+86'+compact:null;
}
export const validSmsPurpose=value=>value==='login'||value==='register';
export const validSmsCode=value=>typeof value==='string'&&/^\d{6}$/.test(value);
export const validSmsChallenge=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(value);
