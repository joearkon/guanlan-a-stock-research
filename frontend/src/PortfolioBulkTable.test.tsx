// @vitest-environment jsdom
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor,act} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {useProfileActions} from './profile-actions';
import {PrivacyProvider} from './Privacy';
const file='./PortfolioBulkTable';
const Bulk=(await import(/* @vite-ignore */ file).catch(()=>({default:undefined}))).default;
const stock={kind:'stock',code:'600001',name:'甲',category:'观察',reason:'保留依据',base:8},etf={kind:'etf',code:'600001',name:'乙ETF',category:'观察'},other={kind:'stock',code:'600003',name:'丙',category:'其他'},archived={kind:'stock',code:'600004',name:'旧记录',archived:true};
const positions=[{code:'600001',name:'甲',shares:500,cost:10},{code:'600002',name:'丁',shares:800,cost:20}];
afterEach(()=>{cleanup();vi.unstubAllGlobals();localStorage.clear();});
function mount(mode:'watchlist'|'holdings'='watchlist',options:{fail?:boolean;privacy?:boolean}={}){
 expect(typeof Bulk).toBe('function');
 const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}}),original={version:7,profile:{pool:[stock,etf,other,archived],positions,notes:'不能删除',verify:[{id:'evidence'}]}},writes:any[]=[];
 client.setQueryData(['resource','/api/profile'],structuredClone(original));
 vi.stubGlobal('fetch',async(url:any,init:any)=>{if(init?.method==='PUT'){const b=JSON.parse(init.body);writes.push(b);if(options.fail)throw new DOMException('timeout','TimeoutError');return Response.json({profile:b.profile,version:b.version+1});}if(String(url)==='/api/profile')return Response.json(original);return new Promise(()=>{});});
 function Host({scope='first'}:{scope?:string}){const a=useProfileActions(),all=mode==='holdings'?a.query.data?.profile.positions||[]:(a.query.data?.profile.pool||[]).filter((r:any)=>!r.archived&&r.category==='观察');return <Bulk key={scope} mode={mode} actions={a} rows={all} quotes={{}} selected="600001" onSelect={()=>{}} onManage={mode==='watchlist'?()=>{}:undefined} onEditHolding={mode==='holdings'?()=>{}:undefined}/>;}
 const tree=(scope='first')=><QueryClientProvider client={client}><MemoryRouter><PrivacyProvider account={options.privacy?'guest':'qa'}><Host scope={scope}/></PrivacyProvider></MemoryRouter></QueryClientProvider>;
 const view=render(tree());return {client,original,writes,rerender:(scope:string)=>view.rerender(tree(scope))};
}
test('filtered select-all archives only the checked typed watch identities in one versioned save and can undo',async()=>{
 const {writes,client,original}=mount();fireEvent.click(screen.getByRole('button',{name:'批量管理'}));fireEvent.click(screen.getByRole('checkbox',{name:'全选当前筛选结果'}));expect(writes).toHaveLength(0);
 expect(screen.getByRole('checkbox',{name:'选择乙ETF 600001'})).toHaveProperty('checked',true);
 fireEvent.click(screen.getByRole('button',{name:'移除所选（2）'}));expect(writes).toHaveLength(0);expect(screen.getByRole('dialog',{name:'确认批量移除自选'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'确认移除2项自选'}));await screen.findByRole('button',{name:'撤销本次批量移除'});
 expect(writes).toHaveLength(1);expect(writes[0].version).toBe(7);expect(writes[0].profile.pool).toEqual([{...stock,archived:true},{...etf,archived:true},other,archived]);expect(writes[0].profile.positions).toEqual(positions);expect(writes[0].profile.verify).toEqual(original.profile.verify);
 fireEvent.click(screen.getByRole('button',{name:'撤销本次批量移除'}));await waitFor(()=>expect(writes).toHaveLength(2));expect(writes[1].version).toBe(8);expect(client.getQueryData<any>(['resource','/api/profile']).profile).toEqual(original.profile);
});
test('holding bulk removal preserves watch records and quantities on undo, without recording a sale',async()=>{
 const {writes,original}=mount('holdings');fireEvent.click(screen.getByRole('button',{name:'批量管理'}));fireEvent.click(screen.getByRole('checkbox',{name:'选择甲 600001'}));fireEvent.click(screen.getByRole('button',{name:'移除所选（1）'}));expect(screen.getByText(/不代表已卖出/)).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'确认移除1项持仓记录'}));await screen.findByRole('button',{name:'撤销本次批量移除'});expect(writes[0].profile.positions).toEqual([positions[1]]);expect(writes[0].profile.pool).toEqual(original.profile.pool);expect(writes[0].profile).not.toHaveProperty('trades');fireEvent.click(screen.getByRole('button',{name:'撤销本次批量移除'}));await waitFor(()=>expect(writes).toHaveLength(2));expect(writes[1].profile.positions).toEqual(positions);
});
test('cancel and changing the filtered scope discard selection without any write',async()=>{
 const {writes,rerender}=mount();fireEvent.click(screen.getByRole('button',{name:'批量管理'}));fireEvent.click(screen.getByRole('checkbox',{name:'全选当前筛选结果'}));fireEvent.click(screen.getByRole('button',{name:'移除所选（2）'}));fireEvent.click(screen.getByRole('button',{name:'取消移除'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(writes).toHaveLength(0);rerender('other-filter');expect(screen.queryByRole('checkbox',{name:'选择甲 600001'})).toBeNull();expect(writes).toHaveLength(0);
});
test('a timed-out batch preserves the old list and blocks resubmission until an explicit account reload',async()=>{
 const {writes,client,original}=mount('watchlist',{fail:true});fireEvent.click(screen.getByRole('button',{name:'批量管理'}));fireEvent.click(screen.getByRole('checkbox',{name:'全选当前筛选结果'}));fireEvent.click(screen.getByRole('button',{name:'移除所选（2）'}));fireEvent.click(screen.getByRole('button',{name:'确认移除2项自选'}));await screen.findByRole('button',{name:'重新读取账户核对'});expect(writes).toHaveLength(1);expect(client.getQueryData<any>(['resource','/api/profile'])).toEqual(original);await waitFor(()=>expect(screen.queryByRole('button',{name:'确认移除2项自选'})).toBeNull());fireEvent.click(screen.getByRole('button',{name:'重新读取账户核对'}));await screen.findByRole('button',{name:'批量管理'});expect(screen.queryByRole('checkbox',{name:'选择甲 600001'})).toBeNull();expect(writes).toHaveLength(1);
});
test('a refreshed profile version invalidates the confirmation rather than deleting changed records',async()=>{
 const {writes,client,original}=mount('holdings');fireEvent.click(screen.getByRole('button',{name:'批量管理'}));fireEvent.click(screen.getByRole('checkbox',{name:'全选当前筛选结果'}));fireEvent.click(screen.getByRole('button',{name:'移除所选（2）'}));await act(async()=>{client.setQueryData(['resource','/api/profile'],{...original,version:8,profile:{...original.profile,positions:[{...positions[0],shares:900},positions[1]]}});});await waitFor(()=>expect(screen.getByRole('button',{name:'确认移除2项持仓记录'})).toHaveProperty('disabled',true));expect(writes).toHaveLength(0);
});
test('privacy mode prevents bulk editing of hidden personal records',()=>{
 mount('holdings',{privacy:true});expect(screen.getByRole('button',{name:'批量管理'})).toHaveProperty('disabled',true);fireEvent.click(screen.getByRole('button',{name:'批量管理'}));expect(screen.queryByRole('checkbox',{name:'选择甲 600001'})).toBeNull();
});
test('undo cannot overwrite later account changes',async()=>{
 const {writes,client}=mount('holdings');fireEvent.click(screen.getByRole('button',{name:'批量管理'}));fireEvent.click(screen.getByRole('checkbox',{name:'全选当前筛选结果'}));fireEvent.click(screen.getByRole('button',{name:'移除所选（2）'}));fireEvent.click(screen.getByRole('button',{name:'确认移除2项持仓记录'}));const undo=await screen.findByRole('button',{name:'撤销本次批量移除'});const latest=client.getQueryData<any>(['resource','/api/profile']);await act(async()=>{client.setQueryData(['resource','/api/profile'],{version:9,profile:{...latest.profile,positions:[{...positions[0],shares:1000}]}});});fireEvent.click(undo);await screen.findByRole('button',{name:'重新读取账户核对'});expect(writes).toHaveLength(1);expect(client.getQueryData<any>(['resource','/api/profile']).profile.positions[0].shares).toBe(1000);
});
test('a pending save ignores repeat confirmation and keeps all account row actions disabled',async()=>{
 const {writes}=mount('holdings');let release:(value:Response)=>void=()=>{};vi.stubGlobal('fetch',async(_url:any,init:any)=>{if(init?.method==='PUT'){writes.push(JSON.parse(init.body));return new Promise<Response>(r=>{release=r;});}return new Promise(()=>{});});fireEvent.click(screen.getByRole('button',{name:'批量管理'}));fireEvent.click(screen.getByRole('checkbox',{name:'全选当前筛选结果'}));fireEvent.click(screen.getByRole('button',{name:'移除所选（2）'}));const confirm=screen.getByRole('button',{name:'确认移除2项持仓记录'});fireEvent.click(confirm);fireEvent.click(confirm);await waitFor(()=>expect(writes).toHaveLength(1));expect(screen.getByRole('button',{name:'正在移除…'})).toHaveProperty('disabled',true);await act(async()=>{release(Response.json({version:8,profile:writes[0].profile}));});await screen.findByRole('button',{name:'撤销本次批量移除'});expect(writes).toHaveLength(1);
});
