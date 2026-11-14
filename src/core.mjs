export const fail=(code,message)=>Object.assign(new Error(message),{code});
export function normalizeEngine(value){
 if(!['codex','codebuddy','claude','deepseek'].includes(value))throw fail('engine_required','请明确选择本机 AI 引擎；不会回落到平台 AI。');
 return value;
}
export function validateReport(value,evidence){
 const bad=()=>{throw fail('report_invalid','报告结构或引用未通过校验，原始回执保留，不自动重新调用模型。');};
 if(!value||typeof value.answer!=='string'||!value.answer.trim()||value.answer.length>100000||!Array.isArray(value.evidenceIds)||!Array.isArray(value.missing))return bad();
 const known=new Set(evidence.map(e=>e.id));
 if(value.evidenceIds.some(id=>typeof id!=='string'||!known.has(id))||value.missing.some(s=>typeof s!=='string'||!s.trim()||s.length>500))return bad();
 if(!value.evidenceIds.length&&!value.missing.length)return bad();
 return {answer:value.answer.trim(),evidenceIds:[...new Set(value.evidenceIds)],missing:[...new Set(value.missing)]};
}
