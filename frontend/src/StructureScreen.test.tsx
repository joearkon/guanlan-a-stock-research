// @vitest-environment jsdom
import {test,expect,vi,afterEach} from 'vitest';import {render,screen,fireEvent,waitFor,within,cleanup} from '@testing-library/react';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {MemoryRouter} from 'react-router-dom';import StockObservation from './StockObservation';import {PreferenceProvider} from './personal-preferences';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const day='2026-11-17',model='b'.repeat(64),criteria={mode:'close',board:'all',structure:'turning'},evidence={day,status:'ready',signals:{turning:true,breakout:false},baseLow:{day:'2026-10-14',price:10,confirmedOn:'2026-10-16'},higherLow:{day:'2026-11-03',price:10.6,confirmedOn:'2026-11-05'},breakoutLevel:13.2,invalidationLevel:10.6,windowFirstMet:'2026-11-06',firstRecordedAt:'2026-11-18T02:00:00Z',distanceMa5Pct:3.5,ma5:12.2,ma10:11.8};
const data={mode:'close',day,model,criteria,source:'共享收盘快照',universe:5571,total:1,next:null,counts:{matched:1,missing:2,unmet:5568},structure:{status:'ready',day,source:'TuShare stk_factor_pro',version:'low-turn-v1',requiredSessions:60,availableSessions:80,targetSessions:80,expectedRows:5571,readyRows:5569,attached:5569,missing:2},rows:[{code:'600000',name:'结构样本',board:'main',price:12.8,pct:2,structure:evidence}]};
function mount(fetcher:any){vi.stubGlobal('fetch',fetcher);return render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><PreferenceProvider account="qa55"><StockObservation/></PreferenceProvider></MemoryRouter></QueryClientProvider>);}
test('short-cycle conditions display independent fifteen-session evidence even when long history is preparing',async()=>{
 const pattern15={day,status:'ready',signals:{'second-wave':true},volumeRatio3:2,secondWave:{stage:'observation',risePct:40,drawdownPct:30}};
 mount(async(url:any)=>Response.json(String(url).includes('/schemes')?{version:0,schemes:[]}:{...data,criteria:{mode:'close',board:'all',structure:'second-wave'},structure:{status:'preparing'},pattern15:{status:'ready',attached:1,missing:2,expectedRows:3},rows:[{...data.rows[0],pattern15}]}));
 await screen.findByText('二波启动观察');expect(screen.queryByText('结构历史准备中')).toBeNull();expect(screen.getByRole('button',{name:'查看结构样本战法依据'})).toBeTruthy();
});
test('a turning preset explicitly selects completed close and whole-market scope, and only fetches on apply',async()=>{
 const reads:string[]=[];mount(async(url:any)=>{reads.push(String(url));return Response.json(String(url).includes('/schemes')?{version:0,schemes:[]}:data);});await screen.findByRole('button',{name:'查看结构样本行情详情'});fireEvent.click(screen.getByRole('button',{name:'盘中快照'}));const before=reads.length;fireEvent.click(screen.getByRole('button',{name:'转强观察（测试）'}));expect(reads).toHaveLength(before);expect(screen.getByRole('button',{name:'盘后收盘'}).getAttribute('aria-pressed')).toBe('true');fireEvent.click(screen.getByRole('button',{name:'应用筛选'}));await waitFor(()=>expect(reads.at(-1)).toContain('structure=turning'));expect(reads.at(-1)).toContain('board=all');expect(reads.at(-1)).toContain('mode=close');
});
test('structure evidence is read from the pinned model and distinguishes replay from actual first recording',async()=>{
 const reads:string[]=[];mount(async(url:any)=>{const u=String(url);reads.push(u);return Response.json(u.includes('/schemes')?{version:0,schemes:[]}:u.includes('structureDetail=')?{code:'600000',day,model,status:'ready',source:'TuShare stk_factor_pro',structure:evidence,parameters:{version:'low-turn-v1'}}:data);});await screen.findByRole('button',{name:'查看结构样本行情详情'});expect(screen.getAllByRole('columnheader')[1].textContent).toBe('结构 / 依据');fireEvent.click(screen.getByRole('button',{name:'查看结构样本结构依据'}));const dialog=await screen.findByRole('dialog',{name:'低位转强 · 结构依据'});await within(dialog).findByText('13.20');expect(reads.at(-1)).toContain('model='+model);expect(reads.at(-1)).toContain('structureDetail=600000');expect(within(dialog).getByText('本窗口逐日回放首次满足')).toBeTruthy();expect(within(dialog).getByText('平台首次收录（北京时间）')).toBeTruthy();expect(within(dialog).getByText('2026-11-06')).toBeTruthy();expect(within(dialog).getByText(/2026.*11.*18/)).toBeTruthy();fireEvent.click(within(dialog).getByRole('button',{name:'关闭抽屉'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(screen.getByRole('button',{name:'查看结构样本行情详情'})).toBeTruthy();
});
test('incomplete shared history is displayed as preparation, not zero matching patterns',async()=>{
 mount(async(url:any)=>Response.json(String(url).includes('/schemes')?{version:0,schemes:[]}:{...data,structure:{...data.structure,status:'preparing',availableSessions:24,readyRows:0,attached:0,missing:5571},rows:[],total:0,counts:{matched:0,missing:5571,unmet:0}}));await screen.findByText(/结构历史准备中/);expect(screen.getByText(/24.*80/)).toBeTruthy();expect(screen.getByText(/不代表全市场没有符合结构/)).toBeTruthy();
});

test('compact structure receipt keeps cutoff and missing coverage visible while expanding methodology on request',async()=>{
 mount(async(url:any)=>Response.json(String(url).includes('/schemes')?{version:0,schemes:[]}:data));await screen.findByRole('button',{name:'查看结构样本行情详情'});
 const receipt=screen.getByRole('status'),details=receipt.querySelector('details');
 expect(receipt.textContent).toContain('2026-11-17');expect(receipt.textContent).toContain('缺数据 2');
 expect(details).toBeTruthy();expect(details?.open).toBe(false);
 fireEvent.click(within(receipt).getByText('结构口径与来源'));expect(details?.textContent).toContain('不倒填');
});
