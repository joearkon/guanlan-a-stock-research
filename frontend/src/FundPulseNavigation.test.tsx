// @vitest-environment jsdom
import {afterEach,test,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {PreferenceProvider} from './personal-preferences';
import MobileNavigation from './MobileNavigation';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
test('fund pulse remains in monitoring and is reachable from mobile More without probing any local Agent',async()=>{
 vi.stubGlobal('matchMedia',(q:string)=>({matches:q.includes('max-width:767px'),media:q,addEventListener(){},removeEventListener(){}}));
 const requests:string[]=[];vi.stubGlobal('fetch',async(input:any)=>{requests.push(String(input));return Response.json({});});
 const client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});
 render(<QueryClientProvider client={client}><PreferenceProvider account="guest"><MemoryRouter initialEntries={['/fund-pulse']}><MobileNavigation user={null}/></MemoryRouter></PreferenceProvider></QueryClientProvider>);
 const nav=screen.getByRole('navigation',{name:'底部导航'});
 expect(within(nav).getByRole('link',{name:'盯盘'}).getAttribute('aria-current')).toBe('page');
 fireEvent.click(within(nav).getByRole('button',{name:'更多'}));
 const menu=await screen.findByRole('dialog',{name:'全部功能'});
 expect(within(menu).getByRole('link',{name:'资金脉冲 Beta（测试）'}).getAttribute('href')).toBe('/fund-pulse');
 expect(within(menu).getByRole('link',{name:/本地 AI Agent/})).toBeTruthy();
 expect(requests).toEqual([]);client.clear();
});
