// @vitest-environment jsdom
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import LiveEventStream from './LiveEventStream';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const model='a'.repeat(64),member='b'.repeat(64),events=[{code:'000001',name:'异动甲',kind:'急拉',time:'20261116143000',price:10,change_pct:2.1,span_sec:180},{code:'000002',name:'异动乙',kind:'急跌',time:'20261116142900',price:9,change_pct:-1.5,span_sec:180}];
const group=(name:string,type:string,pct:number|null)=>({provider:type==='industry'?'sw':'ths',code:type==='industry'?'SW1':'T1',name,type,pct,quoteMetric:'member_median',quoteStatus:pct==null?'date_mismatch':'ok',covered:10,memberCount:10,classificationDate:'2026-11-16',classificationFetchedAt:'2026-11-16T01:00:00Z'});
const data=(patch:any={})=>({requestedDay:'2026-11-16',quoteDay:'2026-11-16',mode:'live',collectedAt:'2026-11-16T06:39:00Z',model,groupsVersion:member,status:'ok',stale:false,timeBasis:'latest_snapshot_not_event',classificationBasis:'current_directory_not_historical_membership',rows:{'000001':{industryStatus:'ok',industry:group('行业甲','industry',-1.25),boards:[group('板块甲','board',2.5)],additionalBoards:0},'000002':{industryStatus:'missing',industry:null,boards:[],additionalBoards:0}},...patch});
function view(list=events){const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});const mounted=render(<QueryClientProvider client={client}><div className="monitor-page"><LiveEventStream events={list} onSelect={()=>{}} {...{boardContextDay:'2026-11-16'}}/></div></QueryClientProvider>);return {client,...mounted};}
test('visible events share one batch and display source-aware board percentages without changing the trigger window',async()=>{
 const calls:string[]=[];vi.stubGlobal('fetch',async url=>{calls.push(String(url));return Response.json(data());});view();
 expect(await screen.findByRole('button',{name:/查看行业甲板块详情/})).toBeTruthy();expect(screen.getByText('-1.25%')).toBeTruthy();expect(screen.getByText('+2.50%')).toBeTruthy();expect(screen.getByText((_,el)=>el?.tagName==='P'&&!!el.textContent?.includes('180秒变动 +2.10%'))).toBeTruthy();expect(screen.getAllByText(/非事件时点/).length).toBeGreaterThan(0);expect(screen.getByText(/成分股中位涨幅/)).toBeTruthy();expect(screen.getAllByText(/行业归属未核验/).length).toBeGreaterThan(0);
 await waitFor(()=>expect(calls).toHaveLength(1));expect(new URL(calls[0],'https://x').searchParams.get('codes')).toBe('000001,000002');
});
test('board click opens the existing drawer pinned to the same quote and membership model',async()=>{
 const calls:string[]=[];vi.stubGlobal('fetch',async url=>{calls.push(String(url));if(String(url).includes('event-context'))return Response.json(data());return new Promise(()=>{});});view();fireEvent.click(await screen.findByRole('button',{name:/查看行业甲板块详情/}));expect(await screen.findByRole('dialog',{name:'行业甲 · 板块详情'})).toBeTruthy();await waitFor(()=>expect(calls.some(u=>u.includes('/api/data/stock-observation?')&&u.includes('model='+model)&&u.includes('groupCode=SW1'))).toBe(true));
});
test('board drawers release the page after close and can be reopened repeatedly',async()=>{
 vi.stubGlobal('fetch',async url=>String(url).includes('event-context')?Response.json(data()):new Promise(()=>{}));view();const button=await screen.findByRole('button',{name:/查看行业甲板块详情/});
 for(let i=0;i<2;i++){fireEvent.click(button);const dialog=await screen.findByRole('dialog',{name:'行业甲 · 板块详情'});fireEvent.click(dialog.querySelector('[aria-label="关闭抽屉"]')!);await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull(),{timeout:1000});expect(document.body.style.pointerEvents).not.toBe('none');}
});
test('different-day percentages stay missing and current affiliation is not presented as historical membership',async()=>{
 const d=data();d.quoteDay='2026-11-17';d.rows['000001'].industry=group('行业甲','industry',null);d.rows['000001'].boards=[group('板块甲','board',null)];vi.stubGlobal('fetch',async()=>Response.json(d));view();await screen.findByRole('button',{name:/查看行业甲板块详情/});expect(screen.getAllByText(/缺该日快照/).length).toBe(2);expect(screen.queryByText('+2.50%')).toBeNull();expect(screen.getByText(/当前目录归属/)).toBeTruthy();
});
test('context failure leaves original events and evidence actions usable and never substitutes zeros',async()=>{
 vi.stubGlobal('fetch',async()=>Response.json({error:'context unavailable'},{status:503}));view();expect(await screen.findByText(/板块资料读取失败/)).toBeTruthy();expect(screen.getByRole('button',{name:'查看异动甲急拉触发依据'})).toBeTruthy();expect(screen.getByText('异动甲 · 急拉')).toBeTruthy();expect(screen.queryByText('+0.00%')).toBeNull();
});
test('an explicit refresh failure retains the last valid snapshot and clearly reports it',async()=>{
 let count=0;vi.stubGlobal('fetch',async()=>++count===1?Response.json(data()):Response.json({error:'temporarily unavailable'},{status:503}));view();await screen.findByText('+2.50%');fireEvent.click(screen.getByRole('button',{name:'更新板块快照'}));await screen.findByText(/更新失败，保留上次板块快照/);expect(screen.getByText('+2.50%')).toBeTruthy();expect(screen.getByText('异动甲 · 急拉')).toBeTruthy();
});
test('one shared snapshot note applies to the entire stream instead of repeating on every event',async()=>{
 const d=data();d.rows['000002']=d.rows['000001'];vi.stubGlobal('fetch',async()=>Response.json(d));view();
 await screen.findAllByRole('button',{name:'查看行业甲板块详情'});
 expect(screen.getAllByText(/11-16 14:39.*非事件时点/)).toHaveLength(1);
 expect(screen.getByRole('note',{name:'板块快照时间口径'}).textContent).toContain('11-16 14:39');
 expect(screen.getAllByRole('complementary',{name:'行业与板块上下文'})).toHaveLength(2);
});
