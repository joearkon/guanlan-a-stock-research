import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEngine} from '../src/core.mjs';
import {connectionState} from '../src/connection-state.mjs';
import * as runtime from '../vendor/vibe-research/local_agent_runtime.ts';
const {claudeArgs}=runtime;

test('explicit Claude and DeepSeek selections are accepted without accepting arbitrary engines',()=>{
 assert.equal(normalizeEngine('claude'),'claude');assert.equal(normalizeEngine('deepseek'),'deepseek');
 assert.throws(()=>normalizeEngine('auto'),{code:'engine_required'});
});
test('Claude native research opens only web and explicit evidence tools, not shell or file tools',()=>{
 const args=claudeArgs('原生回答',undefined,undefined,true);
 assert.equal(args[args.indexOf('--tools')+1],'WebSearch,WebFetch');
 assert.equal(args[args.indexOf('--max-turns')+1],'32');
 assert.equal(args.includes('--json-schema'),false);assert.equal(args.includes('bypassPermissions'),false);
 const probe=claudeArgs('只测连接');assert.equal(probe[probe.indexOf('--tools')+1],'');
});
test('Claude auth metadata distinguishes subscription and API billing without exposing identity or keys',()=>{
 assert.equal(typeof runtime.parseClaudeAuth,'function');const {parseClaudeAuth}=runtime;
 const subscription=parseClaudeAuth(JSON.stringify({loggedIn:true,authMethod:'claude.ai',apiProvider:'firstParty',email:'private@example.invalid'}));
 assert.equal(subscription.billingSource,'Claude 本人订阅 / 账号额度');assert.ok(subscription.authRevision);
 const api=parseClaudeAuth(JSON.stringify({loggedIn:true,authMethod:'api_key',apiProvider:'firstParty'}));
 assert.equal(api.billingSource,'Anthropic 本人 Console / API 计费');
 const gateway=parseClaudeAuth(JSON.stringify({loggedIn:true,authMethod:'api_key',apiProvider:'firstParty'}),{ANTHROPIC_BASE_URL:'https://private-gateway.example/v1'});assert.match(gateway.billingSource,/private-gateway.example/);assert.notEqual(gateway.authRevision,api.authRevision);
 assert.notEqual(api.authRevision,subscription.authRevision);assert.equal(JSON.stringify(subscription).includes('private@'),false);
 assert.equal(parseClaudeAuth('{"loggedIn":false}').authenticated,false);
 assert.throws(()=>parseClaudeAuth('{"loggedIn":true}'));
});
test('DeepSeek key revision changes revoke a verified lamp while preserving the saved engine',()=>{
 const profile={authRevision:'key-revision-1',billingSource:'DeepSeek 本人 API 余额（含联网工具费用）'};
 const selection={engine:'deepseek',engineVersion:'deepseek-flash',probeId:'p',providerConfig:profile};
 const capability={id:'deepseek',version:'deepseek-flash',installed:true,authenticated:true,available:true,status:'ready',...profile};
 const probe={id:'p',engine:'deepseek',status:'complete',attempts:1,receipt:{nativeText:'响应'},result:{answer:'响应'},updated_at:1,request:{context:{connectionProbe:true,engineVersion:'deepseek-flash'},providerConfig:profile}};
 assert.equal(connectionState({selection,capability,probe}).kind,'verified');
 const changed=connectionState({selection,capability:{...capability,authRevision:'key-revision-2'},probe});
 assert.equal(changed.kind,'retest');assert.equal(changed.engine,'deepseek');
 assert.equal(connectionState({selection,capability:{...capability,authenticated:false,available:false,status:'not_authenticated'},probe}).kind,'missing_key');
});
