import http from'node:http';import fs from'node:fs';import path from'node:path';import {fileURLToPath,pathToFileURL}from'node:url';import {randomBytes,randomUUID}from'node:crypto';
import {JobStore,ResearchService}from'./jobs.mjs';import {fail,normalizeEngine,validateReport}from'./core.mjs';import {nativeRunner,engines,engineCatalog,setWorkBuddyLocation}from'./native.mjs';
import {LocalLibrary}from'./library.mjs';
import {connectionState}from'./connection-state.mjs';
import {ProviderVault,deepSeekCapability}from'./provider-vault.mjs';
const project=fileURLToPath(new URL('../',import.meta.url)),cloud='https://guanlan-research.kunkun1023.xyz';
const json=(res,status,value,headers={})=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers});res.end(JSON.stringify(value));};
const cookies=req=>Object.fromEntries(String(req.headers.cookie||'').split(';').map(x=>x.trim().split(/=(.*)/s).slice(0,2)).filter(x=>x.length===2));
async function body(req){let value='';for await(const chunk of req){value+=chunk;if(Buffer.byteLength(value)>1024*1024)throw fail('body_too_large','请求过大。');}try{return JSON.parse(value||'{}');}catch{throw fail('invalid_request','请求格式无效。');}}
const sharedPaths=new Set(['/api/data/free','/api/data/member','/api/data/live','/api/data/manifest','/api/data/events','/api/data/event-context','/api/data/intraday','/api/data/concept-observation','/api/data/theme-observation','/api/data/stock-observation','/api/data/fund-observation','/api/data/funds-radar','/api/v2/chart','/api/v2/quotes','/api/v2/review','/api/v2/high-board','/api/v2/portfolio-facts','/api/research/stock','/api/research/stock/associations','/api/research/announcements','/api/research/industry/automation','/api/research/industry/candidates','/api/research/industry/financials','/api/research/industry/reports','/api/research/industry/updates']);
const dataRoute=p=>sharedPaths.has(p);
const mime=p=>p.endsWith('.js')||p.endsWith('.mjs')?'application/javascript':p.endsWith('.css')?'text/css':p.endsWith('.html')?'text/html; charset=utf-8':p.endsWith('.json')?'application/json':p.endsWith('.svg')?'image/svg+xml':p.endsWith('.png')?'image/png':p.endsWith('.webp')?'image/webp':p.endsWith('.mp4')?'video/mp4':p.endsWith('.wasm')?'application/wasm':'application/octet-stream';
function serviceLock(dataDir){
 const file=path.join(dataDir,'service.lock'),token=randomBytes(16).toString('hex');
 for(let attempt=0;attempt<2;attempt++)try{fs.writeFileSync(file,JSON.stringify({pid:process.pid,token}),{flag:'wx',mode:0o600});return()=>{try{if(JSON.parse(fs.readFileSync(file,'utf8')).token===token)fs.unlinkSync(file);}catch{}};}catch(error){
  if(error.code!=='EEXIST')throw error;
  let previous;try{previous=JSON.parse(fs.readFileSync(file,'utf8'));}catch{throw fail('service_running','服务锁需核对，未更改旧任务。');}
  if(!Number.isInteger(previous.pid)||previous.pid<=0)throw fail('service_running','服务锁需核对，未更改旧任务。');
  try{process.kill(previous.pid,0);throw fail('service_running','该数据目录已有本机服务运行，未重置任何任务。');}catch(e){if(e.code!=='ESRCH')throw e;fs.unlinkSync(file);}
 }
 throw fail('service_running','本机服务锁竞争，请核对原服务。');
}
export function createApp({dataDir=path.join(project,'.local'),remoteFetch=fetch,detect=engines,run,staticRoot=path.join(project,'web/dist')}={}){
 fs.mkdirSync(dataDir,{recursive:true});const releaseLock=serviceLock(dataDir);let store;try{store=new JobStore(path.join(dataDir,'research.sqlite'));}catch(error){releaseLock();throw error;}const vault=new ProviderVault(store),sessions=new Map(),service=new ResearchService(store,run??nativeRunner(dataDir,{resolveDeepSeek:(account,revision)=>vault.secret(account,revision)})),library=new LocalLibrary(store,service),detectionCache=new Map();
 const statuses=async(engine,force=false)=>{let entry=detectionCache.get(engine);if(entry?.pending)return entry.pending;if(!force&&entry&&Date.now()-entry.at<10000)return entry.value;entry={at:0,value:[]};detectionCache.set(engine,entry);entry.pending=Promise.resolve(detect(dataDir,engine)).then(value=>{entry.value=value.filter(e=>e.id===engine);entry.at=Date.now();return entry.value;}).finally(()=>entry.pending=null);return entry.pending;};
 const accountStatuses=async(account,engine,force=false)=>engine==='deepseek'?[deepSeekCapability(vault.status(account))]:await statuses(engine,force);
 const setupRevision=account=>store.setting(account,'ai-setup')?.value??null;
 const profile=cap=>({authRevision:cap.authRevision??null,billingSource:cap.billingSource??null});
 const activeSelection=async account=>{const selection=store.setting(account,'engine')?.value;if(!selection)throw fail('engine_required','请先在「本机 AI」测试并保存引擎。');const capability=(await accountStatuses(account,selection.engine)).find(e=>e.id===selection.engine),probe=selection.probeId?store.get(account,selection.probeId):null;if((selection.setupRevision??null)!==setupRevision(account)||connectionState({selection,capability,probe}).kind!=='verified')throw fail('probe_required','所选引擎或费用来源已变化，请重新测试；未调用其他引擎或平台 AI。');return selection;};
 const cloudGet=async(session,endpoint)=>{const response=await remoteFetch(cloud+endpoint,{method:'GET',headers:{cookie:session.remoteCookie,accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000)});return response;};
 const evidence=async(session,context)=>{
  const records=[];try{const response=await cloudGet(session,'/api/data/free?view=home');if(response.ok){const v=await response.json(),data={asof:v.asof,market:v.ustats,indices:v.indices,limits:v.lu,meta:v.meta};if(Object.keys(data).some(k=>k!=='asof'&&data[k]!=null))records.push({id:'shared:market',source:'观澜已发布收盘快照（非实时）',dataDate:v.asof||null,status:'published',data});}}catch{}
  if(context?.stock?.code&&/^\d{6}$/.test(context.stock.code))try{const response=await cloudGet(session,'/api/v2/quotes?codes='+context.stock.code);if(response.ok){const v=await response.json();records.push({id:'shared:stock:'+context.stock.code,source:'观澜共享个股报价',dataDate:v.asof||null,status:'published',data:v});}}catch{}
  return records.filter(e=>JSON.stringify(e).length<64000&&(!context?.asof||!!e.dataDate&&e.dataDate<=context.asof)).map(e=>({...e,scope:'public_market'}));
 };
 const server=http.createServer(async(req,res)=>{try{
  const localOrigin='http://'+req.headers.host,url=new URL(req.url||'/',localOrigin),p=url.pathname,m=req.method||'GET';
  if(!/^127\.0\.0\.1(?::\d+)?$/.test(String(req.headers.host||'')))return json(res,403,{error:'仅允许本机回环地址。'});
  if(req.headers.origin&&req.headers.origin!==localOrigin)return json(res,403,{error:'不接受未配对的跨站请求。'});
  if(!['GET','HEAD'].includes(m)&&(!String(req.headers['content-type']||'').startsWith('application/json')||req.headers.origin!==localOrigin||req.headers['x-gl']!=='1'))return json(res,403,{error:'请求来源或格式不受信任。'});
  const session=sessions.get(cookies(req).gl_local_session);const account=session?'cloud:'+session.user.id:null;
  if(p==='/api/local-ai/health')return json(res,200,{ok:true,product:'guanlan-local-harness',version:'0.1.0-dev',platformFallback:false,baseline:'2026.11.13.7'});
  if(p==='/api/me')return json(res,200,session?{user:{...session.user,isAdmin:false},localHarness:true}:{user:null,localHarness:true});
  if(p==='/api/auth/password/login'&&m==='POST'){
   const input=await body(req);if(typeof input.email!=='string'||typeof input.password!=='string'||input.password.length>128)return json(res,400,{error:'邮箱或密码格式无效。'});
   const response=await remoteFetch(cloud+p,{method:'POST',headers:{'content-type':'application/json','x-gl':'1',origin:cloud},body:JSON.stringify({email:input.email,password:input.password}),redirect:'error',signal:AbortSignal.timeout(15000)});
   const value=await response.json();if(!response.ok)return json(res,response.status,{error:typeof value.error==='string'?value.error:'登录未确认。'});
   const set=response.headers.getSetCookie?.()||[response.headers.get('set-cookie')||''],remoteCookie=set.map(x=>x.match(/(?:^|[,\s])gl_session=([^;\s,]+)/)?.[1]).find(Boolean);if(!remoteCookie)return json(res,502,{error:'登录未返回有效会话，未保存密码。'});
   const remoteSession={remoteCookie:'gl_session='+remoteCookie};const meResponse=await cloudGet(remoteSession,'/api/me'),me=await meResponse.json();if(!meResponse.ok||!me.user?.id)return json(res,502,{error:'登录身份尚未确认。'});
   const token=randomBytes(32).toString('hex');sessions.set(token,{...remoteSession,user:me.user});return json(res,200,{ok:true},{'set-cookie':'gl_local_session='+token+'; HttpOnly; SameSite=Strict; Path=/'});
  }
  if(p.startsWith('/api/auth/')&&p!=='/api/auth/logout')return json(res,409,{error:'本地版暂只连接已有观澜账号；注册与密码找回请在官方站点完成安全验证。'});
  if(p==='/api/auth/logout'&&m==='POST'){if(session){await remoteFetch(cloud+p,{method:'POST',headers:{cookie:session.remoteCookie,'content-type':'application/json','x-gl':'1',origin:cloud},body:'{}',signal:AbortSignal.timeout(15000)});sessions.delete(cookies(req).gl_local_session);}return json(res,200,{ok:true},{'set-cookie':'gl_local_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
  if(p.startsWith('/api/')&&!session)return json(res,401,{error:'请先连接自己的观澜账号读取共享数据。'});
  if(p==='/api/local-ai/engines'&&m==='GET'){const engine=url.searchParams.get('engine');return json(res,200,{engines:engine?await accountStatuses(account,normalizeEngine(engine),url.searchParams.has('refresh')):engineCatalog});}
  if(p==='/api/local-ai/reset'&&m==='POST')return json(res,200,store.resetAI(account));
  if(p==='/api/local-ai/deepseek'){
   if(m==='GET')return json(res,200,vault.status(account));
   if(m==='POST'){const input=await body(req);return json(res,200,input.remove===true?await vault.remove(account):await vault.save(account,input.apiKey));}
  }
  if(p==='/api/local-ai/settings'&&m==='GET')return json(res,200,{selection:store.setting(account,'engine')?.value??null,setupRevision:setupRevision(account),platformFallback:false,sessionPersistence:'memory_only'});
  if(p==='/api/local-ai/status'&&m==='GET'){
   const selection=store.setting(account,'engine')?.value??null,capabilities=selection?await accountStatuses(account,selection.engine,url.searchParams.has('refresh')):[],capability=capabilities.find(e=>e.id===selection?.engine),probe=selection?.probeId?store.get(account,selection.probeId):null;
   const recent=selection?.engine?store.db.prepare('SELECT id FROM jobs WHERE account=? AND engine=? ORDER BY created_at DESC,rowid DESC LIMIT 1').get(account,selection.engine):null,lastJob=recent?store.get(account,recent.id):null;
   return json(res,200,{...connectionState({selection,capability,probe,lastJob}),observedAt:detectionCache.get(selection?.engine)?.at??Date.now(),platformFallback:false});
  }
  if(p==='/api/local-ai/probes'&&m==='POST'){
   const input=await body(req),engine=normalizeEngine(input.engine),revision=setupRevision(account),existing=store.get(account,input.turnId);
   if(existing){if(existing.engine!==engine||existing.request.context?.connectionProbe!==true)throw fail('request_conflict','任务编号已经用于其他请求。');if((existing.request.context.setupRevision??null)!==setupRevision(account))throw fail('probe_required','这是初始化前的旧测试；仅保留历史，不会重新连接。');return json(res,202,service.create(account,{turnId:input.turnId,...existing.request}));}
   const status=(await accountStatuses(account,engine)).find(x=>x.id===engine);if(revision!==setupRevision(account))throw fail('probe_required','配置已重新初始化，本次旧连接请求已作废；没有调用模型。');if(!status?.available)throw fail('engine_unavailable','所选引擎检测未通过，请完成安装、登录或密钥配置，也可以换一个 AI。');
   return json(res,202,service.create(account,{turnId:input.turnId,question:'验证本机 AI 连接',engine,providerConfig:profile(status),context:{page:'本机 AI 设置',connectionProbe:true,engineVersion:status.version??null,setupRevision:setupRevision(account)},evidence:[]}));
  }
  if(p==='/api/local-ai/settings'&&m==='POST'){
   const input=await body(req),engine=normalizeEngine(input.engine),job=store.get(account,input.probeId);if(job?.status!=='complete'||job.engine!==engine||job.request.context?.connectionProbe!==true)throw fail('probe_required','当前引擎必须真实测试成功后才能保存；原配置保留。');
   if((job.request.context.setupRevision??null)!==setupRevision(account))throw fail('probe_required','这是初始化前的旧测试，不能自动恢复连接；请重新选择并测试。');
   const value={engine,probeId:job.id,setupRevision:setupRevision(account),providerConfig:job.request.providerConfig,engineVersion:job.request.context.engineVersion??null,checkedAt:new Date(job.updated_at).toISOString()};
   const capability=(await accountStatuses(account,engine)).find(e=>e.id===engine);if(value.setupRevision!==setupRevision(account)||connectionState({selection:value,capability,probe:job}).kind!=='verified')throw fail('probe_required','测试之后认证或版本已变化；旧配置保留，请重新测试。');
   store.setSetting(account,'engine',value);return json(res,200,{selection:value,platformFallback:false});
  }
  if(p==='/api/local-ai/workbuddy-path'&&m==='POST'){const input=await body(req);const status=await setWorkBuddyLocation(dataDir,input.path);detectionCache.delete('codebuddy');return json(res,200,status);}
  if(p==='/api/profile'){if(m==='GET')return json(res,200,{...store.profile(account),storage:'local'});if(m==='PUT'){const input=await body(req);if(!input.profile||typeof input.profile!=='object'||!Number.isInteger(input.version))throw fail('invalid_request','资料格式无效。');return json(res,200,store.saveProfile(account,input.profile,input.version));}}
  if(p==='/api/preferences'){
   if(m==='GET')return json(res,200,{preferences:store.setting(account,'preferences')?.value??{},storage:'local'});
   if(m==='PUT'){const input=await body(req);if(!Array.isArray(input.shortcuts)||input.shortcuts.length>20||input.shortcuts.some(x=>!['home','live','relay','auction','review','emotion','watchlist','stock','agent'].includes(x)))throw fail('invalid_request','快捷入口格式无效。');return json(res,200,{preferences:store.setSetting(account,'preferences',{shortcuts:[...new Set(input.shortcuts)]}).value,storage:'local'});}
  }
  if(p==='/api/observation/schemes'){
   if(m==='GET'){const row=store.setting(account,'schemes');return json(res,200,{version:row?.version??0,schemes:row?.value??[],storage:'local'});}
   if(m==='PUT'){const input=await body(req);if(!Number.isInteger(input.version)||!Array.isArray(input.schemes)||input.schemes.length>20||JSON.stringify(input.schemes).length>64000)throw fail('invalid_request','筛选方案格式或数量无效。');const row=store.setSetting(account,'schemes',input.schemes,input.version);return json(res,200,{version:row.version,schemes:row.value,storage:'local'});}
  }
  if(p==='/api/research/library'){
   if(m==='GET'){
    const id=url.searchParams.get('run');if(id){const run=library.get(account,id);return json(res,run?200:404,run?{run}:{error:'本账号没有这份本地报告。'});}
    const subject=url.searchParams.get('subject');return json(res,200,subject?library.history(account,subject,url.searchParams.get('before')):library.list(account,Object.fromEntries(url.searchParams)));
   }
   if(m==='POST'){
    const id=url.searchParams.get('run');if(id){if(!library.get(account,id))throw fail('not_found','本账号没有这个研究任务。');const action=url.searchParams.get('action');if(!['stop','resume','start'].includes(action))throw fail('invalid_request','不支持此操作。');if(action==='stop')await service.stop(account,id);else await service.resume(account,id);return json(res,200,{run:library.get(account,id)});}
    const input=await body(req),normalized=library.normalized(input),old=library.get(account,normalized.requestId);
    if(old)return json(res,200,{run:library.create(account,input)});
    let bundle=[],selection=null;
    if(!normalized.note){selection=await activeSelection(account);bundle=await evidence(session,{asof:normalized.asof,stock:normalized.subject.kind==='company'?normalized.subject:null});}
    return json(res,202,{run:library.create(account,input,{engine:selection?.engine,providerConfig:selection?.providerConfig,evidence:bundle})});
   }
  }
  if(p==='/api/research/records'){
   if(m==='GET')return json(res,200,library.records(account,Object.fromEntries(url.searchParams)));
   if(m==='POST'||m==='PUT')return json(res,200,{record:library.saveRecord(account,await body(req),m==='PUT')});
  }
  if(p==='/api/account/usage'&&m==='GET'){
   const days=[1,7,30].includes(Number(url.searchParams.get('days')))?Number(url.searchParams.get('days')):1,day=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'}),from=Date.parse(day+'T00:00:00+08:00')-(days-1)*86400000,to=Date.parse(day+'T00:00:00+08:00')+86400000,offset=Math.max(0,Math.floor(Number(url.searchParams.get('offset'))||0));
   const filter='account=? AND created_at>=? AND created_at<?',params=[account,from,to],counts=store.db.prepare(`SELECT COUNT(*) AS total,COALESCE(SUM(attempts),0) AS engineRuns FROM jobs WHERE ${filter}`).get(...params);
   const tokens=store.db.prepare(`SELECT SUM(json_extract(receipt,'$.telemetry.tokens.total')) AS reportedTokens,COUNT(json_extract(receipt,'$.telemetry.tokens.total')) AS tasksWithReportedUsage FROM jobs WHERE ${filter}`).get(...params);
   const tasks=store.db.prepare(`SELECT id,engine,status,created_at AS createdAt,updated_at AS updatedAt,attempts AS engineRuns,json_extract(request,'$.context.connectionProbe') AS connectionProbe,json_extract(request,'$.providerConfig.billingSource') AS billingSource,json_extract(receipt,'$.telemetry.tokens.total') AS reportedTokens FROM jobs WHERE ${filter} ORDER BY created_at DESC,id DESC LIMIT 20 OFFSET ?`).all(...params,Math.min(100000,offset));
   return json(res,200,{localHarness:true,platformFallback:false,...tokens,remainingQuota:null,generatedAt:Date.now(),days,from:new Date(from).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'}),to:day,...counts,tasks,selection:store.setting(account,'engine')?.value??null});
  }
  if(p==='/api/agent/conversations'&&m==='GET')return json(res,200,store.conversations(account));
  if(p.startsWith('/api/agent/conversations/')&&m==='GET')return json(res,200,store.messages(account,decodeURIComponent(p.split('/').at(-1))));
  if(p==='/api/agent/jobs'&&m==='POST'){
   const input=await body(req),existing=store.get(account,input.turnId),selection=existing?{engine:existing.engine,providerConfig:existing.request.providerConfig}:await activeSelection(account);
   const bundle=existing?.request.evidence??await evidence(session,input.context);return json(res,202,service.create(account,{...input,engine:selection.engine,providerConfig:selection.providerConfig,evidence:bundle}));
  }
  const jobMatch=p.match(/^\/api\/agent\/jobs\/([0-9a-f-]{36})(?:\/(stop|resume|revalidate))?$/i);
  if(jobMatch){const [,id,action]=jobMatch;if(m==='GET'&&!action){const job=service.get(account,id);return json(res,job?200:404,job||{error:'任务不存在。'});}if(m==='POST'&&action)return json(res,200,action==='stop'?await service.stop(account,id):await service.resume(account,id));}
  if(p==='/api/notifications/summary')return json(res,200,{unread:0,messages:[],alerts:[],highestPriority:null,storage:'local'});
  if(p==='/api/notifications')return json(res,200,{messages:[],nextCursor:null});
  if(p==='/api/client-errors'&&m==='POST')return json(res,202,{accepted:false,reason:'local_only'});
  if(p.startsWith('/api/')&&m==='GET'&&dataRoute(p)){
   const response=await cloudGet(session,p+url.search),value=await response.arrayBuffer();res.writeHead(response.status,{'content-type':response.headers.get('content-type')||'application/json','cache-control':'private, no-store','x-guanlan-data-origin':'shared-saas'});res.end(Buffer.from(value));return;
  }
  if(p.startsWith('/api/'))return json(res,403,{error:'本地版尚未接入此操作；没有转交平台 AI 或写入云端个人资料。'});
  const publicFile=/^\/(?:next\/(?:assets|ocr|licenses)\/|v2\/assets\/|auth\/(?:logo\.png|login-waves\.mp4)$|legal\/[a-z-]+\.html$)/.test(p)||p==='/v2/index-history.json';
  const root=p.startsWith('/auth/')||p.startsWith('/legal/')?path.join(project,'web/public'):p.startsWith('/v2/')?path.join(project,'web'):staticRoot;
  const pathname=publicFile?p:p.startsWith('/next/')||p==='/next'||p==='/'?'/next/index.html':null;
  if(!pathname||!['GET','HEAD'].includes(m))return json(res,404,{error:'界面资源不存在。'});
  const file=path.resolve(root,'.'+pathname);if(!file.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return json(res,404,{error:'界面资源不存在，请先构建。'});
  res.writeHead(200,{'content-type':mime(file),'x-content-type-options':'nosniff','cache-control':pathname.includes('/next/assets/')?'public, max-age=31536000, immutable':'no-store'});if(m==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
 }catch(error){const code=String(error.code||'local_service_error');const status=['invalid_request','body_too_large','report_invalid'].includes(code)?400:['engine_required','engine_unavailable','probe_required','request_conflict','version_conflict','receipt_missing','ai_busy'].includes(code)?409:code==='not_found'?404:502;json(res,status,{error:code==='local_service_error'?'本地服务读取失败，原资料保留。':error.message,code});}});
 return {server,store,service,async close(){for(const controller of service.active.values())controller.abort();await new Promise(r=>server.close(r));while(service.active.size)await new Promise(r=>setTimeout(r,50));store.close();sessions.clear();releaseLock();}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const app=createApp(),port=Number(process.env.GUANLAN_LOCAL_PORT||38931);app.server.listen(port,'127.0.0.1',()=>console.log('观澜 Local Harness: http://127.0.0.1:'+port+'/next/'));let stopping=false;for(const signal of['SIGINT','SIGTERM'])process.on(signal,()=>{if(!stopping){stopping=true;void app.close().finally(()=>process.exit(0));}});}
