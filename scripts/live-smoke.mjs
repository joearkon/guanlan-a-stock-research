import fs from'node:fs';import path from'node:path';import {fileURLToPath}from'node:url';
import {JobStore,ResearchService}from'../src/jobs.mjs';import {nativeRunner}from'../src/native.mjs';import {normalizeEngine}from'../src/core.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2),engine=normalizeEngine(args[args.indexOf('--engine')+1]);
if(!args.includes('--confirm-live'))throw Error('真实测试会使用本人 CLI 额度。确认后加 --confirm-live；不会自动重试。');
const dir=path.join(root,'.local','acceptance'),store=new JobStore(path.join(dir,'research.sqlite')),service=new ResearchService(store,nativeRunner(dir));
const ids={codex:'20261114-0000-4000-8000-000000000011',codebuddy:'20261114-0000-4000-8000-000000000012'};
if(args.includes('--case=codex-direct-web-fix')&&engine==='codex')ids.codex='20261114-0000-4000-8000-000000000021';
const baseline=JSON.parse(fs.readFileSync(path.join(root,'baseline/production.json'),'utf8'));
try{
 const request={turnId:ids[engine],engine,question:'这是一次原生联网验收。请用自己的联网检索工具核实 https://developers.openai.com/codex/cli 这一官方文档的页面标题、Codex CLI 的用途，给出来源链接。自由使用自然语言，不要输出 JSON，不查金融行情，不执行本机命令。',context:{page:'原生联网验收',asof:baseline.checkedAt.slice(0,10)},evidence:[]};
 let job=service.get('local:acceptance',request.turnId)||service.create('local:acceptance',request);const deadline=Date.now()+240000;
 while(['queued','running'].includes(job.status)&&Date.now()<deadline){await new Promise(r=>setTimeout(r,500));job=service.get('local:acceptance',request.turnId);}
 console.log(JSON.stringify({engine,id:job.id,status:job.status,engineRuns:job.attempts,outputMode:job.result?.outputMode,toolEvents:job.result?.diagnostics.toolEvents,answerPreview:job.result?.answer?.slice(0,250),error:job.error,usage:job.result?.diagnostics.tokens,platformFallback:false},null,2));
 if(job.status!=='complete')process.exitCode=1;
}finally{if(service.active.size)for(const controller of service.active.values())controller.abort();while(service.active.size)await new Promise(r=>setTimeout(r,100));store.close();}
