// @vitest-environment jsdom
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import MarketCommentary from './MarketCommentary';
const id='91111111-1111-4111-8111-111111111111',oldId='92222222-2222-4222-8222-222222222222';
const answer='## 盘面观察\n保留供方原生回答，数据不足之处待核验。';
const result=(engine='codebuddy',asof='2026-11-13')=>({localHarness:true,outputMode:'native',answer,engine,asof,missing:[],dataSources:[{source:'观澜共享收盘快照',dataDate:asof,status:'provided'}],diagnostics:{tokens:{total:null},engineRuns:1}});
const job=(value:any=result(),status='complete')=>({id,turnId:id,status,question:'盘面点评',engine:value?.engine||'codebuddy',result:status==='complete'?value:null,error:status==='failed'?'本机引擎未完成；未切换平台 AI。':null,stage:'本机任务',createdAt:1794556800000,attempts:1});
function setup({restored=false,failed=false,value=result(),previous=false,engine='codebuddy',connected=true}={}){
 if(restored)sessionStorage.setItem('guanlan.market-commentary:7:2026-11-13',id);
 if(previous)sessionStorage.setItem('guanlan.market-commentary:7:2026-11-13:complete',oldId);
 const writes:any[]=[];let current=job(value,failed?'failed':'complete');
 vi.stubGlobal('fetch',vi.fn(async(url:any,init:any={})=>{
  if(init.method==='POST'){writes.push({url,body:JSON.parse(init.body)});return Response.json(url.endsWith('revalidate')?current:{id,status:'queued'});}
  if(url==='/api/me')return Response.json({user:{id:7},localHarness:true});
  if(url==='/api/local-ai/settings')return Response.json({selection:{engine},platformFallback:false});
  if(url==='/api/local-ai/status')return Response.json({kind:connected?'verified':'unconfigured',engine:connected?engine:null,label:connected?'已连接':'未配置'});
  if(url.endsWith(oldId))return Response.json({...job(),id:oldId});
  if(url.endsWith(id))return Response.json(current);
  return Response.json({error:'unexpected endpoint'},{status:404});
 }));
 const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});
 const view=render(<QueryClientProvider client={client}><MarketCommentary day="2026-11-13"/></QueryClientProvider>);
 return {writes,client,view,complete(){current=job();}};
}
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();sessionStorage.clear();});
test.each(['codex','codebuddy'])('native %s commentary renders without the platform fixed-report contract',async engine=>{
 const f=setup({restored:true,value:result(engine),engine});
 await screen.findByRole('heading',{name:'盘面观察'});
 expect(screen.getByText('保留供方原生回答，数据不足之处待核验。')).toBeTruthy();
 expect(screen.queryByText(/未返回该日期的完整固定点评/)).toBeNull();
 expect(screen.getByText(/不使用平台 AI 额度/)).toBeTruthy();
 expect(f.writes).toHaveLength(0);
});
test('only explicit generation submits one native request, without a client engine override',async()=>{
 const f=setup();await screen.findByRole('button',{name:'生成盘面点评'});
 await waitFor(()=>expect((screen.getByRole('button',{name:'生成盘面点评'}) as HTMLButtonElement).disabled).toBe(false));
 vi.spyOn(crypto,'randomUUID').mockReturnValue(id);
 fireEvent.click(screen.getByRole('button',{name:'生成盘面点评'}));
 await screen.findByRole('heading',{name:'盘面观察'});
 expect(f.writes).toHaveLength(1);expect(f.writes[0].url).toBe('/api/agent/jobs');
 expect(f.writes[0].body).toMatchObject({turnId:id,outputMode:'native',context:{asof:'2026-11-13',section:'market-commentary-v1'}});
 expect(f.writes[0].body.engine).toBeUndefined();
 f.view.unmount();render(<QueryClientProvider client={f.client}><MarketCommentary day="2026-11-13"/></QueryClientProvider>);
 await screen.findByRole('heading',{name:'盘面观察'});expect(f.writes).toHaveLength(1);
});
test('failure retains the prior native answer and receipt recovery never submits a new job',async()=>{
 const f=setup({restored:true,failed:true,previous:true});
 await screen.findByRole('heading',{name:'盘面观察'});expect(screen.getByText(/下方保留上次/)).toBeTruthy();
 f.complete();fireEvent.click(screen.getByRole('button',{name:'核对已保存回执（不重新生成）'}));
 await screen.findByText(/已恢复原模型回执/);
 expect(f.writes.map(x=>x.url)).toEqual(['/api/agent/jobs/'+id+'/revalidate']);
});
test('a completed answer for another day is not presented as the selected day commentary',async()=>{
 const f=setup({restored:true,value:result('codex','2026-11-12')});
 await screen.findByText(/日期不匹配/);expect(screen.queryByRole('heading',{name:'盘面观察'})).toBeNull();expect(f.writes).toHaveLength(0);
});
test('an empty native result is not published as a successful commentary',async()=>{
 setup({restored:true,value:{...result(),answer:'  '}});await screen.findByText(/没有可显示的本机原生点评/);expect(screen.queryByRole('heading',{name:'盘面观察'})).toBeNull();
});
test('commentary cannot generate without a connected local Agent but can still display a saved answer',async()=>{
 const f=setup({connected:false,restored:true});await screen.findByRole('heading',{name:'盘面观察'});expect(await screen.findByRole('link',{name:'使用自己的 AI Agent'})).toBeTruthy();expect((screen.getByRole('button',{name:'重新生成点评'})as HTMLButtonElement).disabled).toBe(true);fireEvent.click(screen.getByRole('button',{name:'重新生成点评'}));expect(f.writes).toHaveLength(0);
});
