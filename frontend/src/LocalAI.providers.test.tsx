// @vitest-environment jsdom
import {test,expect,vi,afterEach}from'vitest';import {render,screen,fireEvent,cleanup,waitFor}from'@testing-library/react';import {QueryClient,QueryClientProvider}from'@tanstack/react-query';import {PreferenceProvider}from'./personal-preferences';import LocalAI from'./LocalAI';
afterEach(()=>{cleanup();vi.unstubAllGlobals();sessionStorage.clear();});
function setup(uncertain=false){const writes:any[]=[];let configured=false;
 vi.stubGlobal('fetch',vi.fn(async(url:any,init:any={})=>{
  if(init.method==='POST'){const body=JSON.parse(init.body);writes.push({url,body});if(url==='/api/local-ai/deepseek'){configured=true;return Response.json({configured:true});}if(uncertain)throw Error('simulated lost acknowledgement');return Response.json({error:'供方连接未确认，原配置保留'},{status:409});}
  if(String(url).includes('/api/agent/jobs/'))return Response.json({error:'状态读取未确认'},{status:503});
  if(String(url).includes('/engines'))return Response.json({engines:[{id:'codex',name:'Codex',version:'0.169.0',available:true},{id:'claude',name:'Claude Code',version:null,installed:false,available:false,status:'not_installed',detail:'未安装 Claude Code'},{id:'deepseek',name:'DeepSeek',version:'deepseek-flash',available:configured,billingSource:'DeepSeek 本人 API 余额（含联网工具费用）'}]});
  if(url==='/api/local-ai/deepseek')return Response.json({configured,model:'deepseek-flash',storage:'windows_dpapi_current_user'});
  if(url==='/api/local-ai/status')return Response.json({kind:'untested',label:'未测试',engine:'codex'});
  return Response.json({selection:{engine:'codex'}});
 }));
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><PreferenceProvider account="55"><LocalAI/></PreferenceProvider></QueryClientProvider>);return writes;
}
test('saving a local DeepSeek key clears the input and never starts or activates a model by itself',async()=>{
 const writes=setup();await screen.findByRole('button',{name:'更换 AI Agent'});fireEvent.click(screen.getByRole('button',{name:'更换 AI Agent'}));await screen.findByLabelText('使用 DeepSeek');fireEvent.click(screen.getByLabelText('使用 DeepSeek'));
 const key=await screen.findByLabelText('DeepSeek API Key');expect((key as HTMLInputElement).type).toBe('password');fireEvent.change(key,{target:{value:'sk-ui-placeholder'}});fireEvent.click(screen.getByRole('button',{name:'保存 DeepSeek 密钥'}));
 await screen.findByText(/密钥已在本机加密保存/);expect((key as HTMLInputElement).value).toBe('');expect(writes.map(x=>x.url)).toEqual(['/api/local-ai/deepseek']);expect(screen.getByText('当前已配置：Codex')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'测试并连接'}));await screen.findByRole('alert');await waitFor(()=>expect(writes).toHaveLength(2));expect(writes[1].body.engine).toBe('deepseek');expect(screen.getByText('当前已配置：Codex')).toBeTruthy();
});
test('uncertain connection submission retains its original id and does not create a replacement model request',async()=>{
 const writes=setup(true);await screen.findByRole('button',{name:'更换 AI Agent'});fireEvent.click(screen.getByRole('button',{name:'更换 AI Agent'}));await screen.findByLabelText('使用 Codex');fireEvent.click(screen.getByLabelText('使用 Codex'));await screen.findByText('0.169.0');fireEvent.click(screen.getByRole('button',{name:'测试并连接'}));
 await screen.findByText(/提交结果未确认/);expect(writes).toHaveLength(1);const saved=JSON.parse(sessionStorage.getItem('guanlan.local-ai.probe.55')||'null');expect(saved.id).toBe(writes[0].body.turnId);
 expect(await screen.findByRole('button',{name:'核对原任务'})).toBeTruthy();expect(writes).toHaveLength(1);
});
test('missing Claude CLI shows official personal login guidance and cannot start a probe',async()=>{
 const writes=setup();await screen.findByRole('button',{name:'更换 AI Agent'});fireEvent.click(screen.getByRole('button',{name:'更换 AI Agent'}));await screen.findByLabelText('使用 Claude Code');fireEvent.click(screen.getByLabelText('使用 Claude Code'));
 expect(await screen.findByText('claude auth login')).toBeTruthy();expect((screen.getByRole('button',{name:'测试并连接'})as HTMLButtonElement).disabled).toBe(true);expect(writes).toHaveLength(0);
});
