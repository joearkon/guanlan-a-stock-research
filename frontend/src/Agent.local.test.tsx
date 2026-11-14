// @vitest-environment jsdom
import {test,expect,vi,afterEach}from'vitest';
import {render,screen,fireEvent,cleanup,act}from'@testing-library/react';
import {QueryClient,QueryClientProvider}from'@tanstack/react-query';
import {MemoryRouter}from'react-router-dom';
import {PreferenceProvider}from'./personal-preferences';import Agent from'./Agent';
const id='95555555-5555-4555-8555-555555555555';
function setup({failed=false,history=false,compact=false,embedded=false,connected=true}={}){
 const requests:any[]=[];
 vi.stubGlobal('matchMedia',()=>({matches:compact,addEventListener(){},removeEventListener(){}}));
 vi.stubGlobal('fetch',vi.fn(async(url:any,init:any={})=>{
  if(init.method==='POST'){requests.push({url,body:JSON.parse(init.body)});return Response.json({id,status:'queued'});}
  if(url==='/api/local-ai/status')return Response.json({engine:connected?'codex':null,kind:connected?'verified':'unconfigured',label:connected?'已连接':'未配置'});
  if(url==='/api/agent/conversations')return Response.json({conversations:history?[{id,title:'历史原生研究'}]:[]});
  if(url==='/api/agent/conversations/'+id)return Response.json({messages:[{id:'a',role:'assistant',content:'本轮用量：供方未提供\n\n保留这行原文。',report:{localHarness:true,engine:'codebuddy',missing:[]}}]});
  return Response.json({id,status:failed?'failed':'complete',stage:failed?'本机任务':'校验已保存回执',stageStatus:failed?'failed':'complete',error:failed?'本机执行失败，未切平台。':null,result:failed?null:{localHarness:true,engine:'codebuddy',answer:'## 已完成研究\n原生内容保留。',asof:'2026-11-13',missing:[],dataSources:[]}});
 }));
 const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});
 render(<QueryClientProvider client={client}><PreferenceProvider account="7"><MemoryRouter initialEntries={[history?'/agent?conversation='+id:'/agent']}><Agent embedded={embedded}/></MemoryRouter></PreferenceProvider></QueryClientProvider>);
 return requests;
}
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();sessionStorage.clear();});
test('a completed native research replaces the stale submitting message with a terminal status',async()=>{
 setup();await screen.findByRole('link',{name:'更换 AI Agent'});vi.spyOn(crypto,'randomUUID').mockReturnValue(id);fireEvent.change(screen.getByLabelText('你的问题'),{target:{value:'研究市场结构'}});fireEvent.click(screen.getByRole('button',{name:'发送提问'}));
 await screen.findByRole('heading',{name:'已完成研究'});await screen.findByText(/本轮已完成，原生回答已保存到本机/);expect(screen.queryByText(/正在提交本机任务/)).toBeNull();
});
test('a failed native research does not retain the stale submitting message',async()=>{
 setup({failed:true});await screen.findByRole('link',{name:'更换 AI Agent'});vi.spyOn(crypto,'randomUUID').mockReturnValue(id);fireEvent.change(screen.getByLabelText('你的问题'),{target:{value:'研究市场结构'}});fireEvent.click(screen.getByRole('button',{name:'发送提问'}));
 await screen.findByText(/本轮未完成，未自动重跑或切换平台/);expect(screen.queryByText(/正在提交本机任务/)).toBeNull();
});
test('native saved history keeps provider prose even when a line resembles an old platform usage footer',async()=>{
 setup({history:true});await screen.findByText('本轮用量：供方未提供',{exact:true});expect(screen.getByText('保留这行原文。',{exact:true})).toBeTruthy();
});

test('research settings are disclosed on demand and the selected options reach one explicit submission',async()=>{
 const requests=setup({compact:true});await screen.findByRole('link',{name:'更换 AI Agent'});expect(screen.queryByRole('combobox',{name:'研究角色'})).toBeNull();
 fireEvent.click(screen.getByLabelText('研究设置'));
 fireEvent.change(screen.getByRole('combobox',{name:'研究角色'}),{target:{value:'legacy'}});fireEvent.click(screen.getByRole('checkbox',{name:'深度思考'}));
 fireEvent.keyDown(screen.getByLabelText('研究设置'),{key:'Escape'});expect(screen.queryByRole('combobox',{name:'研究角色'})).toBeNull();
 expect(requests).toHaveLength(0);vi.spyOn(crypto,'randomUUID').mockReturnValue(id);fireEvent.change(screen.getByLabelText('你的问题'),{target:{value:'核验市场结构'}});fireEvent.click(screen.getByRole('button',{name:'发送提问'}));
 await screen.findByRole('heading',{name:'已完成研究'});expect(requests).toHaveLength(1);expect(requests[0].body).toMatchObject({agentRole:'legacy',deepThinking:false,question:'核验市场结构'});
});
test('question templates only prefill a draft and opening or closing them never submits research',async()=>{
 const requests=setup({compact:true});await screen.findByRole('link',{name:'更换 AI Agent'});fireEvent.click(screen.getByRole('button',{name:'问题模板'}));
 const dialog=await screen.findByRole('dialog',{name:'问题模板'});expect(dialog).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/用擒龙九维给意华股份 002897 做个股评分/}));
 expect((screen.getByLabelText('你的问题') as HTMLTextAreaElement).value).toBe('用擒龙九维给意华股份 002897 做个股评分');expect(requests).toHaveLength(0);
});

test('Enter in a mobile embedded research drawer cannot implicitly submit a paid request',async()=>{
 const requests=setup({compact:true,embedded:true});fireEvent.change(screen.getByLabelText('你的问题'),{target:{value:'这还是草稿'}});
 await act(async()=>{fireEvent.keyDown(screen.getByLabelText('你的问题'),{key:'Enter'});await Promise.resolve();});
 expect(requests).toHaveLength(0);expect((screen.getByLabelText('你的问题') as HTMLTextAreaElement).value).toBe('这还是草稿');
});

test('desktop Enter still submits the explicit draft once',async()=>{
 const requests=setup();await screen.findByRole('link',{name:'更换 AI Agent'});vi.spyOn(crypto,'randomUUID').mockReturnValue(id);fireEvent.change(screen.getByLabelText('你的问题'),{target:{value:'电脑研究草稿'}});
 await act(async()=>{fireEvent.keyDown(screen.getByLabelText('你的问题'),{key:'Enter'});await Promise.resolve();});
 await screen.findByRole('heading',{name:'已完成研究'});expect(requests).toHaveLength(1);expect(requests[0].body.question).toBe('电脑研究草稿');
});

test('workspace and embedded drawer labels point to their own independent inputs',()=>{
 setup();setup({embedded:true});const labels=screen.getAllByText('你的问题',{selector:'label'}) as HTMLLabelElement[];
 expect(labels).toHaveLength(2);expect(labels[0].control).not.toBe(labels[1].control);expect(labels[1].control?.closest('.agent-page.is-embedded')).not.toBeNull();
});
test('without a connected local Agent, the draft and history remain available but no submit path can run AI',async()=>{
 const requests=setup({connected:false,history:true});await screen.findByText('保留这行原文。',{exact:true});fireEvent.change(screen.getByLabelText('你的问题'),{target:{value:'先写草稿，不应提交'}});
 const link=await screen.findByRole('link',{name:'使用自己的 AI Agent'});expect(link.getAttribute('href')).toBe('/local-ai');expect((screen.getByRole('button',{name:'发送提问'})as HTMLButtonElement).disabled).toBe(true);
 fireEvent.keyDown(screen.getByLabelText('你的问题'),{key:'Enter'});fireEvent.submit(document.querySelector('form.agent-composer')!);await act(async()=>{await Promise.resolve();});expect(requests).toHaveLength(0);expect((screen.getByLabelText('你的问题')as HTMLTextAreaElement).value).toBe('先写草稿，不应提交');
});
