// Paths are route templates, not arbitrary user-supplied URLs or security identities.
const segments=new Set('next login logout account usage security admin industry compare semiconductors advanced-process equipment layers cleanroom ai-compute liquid-cooling companies consumer baijiu dividend hydropower batteries storage robotics coal oil-gas stock battle-dashboard watchlist holdings my-research notifications market-observation funding-observation radar-observation review emotion monitor relay auction agent coming-soon construction manufacturing materials eda packaging design power etch deposition'.split(' '));
export function diagnosticPage(value){const path=String(value||'').split(/[?#]/)[0];if(!/^\/next(?:\/|$)/.test(path))return '/next/';return '/'+path.split('/').filter(Boolean).slice(0,9).map(s=>segments.has(s)?s:':item').join('/')+(path.endsWith('/')?'/':'');}
export const diagnosticFile=value=>typeof value==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,95}\.js$/.test(value)?value:null;
export function validDiagnostic(d){
 if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).some(k=>!['id','page','kind','errorType','reactCode','entry','asset','frames','viewport','online'].includes(k)))return false;
 return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(d.id)&&typeof d.page==='string'&&d.page.length<=220&&diagnosticPage(d.page)===d.page&&
 ['render','resource','runtime','promise'].includes(d.kind)&&['Error','TypeError','ReferenceError','SyntaxError','RangeError','Unknown'].includes(d.errorType)&&
 (d.reactCode===null||/^\d{1,4}$/.test(d.reactCode))&&(d.entry==='unknown'||!!diagnosticFile(d.entry))&&(d.asset===null||!!diagnosticFile(d.asset))&&
 ['mobile','tablet','desktop'].includes(d.viewport)&&typeof d.online==='boolean'&&Array.isArray(d.frames)&&d.frames.length<=8&&d.frames.every(f=>f&&Object.keys(f).length===3&&diagnosticFile(f.file)&&Number.isSafeInteger(f.line)&&f.line>0&&f.line<=10000000&&Number.isSafeInteger(f.column)&&f.column>0&&f.column<=10000000);
}
