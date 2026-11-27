import {test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import os from'node:os';import path from'node:path';import {createApp}from'../src/server.mjs';
import {themeArtwork} from '../web/v2/theme-artwork.mjs';
async function setup(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gl-http-test-')),remote=[],runs=[];const app=createApp({dataDir:dir,remoteFetch:async(url,init={})=>{remote.push({path:new URL(url).pathname,method:init.method||'GET',body:init.body});if(url.endsWith('/api/auth/password/login'))return Response.json({ok:true},{headers:{'set-cookie':'gl_session=isolated-fake-session; HttpOnly; Secure; Path=/'}});if(url.endsWith('/api/me'))return Response.json({user:{id:7,name:'隔离验收账号',isAdmin:false}});return Response.json({asof:'2026-11-13',quote:{price:1}});},detect:async()=>[{id:'codex',available:true,installed:true,authenticated:true,status:'ready',name:'Codex',version:'0.169.0'},{id:'codebuddy',available:true,installed:true,authenticated:true,status:'ready',name:'WorkBuddy',version:'2.97.2'}],run:async(engine)=>{runs.push(engine);return {answer:'缺少行情，不能推断价格。',evidenceIds:[],missing:['行情未提供']};}});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port;t.after(async()=>{await app.close();const resolved=path.resolve(dir);assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));assert.ok(path.basename(resolved).startsWith('gl-http-test-'));fs.rmSync(resolved,{recursive:true,force:true});});return{...app,base,remote,runs};}
const post=(f,path,body={},cookie='',origin=f.base)=>fetch(f.base+path,{method:'POST',headers:{origin,'x-gl':'1','content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(body)});
async function login(f){const response=await post(f,'/api/auth/password/login',{email:'qa@example.invalid',password:'not-a-real-password'});assert.equal(response.status,200);return response.headers.get('set-cookie').split(';')[0];}
const waitFor=async fn=>{for(let i=0;i<60;i++){const value=await fn();if(value)return value;await new Promise(r=>setTimeout(r,10));}assert.fail('not settled');};

test('only selected public candidate identities can prepare shared verification; private fields and model proxying are rejected',async t=>{const f=await setup(t),p='/api/research/candidate-verification',input={day:'2026-11-26',model:'a'.repeat(64),codes:['688820'],kind:'second-wave',window:15};assert.equal((await post(f,p,input)).status,401);const cookie=await login(f),n=f.remote.length;assert.equal((await post(f,p,{...input,positions:[]},cookie)).status,400);assert.equal(f.remote.length,n);assert.equal((await post(f,p,input,cookie)).status,200);assert.equal(f.remote.at(-1).method,'POST');assert.deepEqual(JSON.parse(f.remote.at(-1).body),input);assert.equal((await fetch(f.base+p+'?id='+'b'.repeat(64),{headers:{cookie}})).status,200);assert.equal(f.remote.at(-1).method,'GET');assert.deepEqual(f.runs,[]);assert.equal((await fetch(f.base+p+'?id=bad',{headers:{cookie}})).status,400);});

test('only explicitly confirmed observation plans may sync; local profile and AI stay local',async t=>{
 const f=await setup(t),p='/api/research/observation-plans';assert.equal((await fetch(f.base+p)).status,401);const cookie=await login(f),before=f.remote.length;
 assert.equal((await fetch(f.base+p,{headers:{cookie}})).status,200);assert.equal(f.remote.at(-1).path,p);
 const put=consent=>fetch(f.base+p,{method:'PUT',headers:{origin:f.base,'x-gl':'1','content-type':'application/json',cookie},body:JSON.stringify({accountId:7,version:0,plans:[],syncConsent:consent})});
 const readCount=f.remote.length;assert.equal((await put(false)).status,400);assert.equal(f.remote.length,readCount);assert.equal((await put(true)).status,200);assert.equal(f.remote.at(-1).method,'PUT');
 assert.equal((await post(f,p,{},cookie)).status,405);assert.deepEqual(f.runs,[]);await fetch(f.base+'/api/profile',{headers:{cookie}});assert.equal(f.remote.filter(x=>x.path==='/api/profile').length,0);assert.equal(f.remote.length,before+2);
});

test('event board context requires login and forwards only an explicit shared GET, never a model request',async t=>{
 const f=await setup(t),p='/api/data/event-context?codes=000001,000002&day=2026-11-16';assert.equal((await fetch(f.base+p)).status,401);const cookie=await login(f),before=f.remote.length;
 assert.equal((await fetch(f.base+p,{headers:{cookie}})).status,200);assert.equal(f.remote.length,before+1);assert.equal(f.remote.at(-1).path,'/api/data/event-context');assert.equal(f.remote.at(-1).method,'GET');
 const after=f.remote.length;assert.equal((await post(f,p,{},cookie)).status,403);assert.equal(f.remote.length,after);assert.deepEqual(f.runs,[]);
});
test('fund snapshot reads require login and forward only shared GETs while rejecting source collection or model writes',async t=>{
 const f=await setup(t),p='/api/data/fund-pulse?kind=industry';assert.equal((await fetch(f.base+p)).status,401);const cookie=await login(f),before=f.remote.length;assert.equal((await fetch(f.base+p,{headers:{cookie}})).status,200);assert.equal(f.remote.length,before+1);assert.equal(f.remote.at(-1).path,'/api/data/fund-pulse');assert.equal(f.remote.at(-1).method,'GET');const n=f.remote.length;assert.equal((await post(f,p,{},cookie)).status,403);assert.equal(f.remote.length,n);assert.deepEqual(f.runs,[]);
});
test('local service rejects cross-site model requests and keeps cloud session credentials out of responses',async t=>{
 const f=await setup(t);assert.equal((await post(f,'/api/local-ai/probes',{engine:'codex'},'','https://evil.example')).status,403);
 assert.equal((await fetch(f.base+'/api/v2/free?view=home')).status,401);
 const cookie=await login(f);const r=await fetch(f.base+'/api/me',{headers:{cookie}}),text=await r.text();assert.equal(r.status,200);assert.equal(text.includes('isolated-fake-session'),false);assert.ok(cookie.startsWith('gl_local_session='));
 const before=f.remote.length;assert.equal((await post(f,'/api/admin/industry/run',{},cookie)).status,403);assert.equal(f.remote.length,before);
});
test('engine activation requires an actual successful local probe; job refresh never calls cloud AI',async t=>{
 const f=await setup(t),cookie=await login(f);
 assert.equal((await post(f,'/api/local-ai/settings',{engine:'codex',probeId:'unknown'},cookie)).status,409);
 const probe=await(await post(f,'/api/local-ai/probes',{engine:'codex',turnId:'b1d39c9e-c19c-41f2-a142-928777a4ef5f'},cookie)).json();
 await waitFor(async()=>{const r=await(await fetch(f.base+'/api/agent/jobs/'+probe.id,{headers:{cookie}})).json();return r.status==='complete';});
 assert.equal((await post(f,'/api/local-ai/settings',{engine:'codex',probeId:probe.id},cookie)).status,200);
 const body={turnId:'22095dfb-6c7b-461c-8fa5-bc3a3cb46ffd',question:'列出核验步骤',context:{page:'研究工作台'}};
 assert.equal((await post(f,'/api/agent/jobs',body,cookie)).status,202);await waitFor(async()=>{const r=await(await fetch(f.base+'/api/agent/jobs/'+body.turnId,{headers:{cookie}})).json();return r.status==='complete';});
 await post(f,'/api/agent/jobs',body,cookie);assert.deepEqual(f.runs,['codex','codex']);assert.equal(f.remote.some(x=>/agent|research|chat\/completions/.test(x.path)),false);
 assert.equal((await post(f,'/api/local-ai/settings',{engine:'codebuddy',probeId:probe.id},cookie)).status,409);
});

test('production data paths are read-only, while personal schemes and preferences stay local',async t=>{
 const f=await setup(t),cookie=await login(f),headers={cookie};
 for(const p of ['/api/data/free?view=home','/api/data/live?view=indices','/api/data/stock-observation?mode=close','/api/research/stock/associations?code=000001','/api/research/industry/updates?industry=robots'])assert.equal((await fetch(f.base+p,{headers})).status,200,p);
 const before=f.remote.length;
 assert.equal((await post(f,'/api/v2/unknown-model-endpoint',{},cookie)).status,403);
 assert.equal((await fetch(f.base+'/api/v2/unknown-model-endpoint',{headers})).status,403);
 assert.equal(f.remote.length,before);
 const old=await(await fetch(f.base+'/api/observation/schemes',{headers})).json();assert.deepEqual(old.schemes,[]);
 const put=(p,value)=>fetch(f.base+p,{method:'PUT',headers:{...headers,origin:f.base,'content-type':'application/json','x-gl':'1'},body:JSON.stringify(value)});
 assert.equal((await put('/api/observation/schemes',{version:old.version,schemes:[{id:'test',name:'本地方案',kind:'stock',conditions:{minChange:10}}]})).status,200);
 assert.equal((await put('/api/observation/schemes',{version:old.version,schemes:[]})).status,409);
 const latest=await(await fetch(f.base+'/api/observation/schemes',{headers})).json();assert.equal(latest.schemes.length,1);
 assert.equal((await put('/api/preferences',{shortcuts:['review','agent']})).status,200);
 assert.deepEqual((await(await fetch(f.base+'/api/preferences',{headers})).json()).preferences.shortcuts,['review','agent']);
 assert.equal(f.remote.length,before,'personal writes must not reach SaaS');
});

test('public image paths are served as files rather than the SPA HTML',async t=>{
 const f=await setup(t);
 const response=await fetch(f.base+'/v2/assets/imgGuanlanLogoMarkHdPng.png');
 assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/^image\/png/);
 assert.equal((await fetch(f.base+'/next/assets/does-not-exist.js')).status,404);
 const root=await fetch(f.base+'/next');assert.equal(root.status,200);assert.match(root.headers.get('content-type'),/^text\/html/);assert.match(await root.text(),/\/next\/assets\/index-/);
 assert.equal((await fetch(f.base+'/next-other')).status,404);
});
test('every referenced theme illustration is available locally as an image without cloud or model requests',async t=>{
 const f=await setup(t);
 for(const art of Object.values(themeArtwork)){const r=await fetch(f.base+art.src);assert.equal(r.status,200,art.src);assert.match(r.headers.get('content-type'),/^image\//,art.src);assert.ok((await r.arrayBuffer()).byteLength>100,art.src);}
 assert.equal(f.remote.length,0);assert.equal(f.runs.length,0);
});

test('personal library and manual records are persisted locally without cloud writes or model calls',async t=>{
 const f=await setup(t),cookie=await login(f),before=f.remote.length;
 const input={requestId:'e1e31eb1-51d6-49c5-9f37-6deabc70cc60',subject:{kind:'topic',name:'HTTP 笔记验收'},asof:'2026-11-13',note:'只保存本地文字'};
 const saved=await(await post(f,'/api/research/library',input,cookie)).json();assert.equal(saved.run.template,'note');
 assert.equal((await(await fetch(f.base+'/api/research/library?subject='+saved.run.key,{headers:{cookie}})).json()).runs.length,1);
 const record=await(await post(f,'/api/research/records',{stockCode:'000001',title:'手工记录',content:'不构成成交',dataDate:'2026-11-13'},cookie)).json();assert.equal(record.record.origin,'manual');
 assert.equal((await(await fetch(f.base+'/api/research/records?code=000001',{headers:{cookie}})).json()).records.length,1);
 assert.equal(f.remote.length,before);assert.equal(f.runs.length,0);
 const usage=await(await fetch(f.base+'/api/account/usage?days=1',{headers:{cookie}})).json();assert.equal(usage.localHarness,true);assert.equal(usage.engineRuns,0);assert.equal(usage.reportedTokens,null);assert.equal(usage.remainingQuota,null);
});

test('a second service cannot reset the first service running tasks',async t=>{
 const f=await setup(t),dbFile=f.store.db.location(),dataDir=path.dirname(dbFile);
 const task=f.store.insert('cloud:7',{turnId:'e1e31eb1-51d6-49c5-9f37-6deabc70cc69',engine:'codex',question:'原任务'});f.store.begin(task.id,'cloud:7');
 assert.throws(()=>createApp({dataDir}),{code:'service_running'});
 assert.equal(f.store.get('cloud:7',task.id).status,'running');
});

test('connection status GET never runs a model and cannot verify an untested or mismatched selection',async t=>{
 const f=await setup(t),cookie=await login(f),get=async()=>await(await fetch(f.base+'/api/local-ai/status',{headers:{cookie}})).json();
 assert.equal((await get()).kind,'unconfigured');assert.equal(f.runs.length,0);
 const id='581b0bf6-b4ca-45b1-ac63-95badad62006';await post(f,'/api/local-ai/probes',{engine:'codex',turnId:id},cookie);
 await waitFor(()=>f.service.get('cloud:7',id)?.status==='complete');
 await post(f,'/api/local-ai/settings',{engine:'codex',probeId:id},cookie);
 const saved=await get();assert.equal(saved.kind,'verified');assert.equal(saved.engine,'codex');assert.ok(saved.verifiedAt);
 for(let n=0;n<3;n++)assert.equal((await get()).kind,'verified');assert.equal(f.runs.length,1);
 f.store.setSetting('cloud:7','engine',{engine:'codebuddy',probeId:id,engineVersion:'2.97.2'});
 assert.equal((await get()).kind,'untested');assert.equal(f.runs.length,1);
});

test('DeepSeek credentials never leave configuration responses and rotation revokes verification without fallback',async t=>{
 const f=await setup(t),cookie=await login(f),headers={cookie},get=async p=>await(await fetch(f.base+p,{headers})).json();
 assert.equal((await post(f,'/api/local-ai/probes',{engine:'deepseek',turnId:'c13c1c01-0000-4000-8000-000000000001'},cookie)).status,409);
 const saved=await post(f,'/api/local-ai/deepseek',{apiKey:'sk-http-placeholder-never-sent'},cookie);assert.equal(saved.status,200);
 const config=await get('/api/local-ai/deepseek');assert.equal(config.configured,true);assert.equal(JSON.stringify(config).includes('placeholder'),false);
 assert.equal((await get('/api/local-ai/engines?engine=deepseek')).engines.find(e=>e.id==='deepseek').available,true);assert.equal(f.runs.length,0);
 const id='c13c1c01-0000-4000-8000-000000000002';assert.equal((await post(f,'/api/local-ai/probes',{engine:'deepseek',turnId:id},cookie)).status,202);
 await waitFor(()=>f.service.get('cloud:7',id)?.status==='complete');
 assert.equal((await post(f,'/api/local-ai/settings',{engine:'deepseek',probeId:id},cookie)).status,200);
 assert.equal((await get('/api/local-ai/status')).kind,'verified');
 const jobId='c13c1c01-0000-4000-8000-000000000003';await post(f,'/api/agent/jobs',{turnId:jobId,engine:'codex',question:'按已保存引擎执行'},cookie);
 await waitFor(()=>f.service.get('cloud:7',jobId)?.status==='complete');assert.deepEqual(f.runs,['deepseek','deepseek']);
 const original=f.store.get('cloud:7',jobId);assert.equal(original.request.providerConfig.authRevision,config.authRevision);assert.match(original.result.billingSource,/DeepSeek.*API/);
 f.store.receipt('cloud:7',jobId,{nativeText:'已保存回答',telemetry:{tokens:{total:15},providerRequests:1}});
 const usage=await get('/api/account/usage');assert.equal(usage.reportedTokens,15);assert.equal(usage.tasksWithReportedUsage,1);assert.match(usage.tasks.find(j=>j.id===jobId).billingSource,/DeepSeek.*API/);
 await post(f,'/api/local-ai/deepseek',{apiKey:'sk-rotated-placeholder'},cookie);
 assert.equal((await get('/api/local-ai/status')).kind,'retest');
 assert.equal((await post(f,'/api/local-ai/settings',{engine:'deepseek',probeId:id},cookie)).status,409);
 assert.equal((await post(f,'/api/agent/jobs',{turnId:'c13c1c01-0000-4000-8000-000000000004',question:'拒绝旧认证'},cookie)).status,409);
 assert.equal((await post(f,'/api/agent/jobs',{turnId:jobId,engine:'codex',question:'按已保存引擎执行'},cookie)).status,202);
 assert.deepEqual(f.runs,['deepseek','deepseek']);assert.equal(f.remote.some(x=>/chat|completions/.test(x.path)),false);
});
