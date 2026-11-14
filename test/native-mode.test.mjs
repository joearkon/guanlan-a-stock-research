import {test}from'node:test';import assert from'node:assert/strict';import {codexArgs,codeBuddyArgs,CodexEventStream,parseCodeBuddyOutput}from'../vendor/vibe-research/local_agent_runtime.ts';import {JobStore,ResearchService}from'../src/jobs.mjs';import fs from'node:fs';import path from'node:path';import os from'node:os';
test('native research allows provider web research without output schemas or permission bypass',()=>{
 const codex=codexArgs('自由回答','C:/isolated',{nativeResearch:true});assert.ok(codex.includes('web_search="live"'));assert.equal(codex.includes('--output-schema'),false);assert.ok(codex.includes('read-only'));
 assert.ok(codex.includes('code_mode_host'));assert.equal(codex.some(x=>x.startsWith('features.code_mode={enabled=false,')&&x.includes('"web"')),true);assert.ok(codex.includes('shell_tool'));
 const buddy=codeBuddyArgs('自由回答',undefined,false,undefined,true);assert.ok(buddy.includes('WebSearch,WebFetch'));assert.equal(buddy[buddy.indexOf('--max-turns')+1],'32');assert.equal(buddy.includes('--json-schema'),false);assert.equal(buddy.includes('bypassPermissions'),false);
 const stream=new CodexEventStream(undefined,true);assert.equal(stream.push(JSON.stringify({type:'item.completed',item:{type:'web_search',id:'web:1'}})),null);
 assert.match(stream.push(JSON.stringify({type:'item.started',item:{type:'file_change'}})),/未开放/);
 const bounded=new CodexEventStream(undefined,true);for(let i=0;i<256;i++)assert.equal(bounded.push(JSON.stringify({type:'item.started',item:{type:'web_search',id:'web-'+i}})),null);assert.match(bounded.push(JSON.stringify({type:'item.started',item:{type:'web_search',id:'web-overflow'}})),/超过/);
});

test('failed API receipts cannot be published by resume, while complete answers keep billing, usage and citations',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gl-native-test-')),store=new JobStore(path.join(dir,'db.sqlite'));t.after(()=>{store.close();assert.equal(path.dirname(dir),os.tmpdir());assert.ok(path.basename(dir).startsWith('gl-native-test-'));fs.rmSync(dir,{recursive:true,force:true});});
 const service=new ResearchService(store,async()=>{}),request={turnId:'01c973a2-143a-4e39-b1f0-2ab938c55c59',engine:'deepseek',question:'原生',providerConfig:{billingSource:'DeepSeek 本人 API 余额',authRevision:'revision'},evidence:[]};
 const job=store.insert('a',request);store.receipt('a',job.id,{nativeText:'尚未完成的部分回答',providerStatus:'failed',telemetry:{tokens:{total:12}}});
 await assert.rejects(service.resume('a',job.id),{code:'report_invalid'});
 const result=service.result(job,{nativeText:'**原文**',providerStatus:'complete',telemetry:{tokens:{total:30,input:10,output:20},providerRequests:1},citations:[{url:'https://example.com',title:'证据'}]});
 assert.equal(result.billingSource,'DeepSeek 本人 API 余额');assert.equal(result.diagnostics.tokens.total,30);assert.equal(result.citations[0].title,'证据');assert.equal(result.answer,'**原文**');
});

test('local API authentication failure gives an actionable message and repeated reads do not rerun',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gl-native-test-')),store=new JobStore(path.join(dir,'db.sqlite'));t.after(()=>{store.close();assert.equal(path.dirname(dir),os.tmpdir());assert.ok(path.basename(dir).startsWith('gl-native-test-'));fs.rmSync(dir,{recursive:true,force:true});});
 let calls=0;const service=new ResearchService(store,async()=>{calls++;throw Object.assign(Error('secret provider message'),{code:'deepseek_auth_failed'});}),request={turnId:'01c973a2-143a-4e39-b1f0-2ab938c55c58',engine:'deepseek',question:'连接测试',evidence:[]};
 service.create('a',request);while(service.active.size)await new Promise(r=>setTimeout(r,10));
 for(let n=0;n<3;n++){const job=service.get('a',request.turnId);assert.match(job.error,/密钥.*本机 AI 配置/);assert.equal(job.error.includes('secret provider'),false);service.create('a',request);}assert.equal(calls,1);
});

test('native provider events preserve text while recording actual web-tool execution',()=>{
 const args=codeBuddyArgs('原生研究',undefined,false,undefined,true);assert.equal(args[args.indexOf('--output-format')+1],'stream-json');assert.ok(args.includes('--verbose'));
 const lines=[{type:'assistant',message:{content:[{type:'tool_use',name:'WebFetch',id:'tool-1'}]}},{type:'result',result:'自然语言回答',is_error:false}].map(JSON.stringify).join('\n');
 assert.equal(parseCodeBuddyOutput(lines),'自然语言回答');
 const events=[],stream=new CodexEventStream(undefined,true,name=>events.push(name));
 stream.push(JSON.stringify({type:'item.completed',item:{type:'web_search',id:'web-1'}}));assert.deepEqual(events,['web_search']);
});
test('default local result preserves the native answer instead of requiring a platform report',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gl-native-test-')),store=new JobStore(path.join(dir,'research.sqlite'));t.after(()=>{store.close();assert.equal(path.dirname(dir),os.tmpdir());assert.ok(path.basename(dir).startsWith('gl-native-test-'));fs.rmSync(dir,{recursive:true,force:true});});
 const answer='我会先核对行业，再看公司。\n\n这是一段原生 Markdown，不是 JSON。\n\n资料仍需核验。';let calls=0;
 const service=new ResearchService(store,async()=>{calls++;return answer;}),request={turnId:'01c973a2-143a-4e39-b1f0-2ab938c55c50',engine:'codebuddy',question:'自由研究',context:{},evidence:[]};
 service.create('a',request);for(let i=0;i<100&&service.active.size;i++)await new Promise(r=>setTimeout(r,10));
 const job=service.get('a',request.turnId);assert.equal(job.status,'complete');assert.equal(job.result.answer,answer);assert.equal(job.result.outputMode,'native');assert.equal(job.result.completeness,'not_assessed');
 service.create('a',request);assert.equal(calls,1);
});
