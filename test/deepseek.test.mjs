import {test} from 'node:test';import assert from 'node:assert/strict';
import {JobStore} from '../src/jobs.mjs';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const vault=await import('../src/provider-vault.mjs').catch(()=>({})),ds=await import('../src/deepseek.mjs').catch(()=>({}));
test('DeepSeek credentials are account scoped, encrypted at rest and changed keys revoke old revisions',async t=>{
 assert.equal(typeof vault.ProviderVault,'function');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gl-vault-test-')),store=new JobStore(path.join(dir,'db.sqlite'));
 t.after(()=>{store.close();assert.equal(path.dirname(dir),os.tmpdir());assert.ok(path.basename(dir).startsWith('gl-vault-test-'));fs.rmSync(dir,{recursive:true,force:true});});
 // Exercise the Windows encryption boundary with a placeholder, never a provider key.
 const v=new vault.ProviderVault(store);await v.save('a','sk-placeholder-never-sent');
 const publicConfig=v.status('a');assert.equal(publicConfig.configured,true);assert.equal(v.status('b').configured,false);
 assert.equal(JSON.stringify(store.setting('a','deepseek')).includes('sk-placeholder'),false);
 assert.equal(JSON.stringify(publicConfig).includes('sk-placeholder'),false);
 assert.equal(await v.secret('a',publicConfig.authRevision),'sk-placeholder-never-sent');
 await v.save('a','sk-different-placeholder');await assert.rejects(v.secret('a',publicConfig.authRevision),{code:'provider_config_changed'});
 await v.remove('a');assert.equal(v.status('a').configured,false);
});
test('DeepSeek uses one official request, native web tools and exact answer while retaining citations and actual usage',async()=>{
 assert.equal(typeof ds.runDeepSeek,'function');const calls=[];
 const native='## 原生研究\n\n未改写的回答。';let saved;
 const result=await ds.runDeepSeek({key:'sk-placeholder',input:{question:'查公开资料',evidence:[]},deepThinking:true,probe:false,onReceipt:r=>saved=r,fetcher:async(url,init)=>{
  calls.push({url,init});const body=JSON.parse(init.body);assert.equal(body.model,'deepseek-flash');assert.deepEqual(body.tools,[{type:'deepseek_web_search'},{type:'deepseek_read_url'}]);assert.equal(body.response_format,undefined);assert.equal(init.redirect,'error');
  return Response.json({choices:[{finish_reason:'stop',message:{role:'assistant',content:native,reasoning_content:'private reasoning',annotations:[{type:'url_citation',url_citation:{url:'https://example.com/source',title:'证据',start_index:0,end_index:2}}],server_tool_calls:[{calls:[{type:'deepseek_web_search',status:'completed'}]}]}}],usage:{prompt_tokens:10,completion_tokens:20,total_tokens:30,server_tool_use:{tool_search:1}}});
 }});
 assert.equal(calls.length,1);assert.equal(calls[0].url,'https://api.deepseek.com/chat/completions');assert.equal(result.nativeText,native);assert.equal(saved.nativeText,native);assert.equal(result.telemetry.tokens.total,30);assert.equal(result.citations[0].url,'https://example.com/source');assert.equal(JSON.stringify(result).includes('private reasoning'),false);
});
test('DeepSeek probe has no web tools and failures preserve error usage without retry or accepting partial output',async()=>{
 assert.equal(typeof ds.runDeepSeek,'function');let calls=0,receipt;
 await assert.rejects(ds.runDeepSeek({key:'sk-placeholder',input:{},probe:true,onReceipt:r=>receipt=r,fetcher:async(_,init)=>{calls++;const b=JSON.parse(init.body);assert.equal(b.tools,undefined);assert.equal(b.thinking.type,'disabled');return Response.json({error:{message:'sk-do-not-leak'},usage:{total_tokens:12}});}}),{code:'deepseek_failed'});
 assert.equal(calls,1);assert.equal(receipt.providerStatus,'failed');assert.equal(receipt.telemetry.tokens.total,12);assert.equal(JSON.stringify(receipt).includes('sk-do-not-leak'),false);
 await assert.rejects(ds.runDeepSeek({key:'sk-placeholder',input:{},probe:false,fetcher:async()=>Response.json({choices:[{finish_reason:'length',message:{content:'partial'}}]})}),{code:'deepseek_incomplete'});
});
for(const [status,code]of[[401,'deepseek_auth_failed'],[402,'deepseek_balance_insufficient'],[429,'deepseek_rate_limited'],[503,'deepseek_unavailable']])test(`DeepSeek HTTP ${status} is classified without leaking provider errors or retrying`,async()=>{
 let calls=0;await assert.rejects(ds.runDeepSeek({key:'sk-placeholder',input:{},probe:true,fetcher:async()=>{calls++;return Response.json({error:{message:'private secret'}},{status});}}),e=>e.code===code&&!e.message.includes('private secret'));assert.equal(calls,1);
});
test('DeepSeek timeout during body download stays uncertain and never resends the API request',async()=>{
 let calls=0;
 const result=assert.rejects(ds.runDeepSeek({key:'sk-placeholder',input:{},probe:true,timeoutMs:10,fetcher:async(_,init)=>{calls++;return new Response(new ReadableStream({start(controller){const timer=setTimeout(()=>controller.error(new DOMException('transport interrupted','AbortError')),25);init.signal.addEventListener('abort',()=>{clearTimeout(timer);controller.error(new DOMException('aborted','AbortError'));},{once:true});}}));}}),{code:'agent_timeout'});
 await Promise.all([result,new Promise(r=>setTimeout(r,30))]);assert.equal(calls,1);
});
