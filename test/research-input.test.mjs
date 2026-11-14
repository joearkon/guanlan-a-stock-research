import {test}from'node:test';import assert from'node:assert/strict';import {researchInput}from'../src/research-input.mjs';
test('only bounded public market fields enter native research, not account context or private evidence',()=>{
 const input=researchInput({question:'研究这家公司',context:{page:'个股档案',asof:'2026-11-13',stock:{code:'300006',name:'测试公司',cost:8,shares:500},positions:[{cost:8}],password:'secret',funds:{mode:'report',kind:'industry',period:'d5',boards:['机械']},focus:'核验业务'},evidence:[{id:'shared:market',scope:'public_market',dataDate:'2026-11-13',data:{asof:'2026-11-13',indices:[{code:'000001',close:1,cost:8}],market:{up:1,down:2},password:'secret'}},{id:'personal:holdings',source:'个人持仓',data:{cost:8,shares:500}},{id:'shared:stock:300006',scope:'public_market',dataDate:'2026-11-13',data:{quotes:{300006:{code:'300006',price:1,prev:2,cost:8,positions:['private']}}}}]});
 const json=JSON.stringify(input);for(const secret of ['password','secret','positions','cost','shares','personal:holdings'])assert.equal(json.includes(secret),false,secret);
 assert.equal(input.context.stock.code,'300006');assert.equal(input.evidence.length,2);assert.equal(input.evidence[1].data.quotes['300006'].price,1);
 assert.equal(input.question,'研究这家公司');
});

test('explicit writing preferences and the full user research focus reach the native assistant',()=>{
 const input=researchInput({question:'看业务',agentRole:'legacy',responseDetail:'detailed',deepThinking:true,context:{focus:'甲'.repeat(1000)}});
 assert.deepEqual(input.preferences,{style:'通俗解读',detail:'detailed'});assert.equal(input.context.focus.length,1000);assert.equal(input.deepThinking,true);
});
