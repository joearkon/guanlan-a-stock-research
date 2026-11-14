import {test}from'node:test';import assert from'node:assert/strict';import {connectionState}from'../src/connection-state.mjs';
const selection={engine:'codex',probeId:'probe-1',engineVersion:'0.169.0'},capability={id:'codex',installed:true,authenticated:true,available:true,status:'ready',version:'0.169.0'},probe={id:'probe-1',engine:'codex',status:'complete',attempts:1,receipt:'真实连接回执',result:{answer:'连接响应'},updated_at:100,request:{context:{connectionProbe:true,engineVersion:'0.169.0'}}};
test('installed or selected without a completed probe never becomes verified',()=>{
 assert.equal(connectionState({capability}).kind,'unconfigured');
 assert.equal(connectionState({selection,capability}).kind,'untested');
 assert.equal(connectionState({selection,capability,probe:{...probe,status:'running'}}).kind,'untested');
 assert.equal(connectionState({selection,capability,probe:{...probe,request:{context:{}}}}).kind,'untested');
});
test('only a matching actual probe and current authenticated CLI can be verified',()=>{
 const state=connectionState({selection,capability,probe});assert.equal(state.kind,'verified');assert.equal(state.engine,'codex');assert.equal(state.verifiedAt,100);
 assert.equal(state.label,'已连接');
 assert.equal(connectionState({selection,capability,probe:{...probe,engine:'codebuddy'}}).kind,'untested');
 assert.equal(connectionState({selection,capability:{...capability,authenticated:false,available:false,status:'not_authenticated'},probe}).kind,'signed_out');
 assert.equal(connectionState({selection,capability:{...capability,installed:false,available:false,status:'not_installed'},probe}).kind,'not_installed');
});
test('failed connections have a short failure label while unknown execution remains pending verification',()=>{
 assert.equal(connectionState({selection,capability,probe,lastJob:{engine:'codex',status:'failed',updated_at:200}}).label,'未通过');
 assert.equal(connectionState({selection,capability,probe,lastJob:{engine:'codex',status:'needs_attention',updated_at:200}}).label,'待核对');
});
test('version changes and failed detection revoke the green display without rerunning the model',()=>{
 assert.equal(connectionState({selection,capability:{...capability,version:'0.170.0'},probe}).kind,'retest');
 assert.equal(connectionState({selection,capability:{...capability,available:false,status:'probe_failed'},probe}).kind,'unknown');
 assert.equal(connectionState({selection,capability:{...capability,authenticated:undefined},probe}).kind,'unknown');
 assert.equal(connectionState({selection:{engine:'codex',probeId:'probe-1'},capability,probe}).kind,'retest');
 assert.equal(connectionState({selection,capability,probe,lastJob:{id:'research-1',engine:'codex',status:'failed',updated_at:200}}).kind,'attention');
});
