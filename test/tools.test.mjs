import {test}from'node:test';import assert from'node:assert/strict';import {handleTool}from'../src/tools.mjs';
const bundle={evidence:[{id:'a',source:'真实来源标识',dataDate:'2026-11-13',data:{price:1}}]};
test('controlled tools reveal only the supplied evidence bundle, never arbitrary local files',()=>{
 const list=handleTool('list_evidence',{},bundle);assert.equal(list.length,1);assert.equal(list[0].id,'a');
 assert.equal(handleTool('read_evidence',{ids:['a']},bundle)[0].data.price,1);
 for(const name of ['read_file','shell','write_file','fetch','get_env'])assert.throws(()=>handleTool(name,{path:'../anything'},bundle),{code:'tool_denied'});
 assert.throws(()=>handleTool('read_evidence',{ids:['missing']},bundle),{code:'evidence_missing'});
});
