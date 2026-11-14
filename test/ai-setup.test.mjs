import {test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import os from'node:os';import path from'node:path';import {createApp}from'../src/server.mjs';
async function fixture(t,{beforeDetect=async()=>{}}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gl-ai-setup-')),detections=[],runs=[];
 const app=createApp({dataDir:dir,remoteFetch:async url=>url.endsWith('/api/auth/password/login')?Response.json({ok:true},{headers:{'set-cookie':'gl_session=fixture-only; Path=/'}}):Response.json({user:{id:7}}),detect:async(_dir,engine)=>{detections.push(engine);await beforeDetect(engine);return [{id:engine,name:engine,installed:engine!=='claude',authenticated:engine!=='claude',available:engine!=='claude',status:engine==='claude'?'not_installed':'ready',version:engine==='claude'?null:'fixture-1',detail:engine==='claude'?'本机未检测到 Claude Code':'环境就绪'}];},run:async engine=>{runs.push(engine);return{nativeText:'隔离测试响应'};}});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port;
 const post=(p,b,cookie='')=>fetch(base+p,{method:'POST',headers:{origin:base,'x-gl':'1','content-type':'application/json',cookie},body:JSON.stringify(b)});
 const login=await post('/api/auth/password/login',{email:'qa@example.invalid',password:'fixture'}),cookie=login.headers.get('set-cookie').split(';')[0];
 t.after(async()=>{await app.close();assert.equal(path.dirname(dir),os.tmpdir());assert.ok(path.basename(dir).startsWith('gl-ai-setup-'));fs.rmSync(dir,{recursive:true,force:true});});
 return{...app,detections,runs,post:(p,b={})=>post(p,b,cookie),get:async p=>await(await fetch(base+p,{headers:{cookie}})).json()};
}
async function connect(f,id){assert.equal((await f.post('/api/local-ai/probes',{engine:'codex',turnId:id})).status,202);for(let n=0;n<60&&f.service.get('cloud:7',id)?.status!=='complete';n++)await new Promise(r=>setTimeout(r,10));assert.equal((await f.post('/api/local-ai/settings',{engine:'codex',probeId:id})).status,200);}
test('fresh setup offers all engines without detecting any; choosing one only detects that provider',async t=>{
 const f=await fixture(t),catalog=await f.get('/api/local-ai/engines');assert.deepEqual(catalog.engines.map(e=>e.id),['codex','codebuddy','claude','deepseek']);assert.ok(catalog.engines.every(e=>e.status==='unchecked'));
 assert.equal((await f.get('/api/local-ai/status')).kind,'unconfigured');assert.deepEqual(f.detections,[]);assert.deepEqual(f.runs,[]);
 const failed=await f.get('/api/local-ai/engines?engine=claude&refresh=1');assert.equal(failed.engines.length,1);assert.equal(failed.engines[0].status,'not_installed');assert.deepEqual(f.detections,['claude']);assert.deepEqual(f.runs,[]);
 const ready=await f.get('/api/local-ai/engines?engine=codex&refresh=1');assert.equal(ready.engines[0].available,true);assert.deepEqual(f.detections,['claude','codex']);assert.deepEqual(f.runs,[]);
 await connect(f,'a1000000-0000-4000-8000-000000000001');assert.deepEqual(f.runs,['codex']);assert.equal((await f.get('/api/local-ai/status')).kind,'verified');
});
test('reset disconnects only owned AI config, preserves research and invalidates pre-reset probe activation',async t=>{
 const f=await fixture(t),id='a1000000-0000-4000-8000-000000000002';await connect(f,id);
 f.store.setSetting('cloud:7','profile',{pool:['unchanged'],positions:[{code:'000001',qty:1}]});f.store.setSetting('cloud:7','schemes',[{id:'keep'}]);f.store.setSetting('cloud:7','deepseek',{sealed:'fixture-not-a-key',revision:'old'});f.store.setSetting('cloud:9','engine',{engine:'codebuddy'});
 const profile=f.store.setting('cloud:7','profile'),schemes=f.store.setting('cloud:7','schemes'),job=f.store.get('cloud:7',id),messages=f.store.messages('cloud:7',id);
 const reset=await f.post('/api/local-ai/reset');assert.equal(reset.status,200);const settings=await f.get('/api/local-ai/settings');assert.equal(settings.selection,null);assert.ok(settings.setupRevision);
 assert.equal((await f.get('/api/local-ai/deepseek')).configured,false);assert.equal((await f.get('/api/local-ai/status')).kind,'unconfigured');
 assert.deepEqual(f.store.setting('cloud:7','profile'),profile);assert.deepEqual(f.store.setting('cloud:7','schemes'),schemes);assert.deepEqual(f.store.get('cloud:7',id),job);assert.deepEqual(f.store.messages('cloud:7',id),messages);assert.equal(f.store.setting('cloud:9','engine').value.engine,'codebuddy');
 assert.equal((await f.post('/api/local-ai/settings',{engine:'codex',probeId:id})).status,409);assert.equal((await f.post('/api/local-ai/probes',{engine:'codex',turnId:id})).status,409);assert.deepEqual(f.runs,['codex']);
 await connect(f,'a1000000-0000-4000-8000-000000000003');assert.deepEqual(f.runs,['codex','codex']);
});
test('reset refuses to hide an active owned job',async t=>{
 const f=await fixture(t);f.store.setSetting('cloud:7','engine',{engine:'codex'});f.store.insert('cloud:7',{turnId:'a1000000-0000-4000-8000-000000000004',engine:'codex',question:'原任务'});
 assert.equal((await f.post('/api/local-ai/reset')).status,409);assert.equal(f.store.setting('cloud:7','engine').value.engine,'codex');assert.deepEqual(f.runs,[]);
});
test('reset invalidates a connection submission still awaiting environment detection',async t=>{
 let started,release;const entered=new Promise(r=>started=r),held=new Promise(r=>release=r),f=await fixture(t,{beforeDetect:async()=>{started();await held;}});
 const pending=f.post('/api/local-ai/probes',{engine:'codex',turnId:'a1000000-0000-4000-8000-000000000005'});await entered;assert.equal((await f.post('/api/local-ai/reset')).status,200);release();assert.equal((await pending).status,409);assert.deepEqual(f.runs,[]);
});
