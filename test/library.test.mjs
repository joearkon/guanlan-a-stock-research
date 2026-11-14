import {test}from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import os from'node:os';import path from'node:path';import {JobStore,ResearchService}from'../src/jobs.mjs';import {LocalLibrary}from'../src/library.mjs';
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gl-library-test-')),store=new JobStore(path.join(dir,'local.sqlite'));let calls=0;const service=new ResearchService(store,async()=>{calls++;return {answer:'仅有连通资料，行情待核验。',evidenceIds:[],missing:['没有行情']};}),library=new LocalLibrary(store,service);t.after(()=>{store.close();assert.equal(path.dirname(dir),os.tmpdir());assert.ok(path.basename(dir).startsWith('gl-library-test-'));fs.rmSync(dir,{recursive:true,force:true});});return {store,service,library,get calls(){return calls;}};}
const input={requestId:'e1e31eb1-51d6-49c5-9f37-6deabc70cc60',subject:{kind:'topic',name:'本地验收'},asof:'2026-11-13',focus:'只核对有来源的数据',deepThinking:false};
test('notes are local, idempotent, versioned and account isolated without model calls',t=>{
 const f=fixture(t),r=f.library.create('a',{...input,note:'第一版笔记'});assert.equal(r.template,'note');assert.equal(r.status,'complete');assert.equal(f.calls,0);
 assert.equal(f.library.create('a',{...input,note:'第一版笔记'}).id,r.id);
 assert.throws(()=>f.library.create('a',{...input,note:'替换旧文'}),{code:'request_conflict'});
 f.library.create('a',{...input,requestId:'e1e31eb1-51d6-49c5-9f37-6deabc70cc61',note:'第二版笔记'});
 assert.equal(f.library.list('a',{}).archives[0].versions,2);assert.equal(f.library.history('a',r.key).runs.length,2);
 assert.equal(f.library.list('b',{}).archives.length,0);assert.equal(f.library.get('b',r.id),null);
});
test('library AI runs once and history restores the local structured result',async t=>{
 const f=fixture(t);f.library.create('a',input,{engine:'codex',evidence:[]});f.library.create('a',input,{engine:'codex',evidence:[]});
 for(let i=0;i<100&&f.service.active.size;i++)await new Promise(r=>setTimeout(r,10));
 const r=f.library.get('a',input.requestId);assert.equal(r.status,'complete');assert.equal(r.report.localHarness,true);assert.deepEqual(r.report.missing,['没有行情']);assert.equal(f.calls,1);
 assert.equal(f.library.list('a',{search:'不存在'}).archives.length,0);
 assert.throws(()=>f.library.create('a',{...input,requestId:'e1e31eb1-51d6-49c5-9f37-6deabc70cc62',asof:'2099-01-01'},{engine:'codex'}),{code:'invalid_request'});
});
test('manual record changes use optimistic versions and retain the previous text',t=>{
 const f=fixture(t),r=f.library.saveRecord('a',{stockCode:'000001',title:'手工观察',content:'原文',dataDate:'2026-11-13',evidenceRefs:[]});
 const next=f.library.saveRecord('a',{...r,content:'修订文'},true);assert.equal(next.content,'修订文');
 assert.throws(()=>f.library.saveRecord('a',{...r,content:'过时覆盖'},true),{code:'version_conflict'});
 const old=f.library.records('a',{id:r.id});assert.equal(old.record.content,'修订文');assert.equal(old.revisions[0].content,'原文');assert.equal(f.library.records('b',{}).records.length,0);assert.equal(f.calls,0);
});
