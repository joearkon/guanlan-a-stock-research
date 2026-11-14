import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {JobStore,ResearchService} from '../src/jobs.mjs';
const id='d5858565-fb2d-4a60-a13d-213563dfb9bc';
function fixture(){return path.join(fs.mkdtempSync(path.join(os.tmpdir(),'gl-local-test-')),'local.sqlite');}
function clean(t,store,filename){t.after(()=>{store.close();const dir=path.resolve(path.dirname(filename));assert.equal(path.dirname(dir),path.resolve(os.tmpdir()));assert.ok(path.basename(dir).startsWith('gl-local-test-'));fs.rmSync(dir,{recursive:true,force:true});});}
const waitFor=async fn=>{for(let n=0;n<100;n++){const value=await fn();if(value)return value;await new Promise(r=>setTimeout(r,10));}assert.fail('job did not settle');};
const request={turnId:id,question:'建立研究框架',context:{page:'研究工作台'},outputMode:'structured',engine:'codex',evidence:[]};
test('refresh and repeated submissions execute the selected local engine exactly once',async t=>{
 const filename=fixture(),store=new JobStore(filename);clean(t,store,filename);let calls=0;
 const service=new ResearchService(store,async engine=>{calls++;assert.equal(engine,'codex');return {answer:'行情未提供，只列研究步骤。',evidenceIds:[],missing:['行情未提供']};});
 service.create('account:1',request);service.create('account:1',request);
 const finished=await waitFor(()=>{const j=service.get('account:1',id);return j?.status==='complete'&&j;});
 assert.equal(calls,1);assert.equal(finished.result.engine,'codex');assert.equal(finished.result.diagnostics.tokens.total,null);
 service.create('account:1',request);assert.equal(calls,1);
 assert.throws(()=>service.create('account:1',{...request,question:'另一问题'}),{code:'request_conflict'});
 assert.equal(service.get('account:2',id),null);
});
test('a failed WorkBuddy request never falls back or automatically retries on refresh',async t=>{
 const filename=fixture(),store=new JobStore(filename);clean(t,store,filename);const engines=[];
 const service=new ResearchService(store,async engine=>{engines.push(engine);throw Object.assign(Error('do not expose provider raw output'),{code:'agent_not_authenticated'});});
 service.create('a',{...request,engine:'codebuddy'});await waitFor(()=>service.get('a',id)?.status==='failed');
 service.create('a',{...request,engine:'codebuddy'});assert.deepEqual(engines,['codebuddy']);assert.equal(service.get('a',id).error.includes('raw output'),false);
 await assert.rejects(()=>service.resume('a',id),{code:'receipt_missing'});assert.equal(engines.length,1);
});
test('restart preserves uncertain tasks and saved outputs, without running any model',async t=>{
 const filename=fixture(),store=new JobStore(filename);const task=store.insert('a',request);store.begin(task.id,'a');store.close();
 const reopened=new JobStore(filename);clean(t,reopened,filename);let calls=0;const service=new ResearchService(reopened,async()=>{calls++;});
 assert.ok(service.get('a',id),'persisted task must remain readable');assert.equal(service.get('a',id).status,'needs_attention');assert.equal(calls,0);
 await assert.rejects(()=>service.resume('a',id),{code:'receipt_missing'});assert.equal(calls,0);
});
test('profile version conflict and account isolation preserve the previous saved data',t=>{
 const filename=fixture(),store=new JobStore(filename);clean(t,store,filename);const before=store.profile('a');
 store.saveProfile('a',{pool:[{code:'000001',name:'测试证券'}],positions:[]},before.version);
 assert.throws(()=>store.saveProfile('a',{pool:[]},before.version),{code:'version_conflict'});
 assert.equal(store.profile('a').profile.pool.length,1);assert.equal(store.profile('b').profile.pool.length,0);
});

test('timeout is uncertain, and revalidating a saved receipt never invokes the engine',async t=>{
 const filename=fixture(),store=new JobStore(filename);clean(t,store,filename);let calls=0;
 const service=new ResearchService(store,async()=>{calls++;throw Object.assign(Error('timeout'),{code:'agent_timeout'});});
 service.create('a',request);await waitFor(()=>!service.active.size);
 assert.equal(service.get('a',id).status,'needs_attention');
 service.create('a',request);assert.equal(calls,1);
 store.receipt('a',id,{answer:'只有连通记录，缺少行情。',evidenceIds:[],missing:['行情未提供']});
 const restored=await service.resume('a',id);assert.equal(restored.status,'complete');assert.equal(calls,1);
 const messages=store.messages('a',restored.result.conversationId).messages;
 assert.equal(messages.length,2);assert.deepEqual(messages[1].report.missing,['行情未提供']);
});

test('WorkBuddy prose followed by one JSON fence is validated from the saved receipt, without a rerun',async t=>{
 const filename=fixture(),store=new JobStore(filename);clean(t,store,filename);let calls=0;
 const service=new ResearchService(store,async()=>{calls++;return '当前环境没有 StructuredOutput 工具，因此直接输出 JSON：\n```json\n'+JSON.stringify({answer:'只确认本机响应。',evidenceIds:[],missing:['没有行情']})+'\n```';});
 service.create('a',{...request,engine:'codebuddy'});await waitFor(()=>!service.active.size);
 assert.equal(service.get('a',id).status,'complete');assert.equal(calls,1);
 await service.resume('a',id);assert.equal(calls,1);
 const bad=store.insert('b',{...request,turnId:'d5858565-fb2d-4a60-a13d-213563dfb9bd'});
 assert.throws(()=>service.result(bad,'```json\n{}\n```\n```json\n{}\n```'),{code:'report_invalid'});
});

test('changing the writing preference cannot silently reuse a different request under the same task id',async t=>{
 const filename=fixture(),store=new JobStore(filename);clean(t,store,filename);let calls=0;
 const service=new ResearchService(store,async()=>{calls++;return {answer:'只说明研究步骤。',evidenceIds:[],missing:['无行情']};});
 service.create('a',{...request,agentRole:'professional',responseDetail:'concise'});
 assert.throws(()=>service.create('a',{...request,agentRole:'legacy',responseDetail:'detailed'}),{code:'request_conflict'});
 await waitFor(()=>!service.active.size);assert.equal(calls,1);
});

test('cleanup failure retains a pre-cleanup native receipt and recovery never reruns the engine',async t=>{
 const filename=fixture(),store=new JobStore(filename);clean(t,store,filename);let calls=0;
 const service=new ResearchService(store,async(engine,request,options)=>{
  calls++;options.onReceipt({nativeText:'## 已完成原生研究\n清理故障不应丢弃已返回正文。',telemetry:{toolEvents:[]}});
  throw Object.assign(Error('simulated locked workspace'),{code:'agent_cleanup_failed'});
 });
 service.create('a',{...request,engine:'codebuddy',outputMode:'native',context:{asof:'2026-11-13',section:'market-commentary-v1'}});
 await waitFor(()=>!service.active.size);
 assert.equal(service.get('a',id).status,'needs_attention');assert.ok(store.get('a',id).receipt);
 assert.equal(service.get('a',id).result,null,'cleanup failure is not silently reported as full success');
 const restored=await service.resume('a',id);assert.equal(restored.status,'complete');assert.equal(restored.result.answer,'## 已完成原生研究\n清理故障不应丢弃已返回正文。');assert.equal(calls,1);assert.match(restored.result.runtimeWarnings[0],/临时工作区清理/);
 assert.deepEqual(store.messages('a',restored.result.conversationId).messages[1].report.runtimeWarnings,restored.result.runtimeWarnings);
});
