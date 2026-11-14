// @vitest-environment jsdom
import{test,expect,vi,afterEach}from'vitest';import{render,screen,fireEvent,cleanup,waitFor}from'@testing-library/react';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import{PreferenceProvider}from'./personal-preferences';import LocalAI from'./LocalAI';
afterEach(()=>{cleanup();vi.unstubAllGlobals();sessionStorage.clear();});
function fixture(){const reads:string[]=[],writes:any[]=[];let selection:any=null,revision:any=null,probeEngine='';
 vi.stubGlobal('fetch',vi.fn(async(url:any,init:any={})=>{const p=String(url);if(init.method==='POST'){const b=JSON.parse(init.body);writes.push({url:p,body:b});if(p.endsWith('/reset')){selection=null;revision='fresh-revision';return Response.json({selection,setupRevision:revision});}if(p.endsWith('/probes')){probeEngine=b.engine;return Response.json({id:b.turnId,status:'queued'});}if(p.endsWith('/settings')){selection={engine:b.engine,probeId:b.probeId};return Response.json({selection});}}
 reads.push(p);if(p.includes('/engines?')&&p.includes('engine=')){const id=new URL(p,'http://localhost').searchParams.get('engine');return Response.json({engines:[{id,name:id,available:id!=='claude',installed:id!=='claude',status:id==='claude'?'not_installed':'ready',version:id==='claude'?null:'fixture-1',detail:id==='claude'?'本机未检测到 Claude Code':'环境已就绪',billingSource:'本人供方额度'}]});}
 if(p.includes('/engines'))return Response.json({engines:['codex','codebuddy','claude','deepseek'].map(id=>({id,status:'unchecked'}))});
 if(p.includes('/jobs/'))return Response.json({id:p.split('/').at(-1),engine:probeEngine,status:'complete',result:{answer:'连接测试夹具'}});
 if(p.endsWith('/status'))return Response.json({engine:selection?.engine||null,kind:selection?'verified':'unconfigured',label:selection?'上次验证通过':'未配置'});
 if(p.endsWith('/deepseek'))return Response.json({configured:false});return Response.json({selection,setupRevision:revision});
 }));
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}}),view=render(<QueryClientProvider client={client}><PreferenceProvider account="55"><LocalAI/></PreferenceProvider></QueryClientProvider>);return{reads,writes,reopen:()=>view.rerender(<QueryClientProvider client={client}><PreferenceProvider account="55"><LocalAI key="reopened"/></PreferenceProvider></QueryClientProvider>)};
}
test('first use shows choices without scanning and choosing Claude detects no other provider',async()=>{
 const f=fixture();await screen.findByRole('radio',{name:'使用 Claude Code'});await waitFor(()=>expect(screen.queryByText('正在读取配置…')).toBeNull());
 expect(screen.getAllByRole('radio').every(e=>!(e as HTMLInputElement).checked)).toBe(true);expect(f.reads.some(p=>p.includes('engine='))).toBe(false);expect(f.writes).toHaveLength(0);
 fireEvent.click(screen.getByRole('radio',{name:'使用 Claude Code'}));await screen.findByText('本机未检测到 Claude Code');
 expect(f.reads.filter(p=>p.includes('engine=')).every(p=>p.includes('engine=claude'))).toBe(true);expect(f.writes).toHaveLength(0);
 fireEvent.click(screen.getByRole('radio',{name:'使用 Codex'}));await screen.findByText('环境已就绪');
 expect(f.reads.filter(p=>p.includes('engine=')).map(p=>new URL(p,'http://localhost').searchParams.get('engine'))).toEqual(['claude','codex']);
 fireEvent.click(screen.getByRole('button',{name:'测试并连接'}));await screen.findByText('连接已验证并保存');expect(f.writes.map(p=>p.url)).toEqual(['/api/local-ai/probes','/api/local-ai/settings']);expect(f.writes[0].body.engine).toBe('codex');
});
test('reset returns to an unselected first-use flow and never silently reactivates an old probe',async()=>{
 const f=fixture();await screen.findByRole('radio',{name:'使用 Codex'});fireEvent.click(screen.getByRole('radio',{name:'使用 Codex'}));await screen.findByText('环境已就绪');fireEvent.click(screen.getByRole('button',{name:'测试并连接'}));await screen.findByText('连接已验证并保存');
 fireEvent.click(screen.getByRole('button',{name:'重新初始化 AI'}));expect(screen.getByText(/保留研究、持仓/)).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'确认断开并初始化'}));
 await screen.findByText('已断开，重新选择一个 AI 开始。');expect(screen.getAllByRole('radio').every(e=>!(e as HTMLInputElement).checked)).toBe(true);expect(f.writes.map(p=>p.url)).toEqual(['/api/local-ai/probes','/api/local-ai/settings','/api/local-ai/reset']);
});
test('connected setup reopens as a named summary and only exposes choices after an explicit change',async()=>{
 const f=fixture();await screen.findByRole('radio',{name:'使用 Codex'});fireEvent.click(screen.getByRole('radio',{name:'使用 Codex'}));await screen.findByText('环境已就绪');fireEvent.click(screen.getByRole('button',{name:'测试并连接'}));await screen.findByText('连接已验证并保存');
 expect(screen.getByText('当前已配置：Codex')).toBeTruthy();expect(screen.queryByRole('radio')).toBeNull();expect(screen.queryByRole('button',{name:'测试并连接'})).toBeNull();const scans=f.reads.filter(p=>p.includes('engine=')).length;
 f.reopen();await screen.findByText('当前已配置：Codex');expect(screen.queryByRole('radio')).toBeNull();expect(f.reads.filter(p=>p.includes('engine='))).toHaveLength(scans);
 fireEvent.click(screen.getByRole('button',{name:'更换 AI Agent'}));await screen.findByRole('radio',{name:'使用 Claude Code'});fireEvent.click(screen.getByRole('radio',{name:'使用 Claude Code'}));await screen.findByText('本机未检测到 Claude Code');expect(screen.getByText('当前已配置：Codex')).toBeTruthy();expect(f.writes.map(p=>p.url)).toEqual(['/api/local-ai/probes','/api/local-ai/settings']);
});
test('configuration explains which modules use the local Agent versus shared cloud data',async()=>{
fixture();await screen.findByRole('heading',{name:'本地 Harness 使用范围'});expect(screen.getByText('问观澜、AI 盘面点评、个人 AI 研究')).toBeTruthy();expect(screen.getByText(/不是全部离线运行/)).toBeTruthy();expect(screen.getByText('市场数据与平台内容')).toBeTruthy();expect(screen.getByText('账号安全与云端提醒')).toBeTruthy();
});
