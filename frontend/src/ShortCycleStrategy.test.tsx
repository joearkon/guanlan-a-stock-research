// @vitest-environment jsdom
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor,within} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {MemoryRouter} from 'react-router-dom';
import {PreferenceProvider} from './personal-preferences';import StrategyLab from './StrategyLab';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const day='2026-11-26',model='a'.repeat(64),pattern={day,status:'ready',signals:{'second-wave':true,'high-divergence':false},from:'2026-11-06',observations:15,volumeRatio3:1.8,ma5:9.6,secondWave:{stage:'confirmation',start:{day:'2026-11-06',price:10},peak:{day:'2026-11-12',price:15},trough:{day:'2026-11-20',price:9},risePct:50,drawdownPct:40,reboundPct:18,resistance:10,referenceLow:{price:9},restartDay:day,span:15}};
const data={day,mode:'close',model,criteria:{mode:'close',structure:'second-wave'},source:'共享收盘',universe:5571,counts:{matched:1,missing:99,unmet:5471},total:1,offset:0,next:null,pattern15:{status:'ready',attached:5472,missing:99,expectedRows:5571,source:'TuShare stk_factor_pro',parameters:{version:'short-cycle-v1'}},rows:[{code:'600001',name:'二波样本',price:10.6,pct:3,board:'main',pattern15:pattern}]};
function mount(){const client=new QueryClient({defaultOptions:{queries:{retry:false,staleTime:Infinity}}});client.setQueryData(['resource','/api/data/free?view=watch'],{asof:day});const reads:string[]=[];vi.stubGlobal('fetch',vi.fn(async(url:any)=>{reads.push(String(url));return Response.json(String(url).includes('structureDetail=')?{code:'600001',day,model,pattern15:pattern,patternParameters:{version:'short-cycle-v1'}}:data);}));render(<QueryClientProvider client={client}><MemoryRouter><PreferenceProvider account="qa55"><StrategyLab/></PreferenceProvider></MemoryRouter></QueryClientProvider>);return reads;}
test('new playbooks live in strategy research, do not inherit the high-board pool and read only after confirmation',async()=>{
 const reads=mount();fireEvent.click(screen.getByRole('button',{name:'前强二波'}));expect(screen.getAllByText(/一波上涨.*深度回撤.*再次上攻/).length).toBeGreaterThan(0);expect(screen.queryByLabelText('最低连续板')).toBeNull();expect(reads).toEqual([]);
 fireEvent.click(screen.getByRole('button',{name:'确认规则并读取候选'}));await screen.findByRole('button',{name:'查看二波样本行情详情'});expect(reads[0]).toContain('structure=second-wave');expect(reads.every(x=>!x.includes('high-board'))).toBe(true);expect(screen.getByText(/全市场.*5571/)).toBeTruthy();expect(screen.getByRole('status').textContent).toContain('缺数据 99');
 fireEvent.click(screen.getByRole('button',{name:'查看二波样本战法依据'}));const dialog=await screen.findByRole('dialog',{name:'前强二波 · 战法依据'});await within(dialog).findByText('15.00');expect(reads.at(-1)).toContain('model='+model);expect(within(dialog).getByText(/不证明资金净流入/)).toBeTruthy();
});
test('switching to high-position divergence cancels prior confirmation and does not impose consecutive limits',async()=>{
 const reads=mount();fireEvent.click(screen.getByRole('button',{name:'前强二波'}));fireEvent.click(screen.getByRole('button',{name:'确认规则并读取候选'}));await screen.findByRole('button',{name:'查看二波样本行情详情'});const n=reads.length;
 fireEvent.click(screen.getByRole('button',{name:'高位分歧观察'}));expect(screen.queryByRole('button',{name:'查看二波样本行情详情'})).toBeNull();expect(reads.length).toBe(n);expect(screen.getAllByText(/不限连板/).length).toBeGreaterThan(0);fireEvent.click(screen.getByRole('button',{name:'确认规则并读取候选'}));await waitFor(()=>expect(reads.at(-1)).toContain('structure=high-divergence'));
});
test('short history explains fifteen-session preparation without calling it an empty market',async()=>{
 mount();vi.stubGlobal('fetch',vi.fn(async()=>Response.json({...data,pattern15:{status:'preparing',availableSessions:10,targetSessions:15},rows:[],total:0,counts:{matched:0,missing:5571,unmet:0}})));fireEvent.click(screen.getByRole('button',{name:'前强二波'}));fireEvent.click(screen.getByRole('button',{name:'确认规则并读取候选'}));await screen.findByText(/15日战法资料准备中/);expect(screen.getByText(/10.*15.*不代表没有符合/)).toBeTruthy();
});
test('a failed explicit refresh keeps the prior dated candidates visible',async()=>{
 mount();fireEvent.click(screen.getByRole('button',{name:'前强二波'}));fireEvent.click(screen.getByRole('button',{name:'确认规则并读取候选'}));await screen.findByRole('button',{name:'查看二波样本行情详情'});vi.stubGlobal('fetch',vi.fn(async()=>Response.json({error:'fixture failure'},{status:503})));
 fireEvent.click(screen.getByRole('button',{name:'确认规则并读取候选'}));await screen.findByText(/读取失败，保留原日期与候选/);expect(screen.getByRole('button',{name:'查看二波样本行情详情'})).toBeTruthy();expect(screen.getByText(/上次有效结果/)).toBeTruthy();
});

test('changing the shape window revokes confirmation and reads ten sessions only after confirmation',async()=>{
 const reads=mount();fireEvent.click(screen.getByRole('button',{name:'前强二波'}));fireEvent.click(screen.getByRole('button',{name:'确认规则并读取候选'}));await screen.findByRole('button',{name:'查看二波样本行情详情'});const n=reads.length;
 fireEvent.change(screen.getByLabelText('形态窗口'),{target:{value:'10'}});expect(screen.queryByRole('button',{name:'查看二波样本行情详情'})).toBeNull();expect(reads.length).toBe(n);
 vi.stubGlobal('fetch',vi.fn(async(url:any)=>{reads.push(String(url));return Response.json({...data,structureWindow:10,criteria:{...data.criteria,structureWindow:'10'},pattern15:{...data.pattern15,requiredSessions:10}});}));
 fireEvent.click(screen.getByRole('button',{name:'确认规则并读取候选'}));await screen.findByRole('button',{name:'查看二波样本行情详情'});expect(reads.at(-1)).toContain('structureWindow=10');expect(screen.getByText(/最近10个已完成交易日/)).toBeTruthy();
});

test('historical results require an explicit action and retain their original date',async()=>{
 mount();const calls:string[]=[];vi.stubGlobal('fetch',vi.fn(async(url:any)=>{calls.push(String(url));const historic=String(url).includes('history=complete');return Response.json({...data,day:historic?'2026-11-25':day,requestedDay:day,historical:historic,latestComplete:{day:'2026-11-25',model:'b'.repeat(64),sessions:15},pattern15:historic?data.pattern15:{status:'preparing',availableSessions:14},rows:historic?data.rows:[],total:historic?1:0});}));
 fireEvent.click(screen.getByRole('button',{name:'前强二波'}));fireEvent.click(screen.getByRole('button',{name:'确认规则并读取候选'}));const button=await screen.findByRole('button',{name:'查看最近完整交易日（2026-11-25）'});expect(calls.every(x=>!x.includes('history='))).toBe(true);fireEvent.click(button);await screen.findByText(/历史收盘.*2026-11-25.*不是今日候选/);expect(calls.at(-1)).toContain('history=complete');expect(screen.getByRole('button',{name:'返回最新交易日'})).toBeTruthy();
});
