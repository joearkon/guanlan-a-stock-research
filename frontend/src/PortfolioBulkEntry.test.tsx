// @vitest-environment jsdom
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import Portfolio from './Portfolio';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
test.each(['watchlist','holdings'] as const)('the real %s page exposes batch selection and clears it on a filter change',async mode=>{
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}}),item={kind:'stock',code:'600001',name:'甲',category:'观察',basket:'观察',shares:500,cost:10},writes:any[]=[];
 client.setQueryData(['resource','/api/profile'],{version:7,profile:{pool:[item],positions:[item]}});
 vi.stubGlobal('fetch',(_url:any,init:any)=>{if(init?.method&&init.method!=='GET')writes.push(init);return new Promise(()=>{});});
 render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/'+mode]}><Portfolio mode={mode}/></MemoryRouter></QueryClientProvider>);
 fireEvent.click(await screen.findByRole('button',{name:'批量管理'}));fireEvent.click(screen.getByRole('checkbox',{name:'全选当前筛选结果'}));expect(screen.getByRole('checkbox',{name:'选择甲 600001'})).toHaveProperty('checked',true);
 fireEvent.change(screen.getByRole('combobox',{name:'分组筛选'}),{target:{value:'观察'}});
 await waitFor(()=>expect(screen.queryByRole('checkbox',{name:'选择甲 600001'})).toBeNull());expect(screen.getByRole('button',{name:'批量管理'})).toBeTruthy();expect(writes).toHaveLength(0);
});
