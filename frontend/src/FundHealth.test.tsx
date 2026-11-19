// @vitest-environment jsdom
import {afterEach,expect,test,vi} from 'vitest';import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {PreferenceProvider} from './personal-preferences';
import FundPulse,{FundPulsePanel} from './FundPulse';afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const old:any={kind:'concept',schema:1,status:'archived_snapshot',day:'2026-11-18',stage:'close',completed_at:'2026-11-18T07:05:20Z',coverage:{received:1,expected:1},ranks:{inflow:[{id:'BK1000',code:'BK1000',name:'历史概念',net:10000,pct:1}],outflow:[]},checkpoints:[{stage:'lunch',completed_at:'2026-11-18T03:30:00Z',data:{}}],monitor:{heartbeat:'received',state:'collection_failed',today:'2026-11-19',last_attempt_at:'2026-11-19T06:30:00Z',last_success_at:'2026-11-18T07:05:20Z',error_code:'upstream_socket'},checkpoint_status:[{stage:'lunch',state:'missing'},{stage:'1430',state:'missing'},{stage:'close',state:'scheduled'}]};
test('previous-day ranks are explicitly historical and opt-in, current checkpoint gaps never borrow yesterday',()=>{
 render(<FundPulsePanel kind="concept" data={old}/>);expect(screen.getByText(/上游连接中断/)).toBeTruthy();expect(screen.queryByText('历史概念')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:/查看历史快照/}));expect(screen.getByText('历史概念')).toBeTruthy();expect(screen.getByText(/历史快照/)).toBeTruthy();
});
test('missing heartbeat does not claim timer stopped or market collection failed',()=>{
 render(<FundPulsePanel kind="industry" data={{status:'pending_source_validation',kind:'industry',reason:'complete_snapshot_missing',monitor:{heartbeat:'missing',state:'heartbeat_missing',today:'2026-11-19'}}}/>);
 expect(screen.getByText(/未收到近期采集心跳/)).toBeTruthy();expect(screen.queryByText(/定时器已停止/)).toBeNull();
});
test('failed automatic health read explicitly preserves the previous receipt and market values',async()=>{
 const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}}),snapshot={...old,provider:'eastmoney',not_realtime:true,version:'a'.repeat(64),captured_at:'2026-11-18T07:05:00Z',kind:'industry',coverage:{received:1,expected:1,complete:true},ranks:{...old.ranks,pulseIn:[],pulseOut:[]},monitor:{state:'snapshot_available',today:'2026-11-18'}};
 vi.stubGlobal('fetch',async(input:any)=>String(input).includes('view=health')?Response.json({error:'QA unavailable'},{status:503}):Response.json(snapshot));
 render(<PreferenceProvider account="qa-health-failure"><QueryClientProvider client={client}><FundPulse preview={false}/></QueryClientProvider></PreferenceProvider>);
 expect(await screen.findByText(/监控状态读取失败/)).toBeTruthy();expect(screen.getByText('历史概念')).toBeTruthy();client.clear();
});
