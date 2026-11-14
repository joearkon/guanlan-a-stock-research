// @vitest-environment jsdom
import {test,expect,vi,afterEach}from'vitest';import {render,screen,fireEvent,cleanup}from'@testing-library/react';import {MemoryRouter,Routes,Route}from'react-router-dom';import {QueryClient,QueryClientProvider}from'@tanstack/react-query';import {PreferenceProvider}from'./personal-preferences';import LocalAIStatus,{localStatusKey} from'./LocalAIStatus';
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();localStorage.clear();});
function setup(value:any,fail=false,{topbar=false,both=false,account='7'}={}){const requests:any[]=[];vi.stubGlobal('fetch',vi.fn(async(url:any,init:any={})=>{requests.push({url,method:init.method||'GET'});if(fail)throw Error('local service unavailable');return Response.json(value);}));const client=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={client}><PreferenceProvider account={account}><MemoryRouter><Routes><Route path="/" element={<>{(topbar||both)&&<header className="topbar"><LocalAIStatus topbar/></header>}{(!topbar||both)&&<LocalAIStatus/>}</>}/><Route path="/local-ai" element={<h1>配置页已打开</h1>}/></Routes></MemoryRouter></PreferenceProvider></QueryClientProvider>);return {requests,client};}
test('untested saved selection stays non-green and clicking opens configuration',async()=>{
 const {requests}=setup({engine:'codex',kind:'untested',label:'未测试',tone:'muted',verifiedAt:null,detail:'尚无实际回执'});await screen.findByText('Codex');expect(screen.getByText('未测试')).toBeTruthy();expect(document.querySelector('[data-connection-state="verified"]')).toBeNull();
 fireEvent.click(screen.getByRole('link',{name:/本地 AI Agent/}));expect(screen.getByRole('heading',{name:'配置页已打开'})).toBeTruthy();expect(requests.every(r=>r.method==='GET')).toBe(true);
});
test('verified WorkBuddy shows the saved engine and actual verification state without model POST',async()=>{
 const {requests}=setup({engine:'codebuddy',kind:'verified',label:'上次验证通过',tone:'success',verifiedAt:1794600000000,detail:'不是持续联网检测'});await screen.findByText('WorkBuddy / CodeBuddy');expect(screen.getByText('上次验证通过')).toBeTruthy();expect(document.querySelector('[data-connection-state="verified"]')).toBeTruthy();expect(requests.some(r=>r.method==='POST')).toBe(false);
});
test('failed status reads must not show a stale green connection',async()=>{setup(null,true);await screen.findByText('状态未确认');expect(document.querySelector('[data-connection-state="verified"]')).toBeNull();});

test('topbar indicator names the engine compactly and opens configuration without inference',async()=>{
 const {requests}=setup({engine:'codebuddy',kind:'verified',label:'上次验证通过',verifiedAt:1794600000000,detail:'不是持续联网检测'},false,{topbar:true});
 await screen.findByText('WorkBuddy',{exact:true});const link=screen.getByRole('link',{name:/本地 AI Agent.*上次验证通过/});expect(link.title).toContain('不是持续联网检测');expect(link.getAttribute('data-connection-state')).toBe('verified');fireEvent.click(link);expect(screen.getByRole('heading',{name:'配置页已打开'})).toBeTruthy();expect(requests.every(r=>r.method==='GET')).toBe(true);
});
test('sidebar and topbar share one read and revoke both green lights after a failed refresh',async()=>{
 const {requests,client}=setup({engine:'codex',kind:'verified',label:'上次验证通过',verifiedAt:1794600000000},false,{both:true});
 await screen.findByText('Codex',{selector:'.topbar-local-ai-name'});expect(document.querySelectorAll('[data-connection-state="verified"]')).toHaveLength(2);expect(requests).toHaveLength(1);
 vi.stubGlobal('fetch',vi.fn(async()=>{throw Error('simulated offline');}));await client.refetchQueries({queryKey:localStatusKey('7')});
 expect(await screen.findAllByRole('link',{name:/本地 AI Agent.*状态未确认/,hidden:false})).toHaveLength(2);expect(document.querySelectorAll('[data-connection-state="verified"]')).toHaveLength(0);
});
test('guest topbar cannot claim a verified connection or request an engine probe',()=>{
 const {requests}=setup(null,false,{topbar:true,account:'guest'});expect(screen.getByRole('link',{name:/本地 AI Agent.*登录后配置/})).toBeTruthy();expect(document.querySelector('[data-connection-state="verified"]')).toBeNull();expect(requests).toHaveLength(0);
});

test.each([['claude','Claude Code'],['deepseek','DeepSeek']])('new engine %s is identified in both lamps with its billing source',async(engine,name)=>{
 const {requests}=setup({engine,kind:'untested',label:'未测试',billingSource:'本人 API 余额',detail:'没有实际测试回执'},false,{both:true});
 const links=await screen.findAllByRole('link',{name:new RegExp(name)});expect(links).toHaveLength(2);expect(links.every(l=>l.title.includes('本人 API 余额'))).toBe(true);expect(document.querySelector('[data-connection-state="verified"]')).toBeNull();expect(requests).toHaveLength(1);
});
