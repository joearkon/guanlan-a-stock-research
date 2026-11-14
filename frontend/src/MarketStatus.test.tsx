// @vitest-environment jsdom
import {test,expect,vi,afterEach}from'vitest';import{render,screen,cleanup,act}from'@testing-library/react';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import MarketStatus from'./MarketStatus';
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
function fixture(now='2026-11-14T02:00:00Z',calendar:any={from:'2026-11-13',through:'2026-11-16',open_days:['2026-11-13','2026-11-16']}){
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date(now));const reads:string[]=[];vi.stubGlobal('fetch',vi.fn(async(url:any,init:any={})=>{expect(init.method||'GET').toBe('GET');reads.push(String(url));return Response.json({trading_calendar:calendar});}));
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MarketStatus/><MarketStatus/></QueryClientProvider>);return reads;
}
test('both shell locations show a calendar-verified state using a single shared read and no quote request',async()=>{
 const reads=fixture();expect(await screen.findAllByRole('status',{name:/市场状态：休市/})).toHaveLength(2);expect(reads).toEqual(['/api/data/free?view=watch']);expect(screen.getAllByRole('status')[0].title).toContain('不是报价时效');
});
test('the badge reports unknown rather than guessing a closed weekend without calendar coverage',async()=>{
 fixture('2026-11-14T02:00:00Z',null);expect(await screen.findAllByRole('status',{name:/市场状态：待核验/})).toHaveLength(2);expect(screen.queryByText('休市',{exact:true})).toBeNull();
});
test('the status changes at the lunch boundary without another shared-data read',async()=>{
 const reads=fixture('2026-11-16T03:29:59Z');await screen.findAllByRole('status',{name:/市场状态：盘中/});await act(async()=>{vi.setSystemTime(new Date('2026-11-16T03:30:00Z'));document.dispatchEvent(new Event('visibilitychange'));});expect(await screen.findAllByRole('status',{name:/市场状态：午间休市/})).toHaveLength(2);expect(reads).toHaveLength(1);
});
