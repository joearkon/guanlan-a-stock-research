import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {nativeRunner} from '../src/native.mjs';
import {ResearchService} from '../src/jobs.mjs';
const contract={type:'observation-plan-v1',day:'2026-11-26',model:'a'.repeat(64),codes:['688820'],strategy:'前强二波',window:15,facts:['688820 收盘101.10元/涨跌18.94%']};
const question=`【研究日】2026-11-26\n【页面证据】${JSON.stringify(contract)}\n【用户问题】仅据快照输出观察单判断与反证。`;
test('revalidating an already saved native receipt cannot bypass the observation contract',()=>{assert.throws(()=>ResearchService.prototype.result({request:{question,outputMode:'native',evidence:[]},engine:'deepseek'},{nativeText:'普通研究报告'}),e=>e.code==='report_invalid');});
test('an evidence-backed request with no verified packet fails before resolving a key or calling a provider',async()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'guanlan-plan-native-'));let resolved=0;const previousFetch=globalThis.fetch;globalThis.fetch=async()=>{throw Error('provider must not be reached');};const c={...contract,packet:'b'.repeat(64)},q=`【研究日】${c.day}\n【页面证据】${JSON.stringify(c)}\n【用户问题】多源求证`;try{await assert.rejects(nativeRunner(dir,{resolveDeepSeek:async()=>{resolved++;return 'qa-fake-key';}})('deepseek',{question:q,context:{},evidence:[]},{jobId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',account:'qa'}));assert.equal(resolved,0);}finally{globalThis.fetch=previousFetch;fs.rmSync(dir,{recursive:true,force:true});}});
test('the selected local DeepSeek engine receives observation schema and preserves valid native receipt without another request',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'guanlan-plan-native-')),old=globalThis.fetch,calls=[];
 const value={schema:1,day:contract.day,model:contract.model,items:[{code:'688820',judgment:'仅模拟观察',support:['快照迹象'],against:['可能是假突破'],hypotheses:[],missing:['缺少资金证据']}]};
 globalThis.fetch=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}],usage:{prompt_tokens:10,completion_tokens:20,total_tokens:30}});};
 try{const run=nativeRunner(dir,{resolveDeepSeek:async()=> 'qa-fake-key'}),r=await run('deepseek',{question,context:{},deepThinking:false},{jobId:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',account:'qa'});assert.deepEqual(JSON.parse(r.nativeText),value);assert.equal(calls.length,1);assert.equal(calls[0].url,'https://api.deepseek.com/chat/completions');assert.match(calls[0].body.messages[0].content,/不能包在answer/);assert.equal(calls[0].body.messages[1].content.includes('observation-plan-v1'),true);}finally{globalThis.fetch=old;fs.rmSync(dir,{recursive:true,force:true});}
});
test('a local prose receipt remains available but is not accepted as a structured observation',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'guanlan-plan-native-')),old=globalThis.fetch;let saved=null,calls=0;
 globalThis.fetch=async()=>{calls++;return Response.json({choices:[{finish_reason:'stop',message:{content:'普通研究报告，不是观察单JSON'}}]});};
 try{await assert.rejects(nativeRunner(dir,{resolveDeepSeek:async()=> 'qa-fake-key'})('deepseek',{question,context:{}},{jobId:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',account:'qa',onReceipt:r=>saved=r}),e=>e.code==='report_invalid');assert.equal(calls,1);assert.equal(saved.nativeText,'普通研究报告，不是观察单JSON');}finally{globalThis.fetch=old;fs.rmSync(dir,{recursive:true,force:true});}
});
