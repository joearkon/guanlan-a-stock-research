import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEngine,validateReport} from '../src/core.mjs';

test('only explicitly selected local engines are accepted; never choose a platform fallback',()=>{
 for(const engine of ['codex','codebuddy','claude','deepseek'])assert.equal(normalizeEngine(engine),engine);
 for(const value of [null,undefined,'','platform','api','CODEX',{},'codex & whoami'])assert.throws(()=>normalizeEngine(value),{code:'engine_required'});
});
test('reports must cite existing evidence IDs and cannot invent a source',()=>{
 const evidence=[{id:'quote:001',source:'验收来源',dataDate:'2026-11-13',status:'ok',data:{price:10}}];
 assert.deepEqual(validateReport({answer:'根据已提供证据整理，仍需核验。',evidenceIds:['quote:001'],missing:[]},evidence),{answer:'根据已提供证据整理，仍需核验。',evidenceIds:['quote:001'],missing:[]});
 assert.throws(()=>validateReport({answer:'有依据',evidenceIds:['invented'],missing:[]},evidence),{code:'report_invalid'});
});
test('no evidence must remain explicitly incomplete, never a complete empty report',()=>{
 assert.throws(()=>validateReport({answer:'资料充分',evidenceIds:[],missing:[]},[]),{code:'report_invalid'});
 assert.equal(validateReport({answer:'缺少行情，仅能提供研究框架。',evidenceIds:[],missing:['行情未提供']},[]).missing[0],'行情未提供');
 for(const report of [null,{}, {answer:'',evidenceIds:[],missing:['缺数据']}])assert.throws(()=>validateReport(report,[]),{code:'report_invalid'});
});
