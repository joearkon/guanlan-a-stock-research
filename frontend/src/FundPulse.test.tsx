// @vitest-environment jsdom
import {afterEach,expect,test,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {PreferenceProvider} from './personal-preferences';
import FundPulse,{FundPulsePanel} from './FundPulse';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const row={id:'1:600519',code:'600519',name:'贵州茅台',net:5000000,pulse:-100000,pct:1.3,missing:[]};
const data:any={day:'2026-11-16',provider:'eastmoney',kind:'stock',version:'qa-v1',captured_at:'2026-11-16T02:05:00Z',completed_at:'2026-11-16T02:06:00Z',anchor:{source_at:'2026-11-16T02:06:00Z'},interval_seconds:300,coverage:{received:5929,expected:5929,complete:true},ranks:{inflow:[row],outflow:[],pulseIn:[],pulseOut:[row]},missing_count:1,missing:[{...row,id:'0:000001',name:'缺口样本',code:'000001',net:null,missing:['net']}],ledger:{days:['2026-11-09','2026-11-10','2026-11-11','2026-11-12','2026-11-13'],missing_days:['2026-11-10'],rows:[{...row,inflow_days:2,outflow_days:1,net:null,recorded_net:5000000}]},checkpoints:[]};
test('daily ranks and interval pulse are separate with source time and capture time explicitly distinguished',()=>{
 render(<FundPulsePanel data={data}/>);
 expect(screen.getByText('当日主力净额 / 万元')).toBeTruthy();expect(screen.getByText('+500.00')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'资金脉冲'}));fireEvent.click(screen.getByRole('button',{name:'流出'}));
 expect(screen.getByText('相邻采样净额变化 / 万元')).toBeTruthy();expect(screen.getByText('-10.00')).toBeTruthy();
 expect(screen.getByText(/不等于当日累计/)).toBeTruthy();expect(screen.getByText(/采集窗口/)).toBeTruthy();
});
test('ledger retains missing days and partial total, never renders missing as zero or fabricates high-low rotation',()=>{
 render(<FundPulsePanel data={data}/>);fireEvent.click(screen.getByRole('button',{name:'近5日台账'}));
 expect(screen.getByText(/缺档：2026-11-10/)).toBeTruthy();expect(screen.getByText('已收录 +500.00')).toBeTruthy();
 expect(screen.getByText(/不生成高低切标签/)).toBeTruthy();
});
test('checkpoint buttons explicitly identify missing archives, not relabel current data as past snapshots',()=>{
 render(<FundPulsePanel data={data}/>);fireEvent.click(screen.getByRole('button',{name:'时点快照'}));
 expect(screen.getAllByText('未留档').length).toBe(3);expect(screen.queryByText('贵州茅台')).toBeNull();
});
test('failed refresh preserves old rows and requires explicit refresh, source-unqualified has no rankings',()=>{
 const r=render(<FundPulsePanel data={data} error="读取失败"/>);expect(screen.getByText('贵州茅台')).toBeTruthy();expect(screen.getByRole('status').textContent).toContain('保留');
 r.rerender(<FundPulsePanel data={{status:'pending_source_validation'}}/>);expect(screen.queryByText('贵州茅台')).toBeNull();expect(screen.getByText(/盘中源验收中/)).toBeTruthy();
});
test('pending validation keeps each feature explorable without exposing candidate rankings',()=>{
 render(<FundPulsePanel data={{...data,status:'pending_source_validation'}}/>);
 expect(screen.getByText('数据验证中')).toBeTruthy();
 expect(screen.queryByText('贵州茅台')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'资金脉冲'}));
 expect(screen.getByText(/相邻有效采样不足/)).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'近5日台账'}));
 expect(screen.getByText(/不补造历史金额或上榜次数/)).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'时点快照'}));
 expect(screen.getAllByText('待验收').length).toBe(3);
 expect(screen.getByText(/11:30/)).toBeTruthy();expect(screen.getByText(/15:05/)).toBeTruthy();
 expect(screen.queryByRole('table')).toBeNull();
});
test('pending validation exposes source and time definitions rather than an empty loading screen',()=>{
 render(<FundPulsePanel data={{status:'pending_source_validation'}}/>);
 fireEvent.click(screen.getByText('口径、缺口与观察标签'));
 expect(screen.getByText(/不等同于真实新增资金/)).toBeTruthy();
 expect(screen.getByText(/北京时间/)).toBeTruthy();
 expect(screen.queryByText(/正在读取共享资金资料/)).toBeNull();
});
test('preview release does not query unpublished API or render previously cached market values',async()=>{
 const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
 client.setQueryData(['fund-pulse','qa-pulse','stock'],data);
 const requests:string[]=[];
 vi.stubGlobal('fetch',async(input:any)=>{requests.push(String(input));return new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});});
 render(<PreferenceProvider account="qa-pulse"><QueryClientProvider client={client}><FundPulse preview/></QueryClientProvider></PreferenceProvider>);
 await act(async()=>{await new Promise(r=>setTimeout(r,15));});
 expect(screen.getByText('数据验证中')).toBeTruthy();expect(screen.queryByText('贵州茅台')).toBeNull();
 expect(requests).toEqual([]);
 fireEvent.click(screen.getByRole('button',{name:'行业'}));
 await act(async()=>{await new Promise(r=>setTimeout(r,15));});
 expect(requests).toEqual([]);expect(screen.getByRole('button',{name:'行业'}).getAttribute('aria-pressed')).toBe('true');
 client.clear();
});
const archived={...data,schema:1,version:'a'.repeat(64),kind:'industry',status:'archived_snapshot',not_realtime:true,validation:{qualified:false,scope:'kind'},net_missing_count:100,net_available_count:396,coverage:{received:496,expected:496,complete:true},ranks:{...data.ranks,inflow:[{...row,id:'BK1000',code:'BK1000',name:'归档行业'}]},pulse_status:'waiting_validated_samples',ledger_status:'waiting_close_archives'};
test('archived board data is visible without stock acceptance, with explicit expiry, missing values and snapshot time',()=>{
 render(<FundPulsePanel data={archived} kind="industry"/>);expect(screen.getByText('归档行业')).toBeTruthy();expect(screen.getByText('已采集快照 · 非实时')).toBeTruthy();expect(screen.getByText('已过期')).toBeTruthy();expect(screen.getByText(/资金净额缺失 100 项/)).toBeTruthy();expect(screen.getByText('快照主力净额 / 万元')).toBeTruthy();expect(screen.getByText(/盘中连续性待验收/)).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'资金脉冲'}));expect(screen.queryByRole('table')).toBeNull();expect(screen.getByText(/等待两次已验收/)).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'近5日台账'}));expect(screen.queryByRole('table')).toBeNull();expect(screen.getByText(/尚无完整收盘台账/)).toBeTruthy();
});
test('snapshot expiry changes locally without a market request or automatic reordering',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-17T02:00:00Z'));
 try{render(<FundPulsePanel data={{...archived,day:'2026-11-17',completed_at:'2026-11-17T01:30:20Z',captured_at:'2026-11-17T01:30:00Z',stale:false}} kind="industry"/>);expect(screen.queryByText('已过期')).toBeNull();await act(async()=>{vi.advanceTimersByTime(6*60000);});expect(screen.getByText('已过期')).toBeTruthy();expect(screen.getByText('归档行业')).toBeTruthy();}finally{vi.useRealTimers();}
});
test('a mismatched-kind payload cannot display another universe under the selected heading',()=>{
 render(<FundPulsePanel data={archived} kind="concept"/>);expect(screen.queryByText('归档行业')).toBeNull();expect(screen.queryByRole('table')).toBeNull();
});
test('independent category reads start with industry and stock absence does not erase a cached board snapshot',async()=>{
 const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}}),requests:string[]=[];
 vi.stubGlobal('fetch',async(input:any)=>{const url=String(input),kind=new URL(url,'https://x').searchParams.get('kind');requests.push(kind||'');return Response.json(kind==='stock'?{status:'pending_source_validation',kind,reason:'complete_snapshot_missing'}:{...archived,kind});});
 render(<PreferenceProvider account="qa-categories"><QueryClientProvider client={client}><FundPulse preview={false}/></QueryClientProvider></PreferenceProvider>);await screen.findByText('归档行业');expect(requests).toEqual(['industry']);fireEvent.click(screen.getByRole('button',{name:'个股'}));await screen.findByText(/个股尚无可展示的完整快照/);expect(screen.queryByText('归档行业')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'行业'}));await screen.findByText('归档行业');expect(client.getQueryData(['fund-pulse','qa-categories','industry'])).toBeTruthy();client.clear();
});
test('an unknown API payload is a local read failure rather than an empty valid funds snapshot',async()=>{
 const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});vi.stubGlobal('fetch',async()=>Response.json({}));render(<PreferenceProvider account="qa-invalid"><QueryClientProvider client={client}><FundPulse preview={false}/></QueryClientProvider></PreferenceProvider>);await screen.findByText(/资金资料暂不可用/);expect(screen.queryByRole('table')).toBeNull();client.clear();
});
