import {useEffect,useRef,useState}from'react';
import {useQuery,useQueryClient}from'@tanstack/react-query';
import {Cpu,RefreshCw,ShieldCheck,FolderOpen,CheckCircle2,AlertCircle}from'lucide-react';
import {getJSON}from'./api';import {Widget}from'./components';import {usePreferences}from'./personal-preferences';
import {useLocalConnection,localStatusKey}from'./LocalAIStatus';import {engineNames as names}from'./local-engines';import './local-ai.css';
const options=[
 {id:'codex',description:'用本机 Codex 与本人 ChatGPT 账号研究。'},
 {id:'codebuddy',description:'用本机 WorkBuddy / CodeBuddy 账号研究。'},
 {id:'claude',description:'使用官方 Claude Code CLI 登录。'},
 {id:'deepseek',description:'填写本人 API Key，使用 DeepSeek 官方服务。'},
];
async function post(url:string,body:any){const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json','x-gl':'1'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const value=await response.json();if(!response.ok)throw Object.assign(Error(value.error||'本地操作未确认；不会切换平台 AI。'),{status:response.status});return value;}
export default function LocalAI(){
 const {account}=usePreferences();
 if(account==='guest')return <div className="local-ai-page"><header className="page-heading"><h1>本地 AI Agent</h1><span>观澜 Local Harness</span></header><Widget title="连接自己的观澜账号"><p>先连接账号以隔离保存本机配置，随后选择要使用的 AI。不会扫描本机引擎、显示已连接或调用模型。</p><a className="primary" href="/next/login?returnTo=%2Fnext%2Flocal-ai">登录观澜账号</a></Widget></div>;
 return <LocalAIWorkspace key={account} account={account}/>;
}
function LocalAIWorkspace({account}:{account:string}){
 const client=useQueryClient(),connection=useLocalConnection();
 const settingsKey=['local-ai-settings',account],settings=useQuery({queryKey:settingsKey,queryFn:({signal})=>getJSON('/api/local-ai/settings',signal),retry:false});
 const revision=settings.data?.setupRevision??null,key='guanlan.local-ai.probe.'+account+(revision?'.'+revision:'');
 const [draft,setDraft]=useState(''),[probe,setProbe]=useState(''),[notice,setNotice]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[location,setLocation]=useState(''),[apiKey,setApiKey]=useState(''),[credentialBusy,setCredentialBusy]=useState(false),[confirmReset,setConfirmReset]=useState(false);
 const saving=useRef('');
 const [editing,setEditing]=useState(false),showSetup=!settings.data?.selection||editing;
 const detect=useQuery({queryKey:['local-ai-environment',account,revision,draft],queryFn:({signal})=>getJSON('/api/local-ai/engines?'+new URLSearchParams({engine:draft,refresh:'1'}),signal),enabled:showSetup&&!!draft&&!!settings.data,retry:false,refetchOnWindowFocus:false,staleTime:30000});
 const deepseek=useQuery({queryKey:['local-ai-deepseek',account,revision],queryFn:({signal})=>getJSON('/api/local-ai/deepseek',signal),enabled:draft==='deepseek'&&!!settings.data,retry:false});
 const status=useQuery({queryKey:['local-ai-probe',account,probe],queryFn:({signal})=>getJSON('/api/agent/jobs/'+probe,signal),enabled:!!probe,retry:false,refetchInterval:q=>q.state.error||['complete','failed','stopped','needs_attention'].includes(q.state.data?.status)?false:2000});
 useEffect(()=>{if(!settings.data)return;try{const value=JSON.parse(sessionStorage.getItem(key)||'null');if(value?.id===settings.data.selection?.probeId){sessionStorage.removeItem(key);return;}if(value?.id&&/^[0-9a-f-]{36}$/i.test(value.id)&&names[value.engine]){setProbe(value.id);setDraft(value.engine);setEditing(true);}}catch{}},[key,!!settings.data]);
 useEffect(()=>{const job=status.data;if(!probe||!job)return;if(job.status==='complete'&&saving.current!==probe){
  if(settings.data?.selection?.probeId===probe){sessionStorage.removeItem(key);setProbe('');return;}
  saving.current=probe;setBusy(true);void post('/api/local-ai/settings',{engine:job.engine,probeId:probe}).then(async()=>{setNotice('连接已验证并保存');setError('');sessionStorage.removeItem(key);setProbe('');await client.invalidateQueries({queryKey:localStatusKey(account)});await settings.refetch();setEditing(false);setDraft('');}).catch(e=>setError(e.message)).finally(()=>setBusy(false));
 }else if(['failed','stopped','needs_attention'].includes(job.status)){setError(job.error||'连接未通过，可以重新检测或选择另一个 AI；不会自动重试。');setBusy(false);}},[status.data,probe,key]);
 const running=credentialBusy||busy||!!probe&&['queued','running'].includes(status.data?.status||'queued'),selection=settings.data?.selection,chosen=detect.data?.engines?.find((e:any)=>e.id===draft),ready=chosen?.available&&!detect.isError&&!detect.isFetching;
 function choose(id:string){if(running)return;sessionStorage.removeItem(key);setProbe('');saving.current='';setDraft(id);setError('');setNotice('');setConfirmReset(false);}
 async function refresh(){if(!draft)return;await detect.refetch();await client.invalidateQueries({queryKey:localStatusKey(account)});}
 async function test(){if(running||!ready)return;setBusy(true);setError('');setNotice('');const id=crypto.randomUUID();
  try{sessionStorage.setItem(key,JSON.stringify({id,engine:draft}));}catch{setNotice('浏览器无法保存恢复编号，请保留下方任务编号。');}
  try{const value=await post('/api/local-ai/probes',{engine:draft,turnId:id});setProbe(value.id);setNotice('正在连接 '+names[draft]+'；请勿重复提交。');}
  catch(e:any){if([400,401,403,409,422,429].includes(e.status)){setError(e.message);sessionStorage.removeItem(key);}else{setProbe(id);setError('提交结果未确认，已保留原任务编号；请核对原任务，不会自动创建替代调用。');}setBusy(false);}
 }
 async function setPath(){setError('');try{await post('/api/local-ai/workbuddy-path',{path:location.trim()||null});await refresh();setNotice('安装位置已更新，请主动测试连接。');}catch(e:any){setError(e.message);}}
 async function saveKey(remove=false){if(credentialBusy)return;if(remove&&!window.confirm('只移除本机加密保存的 DeepSeek 密钥；已有报告保留，之后需重新填写并测试。'))return;setCredentialBusy(true);setError('');setNotice('');try{await post('/api/local-ai/deepseek',remove?{remove:true}:{apiKey});setApiKey('');await deepseek.refetch();await refresh();setNotice(remove?'本机密钥已移除；旧报告保留。':'密钥已在本机加密保存；尚未连接，请主动测试。');}catch(e:any){setError(e.message);}finally{setCredentialBusy(false);}}
 async function reset(){if(running)return;setBusy(true);setError('');try{const value=await post('/api/local-ai/reset',{});sessionStorage.removeItem(key);client.setQueryData(settingsKey,value);setDraft('');setProbe('');setApiKey('');saving.current='';setConfirmReset(false);setNotice('已断开，重新选择一个 AI 开始。');await client.invalidateQueries({queryKey:localStatusKey(account)});}catch(e:any){setError(e.message);}finally{setBusy(false);}}
 const connected=!!selection&&!connection.error&&connection.data?.kind==='verified',step=connected&&selection.engine===draft?3:draft?2:1;
 return <div className="local-ai-page"><header className="page-heading"><h1>本地 AI Agent</h1><span>选择你自己的研究助手</span></header>
 <Widget title={selection&&!editing?'当前 AI Agent':'选择你的 AI'} loading={settings.isPending} error={settings.error?.message} retry={()=>void settings.refetch()} actions={<button className="quiet-button" disabled={running} onClick={()=>setConfirmReset(v=>!v)}>重新初始化 AI</button>}>
 {showSetup&&<>
 <ol className="local-ai-steps" aria-label="连接步骤"><li aria-current={step===1?'step':undefined}>选择 AI</li><li aria-current={step===2?'step':undefined}>检测环境</li><li aria-current={step===3?'step':undefined}>确认连接</li></ol>
 <p className="provenance">先选择，再检测。没有选择时不扫描；只检测你选中的 AI。检测不调用模型，真实连接测试会使用本人供方额度；失败不会自动切换平台 AI 或其他计费来源。</p>
 </>}
 {selection&&<div className="local-ai-current"><p className="local-ai-active">当前已配置：{names[selection.engine]||selection.engine}</p><small>连接状态：{connection.error?'状态未确认':connected?'已连接':connection.data?.label||'正在读取'}{selection.providerConfig?.billingSource?' · '+selection.providerConfig.billingSource:''}</small>{!editing&&<><p className="provenance">后续 AI 分析将使用这个 Agent；不会自动切换其他引擎或平台扣费。</p><div className="local-ai-summary-actions"><button className="outline-button" disabled={running} onClick={()=>{setEditing(true);setDraft('');}}>更换 AI Agent</button><button className="quiet-button" disabled={connection.isFetching} onClick={()=>void connection.refetch()}>重新检测连接</button>{!connected&&<button className="outline-button" onClick={()=>{setEditing(true);setDraft(selection.engine);}}>重新连接</button>}</div></>}</div>}
 {showSetup&&<>
 <fieldset className="local-ai-engines" disabled={running}><legend className="sr-only">选择本地引擎</legend>{options.map(engine=><label className={'local-ai-engine'+(draft===engine.id?' is-selected':'')} key={engine.id}><div><input type="radio" name="local-engine" aria-label={'使用 '+names[engine.id]} checked={draft===engine.id} onChange={()=>choose(engine.id)}/><Cpu size={18}/><strong>{names[engine.id]}</strong><span>{draft===engine.id?(detect.isFetching?'检测中…':chosen?.version||'已选择'):'选择后检测'}</span></div><p>{engine.description}</p><small>{selection?.engine===engine.id&&connected?'已连接':draft===engine.id?(detect.isError?'检测未确认':detect.isFetching?'只检查安装、登录或密钥，不运行模型':chosen?.available?'检测通过，待连接':'检测未通过，可按下方提示处理或换选'):'尚未检测'}</small></label>)}</fieldset>
 {!draft&&<p className="local-ai-first-hint" role="status">选择一个 AI 后开始检测。你可以随时更换，不会自动连接或扣费。</p>}
 {draft&&<section className="local-ai-detection" aria-label="所选 AI 检测结果">
  <header>{ready?<CheckCircle2 size={18}/>:<AlertCircle size={18}/>}<strong>{detect.isFetching?'正在检测 '+names[draft]:detect.isError?'检测未确认':chosen?.available?'检测通过':'暂时无法连接'}</strong><button className="outline-button" disabled={running||detect.isFetching} onClick={()=>void refresh()}><RefreshCw size={14}/>重新检测</button></header>
  {detect.isError?<p className="local-error" role="alert">{detect.error.message} 没有运行模型，可重新检测或换一个 AI。</p>:chosen&&<><p>{chosen.detail||'环境信息已取得。'}</p>{!chosen.available&&<small>尚未发起模型请求。完成下方配置后重新检测，或直接选择另一个 AI。</small>}</>}
  {chosen?.billingSource&&<p className="local-ai-billing">费用来源：{chosen.billingSource}</p>}
 </section>}
 {draft==='claude'&&<section className="local-ai-setup" aria-label="Claude Code 登录说明"><h3>使用官方 CLI 登录</h3><p>在本机终端运行 <code>claude auth login</code>，由你本人完成官方浏览器授权，再点击“重新检测”。观澜不代登录、不复制会话令牌。</p><p className="provenance">订阅、Console/API 或云供方登录以检测结果标注费用来源，来源变化后需重测。</p><a href="https://code.claude.com/docs/en/authentication" target="_blank" rel="noopener noreferrer">官方安装与登录说明</a></section>}
 {draft==='codebuddy'&&<details><summary>WorkBuddy 安装在其他位置？</summary><div className="local-ai-path"><label>WorkBuddy 安装目录<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="留空恢复自动检测"/></label><button className="outline-button" disabled={running} onClick={()=>void setPath()}><FolderOpen size={15}/>保存安装位置</button></div></details>}
 {draft==='deepseek'&&<section className="local-ai-setup" aria-label="DeepSeek 密钥配置"><h3>DeepSeek 官方 API</h3><p>deepseek-flash · 官方联网研究。消耗本人 API 余额，模型与联网工具可能分别计费，不是网页聊天额度。</p><p className="provenance">{deepseek.isError?'密钥配置读取失败，旧配置未更改。':deepseek.data?.configured?'本机已保存加密密钥；页面不会回显。':'尚未配置 API Key。'}Windows 用户级加密保存在本机，不上传 SaaS。</p><form className="local-ai-secret" onSubmit={e=>{e.preventDefault();void saveKey();}}><label>DeepSeek API Key<input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} autoComplete="off" spellCheck={false} disabled={running} placeholder={deepseek.data?.configured?'留空保留已有密钥':'仅在本机填写，不要发到聊天'}/></label><button type="submit" className="outline-button" disabled={running||apiKey.length<8}>保存 DeepSeek 密钥</button>{deepseek.data?.configured&&<button type="button" className="outline-button" disabled={running} onClick={()=>void saveKey(true)}>移除本机密钥</button>}</form><a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">在本人 DeepSeek 开放平台获取密钥</a><p className="provenance">保存密钥只更新本机配置，不会运行模型或替换当前 AI。</p></section>}
 {draft&&<div className="local-ai-actions"><button className="primary" disabled={running||!ready} onClick={()=>void test()}>{running?'正在核对连接…':'测试并连接'}</button><small>{ready?'点击后真实测试并保存，只使用所选本人额度。':'检测通过后才能测试连接；可先处理提示或换一个 AI。'}</small></div>}
 {selection&&<button className="quiet-button" disabled={running} onClick={()=>{setEditing(false);setDraft('');setError('');}}>取消更改，保留当前 Agent</button>}
 </>}
 {probe&&<p className="provenance">原任务 {probe} · {status.error?'状态读取未确认':status.data?.status||'正在核对'}。刷新只读取原任务，不重新提交。{status.error&&<><button className="outline-button" onClick={()=>void status.refetch()}>核对原任务</button>{(status.error as any).status===404&&<button className="outline-button" onClick={()=>{sessionStorage.removeItem(key);setProbe('');setBusy(false);setNotice('原编号不存在，已清除；未发起新测试。');}}>清除失效编号</button>}</>}</p>}
 {notice&&<p role="status" className="local-status">{notice}</p>}{error&&<p role="alert" className="local-error">{error}</p>}
 {confirmReset&&<aside className="local-ai-reset"><strong>断开并重新选择 AI？</strong><p>清除本账号的 AI 选择、本机保存的 DeepSeek 密钥和连接验证状态。保留研究、持仓、自选和筛选方案；不会退出官方 CLI 登录，也不会删除历史任务。</p><button className="outline-button" disabled={running} onClick={()=>void reset()}>确认断开并初始化</button><button className="quiet-button" onClick={()=>setConfirmReset(false)}>取消</button></aside>}
 </Widget>
<section className="local-ai-usage" aria-labelledby="local-ai-usage-title"><h2 id="local-ai-usage-title">本地 Harness 使用范围</h2><p><strong>连接自己的 AI Agent 后，可使用问观澜、AI 盘面点评和个人 AI 研究。</strong></p><dl><div><dt>问观澜、AI 盘面点评、个人 AI 研究</dt><dd>由你选择的 AI Agent 自主研究，保留原生回答；消耗本人供方额度，不使用观澜平台 AI 额度。</dd></div><div><dt>市场数据与平台内容</dt><dd>行情、K线、板块及已发布产业研报读取观澜云端共享资料；本地 Agent 不接管平台采集、自动研报发布，也不重复抓取全市场。</dd></div><div><dt>个人资料</dt><dd>自选、持仓、方案、研究报告和文字笔记按账号保存在本机，不自动覆盖云端个人资料。</dd></div><div><dt>账号安全与云端提醒</dt><dd>注册、找回密码、验证码、云端提醒与推送继续在官网管理，本地提供入口。</dd></div></dl><p className="provenance">本地 Harness 是本机连接和调度，不是全部离线运行：模型推理和联网检索通常仍由所选供方云端完成。本轮提问及选定公开资料会交给该供方；不会自动发送持仓成本或登录凭据。</p></section>
 <details className="local-ai-boundaries"><summary><ShieldCheck size={15}/>数据、凭据与用量边界</summary><p>共享数据使用本人观澜账号，AI 使用所选供方账号；两者独立。个人研究、持仓和方案按账号保存在本机，不自动覆盖云端资料。</p><p>本轮问题和选定公开资料会发送给所选供方，并非完全离线。保留原生回答；CLI 未提供的用量不补零，API 金额以本人账单为准。</p><p>阅读、刷新、重开历史和恢复已有回执都不会重新调用模型。失败不自动重试，不切其他 AI 或平台扣费。</p></details></div>;
}
