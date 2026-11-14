import {fail} from './core.mjs';import {deepSeekBilling} from './provider-vault.mjs';
const number=v=>Number.isFinite(v)&&v>=0?v:null;
function telemetry(value,message){return{providerRequests:1,tokens:{input:number(value?.prompt_tokens),output:number(value?.completion_tokens),total:number(value?.total_tokens),reasoning:number(value?.completion_tokens_details?.reasoning_tokens)},serverToolUsage:value?.server_tool_use?Object.fromEntries(['tool_search','tool_fetch','tool_image_search'].map(k=>[k,number(value.server_tool_use[k])])):null,toolEvents:(message?.server_tool_calls||[]).flatMap(step=>(step.calls||[]).map(c=>({name:['deepseek_web_search','deepseek_read_url'].includes(c.type)?c.type:'unknown',status:c.status==='completed'?'completed':'failed',at:new Date().toISOString()}))).slice(0,256)};}
async function readJson(response){let length=0,text='';const decoder=new TextDecoder();for await(const chunk of response.body){length+=chunk.byteLength;if(length>4*1024*1024)throw fail('deepseek_response_too_large','供方返回超出安全上限，未自动重试。');text+=decoder.decode(chunk,{stream:true});}text+=decoder.decode();try{return JSON.parse(text);}catch{throw fail('deepseek_bad_response','供方未返回有效结果，未自动重试。');}}
export async function runDeepSeek({key,input,systemPrompt='保留原生研究与回答；仅使用公开证据，缺数据不要编，不执行交易。',deepThinking=false,probe=false,signal,onReceipt,fetcher=fetch,timeoutMs}){
 const limit=probe?180000:600000,timeout=AbortSignal.timeout(Math.min(limit,Math.max(1,timeoutMs??limit))),combined=signal?AbortSignal.any([signal,timeout]):timeout;
 let response;
 try{response=await fetcher('https://api.deepseek.com/chat/completions',{method:'POST',redirect:'error',signal:combined,headers:{'content-type':'application/json',authorization:'Bearer '+key},body:JSON.stringify({model:'deepseek-flash',stream:false,max_tokens:8192,thinking:{type:!probe&&deepThinking?'enabled':'disabled'},messages:[{role:'system',content:systemPrompt},{role:'user',content:probe?'这是一次连接测试，请用一句自然语言确认能响应，不要查询市场。':JSON.stringify(input)}],...(!probe?{tools:[{type:'deepseek_web_search'},{type:'deepseek_read_url'}]}:{})})});}
 catch{throw fail(timeout.aborted?'agent_timeout':signal?.aborted?'agent_cancelled':'deepseek_network_failed','DeepSeek 请求未确认；可能已产生供方费用，不自动重试。');}
 let value;try{value=await readJson(response);}catch(error){
  if(timeout.aborted||signal?.aborted)throw fail(timeout.aborted?'agent_timeout':'agent_cancelled','DeepSeek 读取中断，供方结果待核对；不会重试。');
  if(!response.ok)value={error:{}};else if(typeof error.code==='string'&&error.code.startsWith('deepseek_'))throw error;else throw fail('deepseek_network_failed','DeepSeek 读取未确认，供方可能已计费；不会重试。');
 }
 const choice=value.choices?.[0],message=choice?.message;
 const complete=response.ok&&!value.error&&choice?.finish_reason==='stop'&&typeof message?.content==='string'&&!!message.content.trim();
 const citations=(message?.annotations||[]).filter(c=>c.type==='url_citation'&&/^https?:\/\//i.test(c.url_citation?.url||'')).slice(0,100).map(c=>({url:c.url_citation.url.slice(0,4000),title:String(c.url_citation.title||'来源').slice(0,300)}));
 const receipt={nativeText:typeof message?.content==='string'?message.content:'',providerStatus:complete?'complete':'failed',model:'deepseek-flash',billingSource:deepSeekBilling,citations,telemetry:telemetry(value.usage,message)};
 onReceipt?.(receipt);
 if(!complete)throw fail(({401:'deepseek_auth_failed',402:'deepseek_balance_insufficient',429:'deepseek_rate_limited'})[response.status]??(response.status>=500?'deepseek_unavailable':response.ok&&!value.error?'deepseek_incomplete':'deepseek_failed'),'DeepSeek 未完成本轮，已保留可用回执和用量；不会自动重试或切换。');
 return receipt;
}
