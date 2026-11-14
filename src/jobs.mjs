import {DatabaseSync} from 'node:sqlite';import fs from 'node:fs';import path from 'node:path';import {createHash,randomUUID} from 'node:crypto';
import {fail,normalizeEngine,validateReport} from './core.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const parse=value=>value?JSON.parse(value):null;
const failureHints={deepseek_auth_failed:'DeepSeek 密钥无效或已失效，请在「本机 AI 配置」更新并主动测试。',deepseek_balance_insufficient:'DeepSeek 本人 API 余额不足，请在本人开放平台核对账单。',deepseek_rate_limited:'DeepSeek 当前限流，请稍后由你主动发起新测试。',deepseek_unavailable:'DeepSeek 服务暂不可用，请稍后核对供方状态。',deepseek_network_failed:'DeepSeek 网络连接未确认，可能已产生费用；请检查本机网络并核对原任务。',deepseek_incomplete:'DeepSeek 未完整结束回答，部分回执已保留，不能作为完整研究发布。',provider_config_changed:'密钥已更换或移除，请在「本机 AI 配置」重新测试。',agent_auth_changed:'CLI 认证或费用来源已变化，请在「本机 AI 配置」重新检测并测试。',vault_unavailable:'本机密钥加解密失败，请在「本机 AI 配置」核对 Windows 用户及密钥；没有明文回退。',agent_not_authenticated:'本人 CLI 登录未确认，请完成官方登录后在「本机 AI 配置」重新检测。'};
export class JobStore {
 constructor(filename){
  fs.mkdirSync(path.dirname(filename),{recursive:true});this.db=new DatabaseSync(filename);
  this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000;
   CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,account TEXT NOT NULL,engine TEXT NOT NULL,identity TEXT NOT NULL,status TEXT NOT NULL,request TEXT NOT NULL,receipt TEXT,result TEXT,error TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0);
   CREATE TABLE IF NOT EXISTS settings(account TEXT NOT NULL,name TEXT NOT NULL,value TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(account,name));
   CREATE TABLE IF NOT EXISTS conversations(id TEXT PRIMARY KEY,account TEXT NOT NULL,title TEXT NOT NULL,created_at INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,account TEXT NOT NULL,conversation TEXT NOT NULL,role TEXT NOT NULL,content TEXT NOT NULL,report TEXT,created_at INTEGER NOT NULL);
   UPDATE jobs SET status='needs_attention',error='执行曾中断，供方结果待核对；不会自动重新调用。' WHERE status IN ('running','queued');`);
 }
 close(){this.db.close();}
 setting(account,name){const row=this.db.prepare('SELECT value,version FROM settings WHERE account=? AND name=?').get(account,name);return row?{value:parse(row.value),version:row.version}:null;}
 resetAI(account){
  this.db.exec('BEGIN IMMEDIATE');try{
   if(this.db.prepare("SELECT 1 FROM jobs WHERE account=? AND status IN ('queued','running') LIMIT 1").get(account))throw fail('ai_busy','当前账号还有进行中任务，请先停止或等待完成再重新初始化；没有隐藏原任务。');
   const setupRevision=randomUUID(),write=this.db.prepare('INSERT INTO settings(account,name,value,version) VALUES(?,?,?,1) ON CONFLICT(account,name) DO UPDATE SET value=excluded.value,version=settings.version+1');
   for(const [name,value]of[['engine',null],['deepseek',null],['ai-setup',setupRevision]])write.run(account,name,JSON.stringify(value));
   this.db.exec('COMMIT');return{selection:null,setupRevision,platformFallback:false};
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 setSetting(account,name,value,version){
  this.db.exec('BEGIN IMMEDIATE');try{const previous=this.setting(account,name);if(version!=null&&version!==(previous?.version??0))throw fail('version_conflict','资料版本已变化，请重新读取；旧数据没有覆盖。');
  this.db.prepare('INSERT INTO settings(account,name,value,version) VALUES(?,?,?,1) ON CONFLICT(account,name) DO UPDATE SET value=excluded.value,version=settings.version+1').run(account,name,JSON.stringify(value));const saved=this.setting(account,name);this.db.exec('COMMIT');return saved;}catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 profile(account){const row=this.setting(account,'profile');return {version:row?.version??0,profile:row?.value??{pool:[],positions:[],baskets:[],verify:[]}};}
 saveProfile(account,profile,version){this.setSetting(account,'profile',profile,version);return this.profile(account);}
 get(account,id){const row=this.db.prepare('SELECT * FROM jobs WHERE account=? AND id=?').get(account,id);return row?{...row,request:parse(row.request),receipt:parse(row.receipt),result:parse(row.result)}:null;}
 insert(account,request){
  if(typeof account!=='string'||!account||!/^[-0-9a-f]{36}$/i.test(request.turnId)||typeof request.question!=='string'||!request.question.trim()||request.question.length>500)throw fail('invalid_request','研究问题或任务编号无效。');
  const engine=normalizeEngine(request.engine),evidence=Array.isArray(request.evidence)?request.evidence:[];
  if(evidence.length>32||Buffer.byteLength(JSON.stringify(request),'utf8')>192000)throw fail('invalid_request','本轮证据超出有界输入范围，请缩小范围。');
  const normalized={question:request.question.trim(),context:request.context??{},conversationId:request.conversationId??null,deepThinking:request.deepThinking===true,agentRole:request.agentRole==='legacy'?'legacy':'professional',responseDetail:['concise','standard','detailed'].includes(request.responseDetail)?request.responseDetail:'standard',outputMode:request.outputMode==='structured'?'structured':'native',engine,evidence,...(request.providerConfig?{providerConfig:request.providerConfig}:{})};const identity=hash(normalized),previous=this.db.prepare('SELECT account,identity FROM jobs WHERE id=?').get(request.turnId);
  if(previous){if(previous.account!==account||previous.identity!==identity)throw fail('request_conflict','同一任务编号参数不一致，未创建重复模型调用。');return this.get(account,request.turnId);}
  const time=Date.now();this.db.prepare('INSERT INTO jobs(id,account,engine,identity,status,request,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(request.turnId,account,engine,identity,'queued',JSON.stringify(normalized),time,time);return this.get(account,request.turnId);
 }
 begin(id,account){return this.db.prepare("UPDATE jobs SET status='running',attempts=attempts+1,updated_at=? WHERE id=? AND account=? AND status='queued'").run(Date.now(),id,account).changes===1;}
 receipt(account,id,value){this.db.prepare('UPDATE jobs SET receipt=?,updated_at=? WHERE id=? AND account=?').run(JSON.stringify(value),Date.now(),id,account);}
 status(account,id,status,error=null,result=null){this.db.prepare('UPDATE jobs SET status=?,error=?,result=COALESCE(?,result),updated_at=? WHERE id=? AND account=?').run(status,error,result==null?null:JSON.stringify(result),Date.now(),id,account);}
 conversations(account){return {conversations:this.db.prepare('SELECT id,title,created_at AS createdAt FROM conversations WHERE account=? ORDER BY created_at DESC LIMIT 100').all(account)};}
 messages(account,conversation){return {messages:this.db.prepare('SELECT id,role,content,report FROM messages WHERE account=? AND conversation=? ORDER BY created_at,id').all(account,conversation).map(x=>({...x,report:parse(x.report)}))};}
 finish(account,job,result){
  const conversation=job.request.conversationId||job.id;
  const existing=this.db.prepare('SELECT account FROM conversations WHERE id=?').get(conversation);if(existing&&existing.account!==account)throw fail('request_conflict','研究会话不属于当前账号。');
  this.db.exec('BEGIN IMMEDIATE');try{
   this.db.prepare('INSERT OR IGNORE INTO conversations(id,account,title,created_at) VALUES(?,?,?,?)').run(conversation,account,job.request.question.slice(0,80),job.created_at);
   const message=this.db.prepare('INSERT OR IGNORE INTO messages(id,account,conversation,role,content,report,created_at) VALUES(?,?,?,?,?,?,?)');
   message.run(job.id+':q',account,conversation,'user',job.request.question,null,job.created_at);
   message.run(job.id+':a',account,conversation,'assistant',result.answer,JSON.stringify({localHarness:true,outputMode:result.outputMode,missing:result.missing,evidenceIds:result.evidenceIds,dataSources:result.dataSources,engine:result.engine,billingSource:result.billingSource,citations:result.citations,runtimeWarnings:result.runtimeWarnings}),Date.now());
   const completed={...result,conversationId:conversation};this.status(account,job.id,'complete',null,completed);this.db.exec('COMMIT');return completed;
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
}
export class ResearchService {
 constructor(store,run){this.store=store;this.run=run;this.active=new Map();}
 get(account,id){const job=this.store.get(account,id);if(!job)return null;return {id:job.id,turnId:job.id,status:job.status,question:job.request.question,engine:job.engine,result:job.result,error:job.error,stage:job.receipt?'校验已保存回执':job.status==='running'?'本机引擎执行':'本机任务',stageStatus:job.status,createdAt:job.created_at,attempts:job.attempts};}
 create(account,request){const job=this.store.insert(account,request);if(job.status==='queued'&&!this.active.has(job.id)){const controller=new AbortController();this.active.set(job.id,controller);queueMicrotask(()=>void this.execute(account,job.id,controller));}return this.get(account,job.id);}
 result(job,raw){
  if(raw?.providerStatus==='failed')throw fail('report_invalid','供方未完成的回执不能作为完整回答发布；不会重新调用。');
  const nativeText=typeof raw==='string'?raw:raw?.nativeText;
  if(job.request.outputMode!=='structured'&&typeof nativeText==='string'){
   if(!nativeText.trim()||nativeText.length>100000)throw fail('report_invalid','本机没有返回可显示的回答，原始回执保留。');
   return {localHarness:true,outputMode:'native',answer:nativeText,engine:job.engine,billingSource:job.request.providerConfig?.billingSource??raw?.billingSource??null,citations:raw?.citations??[],completeness:'not_assessed',missing:[],asof:job.request.context?.asof??null,dataSources:job.request.evidence.map(e=>({source:e.source,dataDate:e.dataDate,status:'provided',sourceUrl:e.sourceUrl})),diagnostics:{tokens:raw?.telemetry?.tokens??{total:null,input:null,output:null,reasoning:null},attempts:null,engineRuns:1,providerRequests:raw?.telemetry?.providerRequests??null,serverToolUsage:raw?.telemetry?.serverToolUsage??null,toolEvents:raw?.telemetry?.toolEvents??[],logs:[{provider:'local:'+job.engine,status:'ok'}]}};
  }
  let value=raw;if(typeof raw==='string'){try{try{value=JSON.parse(raw);}catch{const fences=[...raw.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)];if(fences.length!==1||raw.slice(fences[0].index+fences[0][0].length).trim())throw Error('ambiguous output');value=JSON.parse(fences[0][1]);}}catch{throw fail('report_invalid','返回内容不是可核验报告。');}}
  const report=validateReport(value,job.request.evidence);return {localHarness:true,answer:report.answer,engine:job.engine,billingSource:job.request.providerConfig?.billingSource??null,partial:report.missing.length>0,missing:report.missing,evidenceIds:report.evidenceIds,asof:job.request.context?.asof??null,dataSources:job.request.evidence.filter(e=>report.evidenceIds.includes(e.id)).map(e=>({source:e.source,dataDate:e.dataDate,status:e.status||'published',sourceUrl:e.sourceUrl})),diagnostics:{tokens:{total:null,input:null,output:null,reasoning:null},attempts:null,engineRuns:1,providerRequests:null,logs:[{provider:'local:'+job.engine,status:'ok'}]},disclaimer:'本机 AI 研究，缺数据单列；非投资建议。CLI 未提供的模型调用数与用量不补造。'};
 }
 async execute(account,id,controller){
  if(!this.store.begin(id,account)){this.active.delete(id);return;}
  const job=this.store.get(account,id);try{
   const raw=await this.run(job.engine,job.request,{signal:controller.signal,jobId:id,account,onReceipt:value=>this.store.receipt(account,id,value)});
   this.store.receipt(account,id,raw);if(controller.signal.aborted){this.store.status(account,id,'stopped','停止已确认；原始回执仍保留，不自动重跑。');return;}
   this.store.finish(account,job,this.result(job,raw));
  }catch(error){const code=String(error?.code||'local_engine_failed'),uncertain=['report_invalid','agent_timeout','agent_shutdown_failed','agent_policy_violation','agent_cleanup_failed','deepseek_network_failed','deepseek_bad_response','deepseek_response_too_large'].includes(code);this.store.status(account,id,controller.signal.aborted&&code!=='agent_shutdown_failed'?'stopped':uncertain?'needs_attention':'failed',controller.signal.aborted&&code!=='agent_shutdown_failed'?'本轮已停止，未切换平台 AI。':code==='report_invalid'?'本机结果待校验，原始回执保留，不自动重跑。':(failureHints[code]||'本机引擎未完成（'+code.replace(/[^a-z0-9_]/g,'').slice(0,60)+'）。')+'未切换平台 AI 或其他引擎，未自动重试。');}
  finally{this.active.delete(id);}
 }
 async resume(account,id){const job=this.store.get(account,id);if(!job?.receipt)throw fail('receipt_missing','没有已确认的模型回执，不能安全恢复；不会自动重跑。');if(job.status==='complete')return this.get(account,id);const result=this.result(job,job.receipt);if(job.error?.includes('agent_cleanup_failed'))result.runtimeWarnings=['临时工作区清理尚未确认；此处仅恢复已保存正文，没有重新调用模型。'];this.store.finish(account,job,result);return this.get(account,id);}
 async stop(account,id){const controller=this.active.get(id);if(!this.store.get(account,id))throw fail('not_found','任务不存在。');if(controller){controller.abort();for(let n=0;n<100&&this.active.has(id);n++)await new Promise(r=>setTimeout(r,50));if(this.active.has(id))throw fail('stop_uncertain','停止尚未确认，请核对原任务。');}else if(this.store.get(account,id).status==='queued')this.store.status(account,id,'stopped','未执行模型。');return {stopped:this.store.get(account,id).status==='stopped'};}
}
