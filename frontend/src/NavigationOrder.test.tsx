// @vitest-environment jsdom
import {test,expect,vi} from 'vitest';
import {act,screen,within,fireEvent} from '@testing-library/react';
import {savePreferences} from './personal-preferences';

test('desktop and mobile keep stock before industry and fund pulse before auction without write or Agent requests',async()=>{
 window.history.replaceState(null,'','/next/fund-pulse');document.body.innerHTML='<div id="root"></div>';
 for(const edition of ['saas','harness'])for(const layout of ['desktop','mobile'])localStorage.setItem('guanlan.onboarding.v3.'+edition+'.55.'+layout,JSON.stringify({version:'v3',edition,status:'skipped'}));
 vi.stubGlobal('matchMedia',(q:string)=>({matches:false,media:q,addEventListener(){},removeEventListener(){}}));
 const requests:{url:string;method:string}[]=[];
 vi.stubGlobal('fetch',async(url:any,init:any={})=>{requests.push({url:String(url),method:init.method||'GET'});return Response.json(String(url).includes('/api/me')?{user:{id:55,isAdmin:false}}:String(url).includes('/api/local-ai/status')?{kind:'unconfigured',label:'未配置'}:{});});
 await act(async()=>{await import('./main');});
 const nav=await screen.findByRole('navigation',{name:'主导航'});
 const follows=(first:HTMLElement,second:HTMLElement)=>expect(first.compareDocumentPosition(second)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 follows(within(nav).getByRole('link',{name:'个股档案'}),within(nav).getByRole('link',{name:'产业价值研究'}));
 follows(within(nav).getByRole('link',{name:'资金脉冲 Beta（测试）'}),within(nav).getByRole('link',{name:'竞价盘中'}));
 const strategy=within(nav).getByRole('link',{name:'战法研究 Beta（测试）'});expect(strategy.parentElement).toBe(nav);
 follows(within(nav).getByRole('link',{name:'复盘'}),strategy);follows(strategy,within(nav).getByRole('link',{name:'个股档案'}));
 fireEvent.click(strategy);expect(await screen.findByRole('heading',{name:'战法研究 Beta（测试）'})).toBeTruthy();expect(within(nav).getByRole('link',{name:'盯盘'}).classList.contains('active')).toBe(false);expect(within(nav).queryByRole('link',{name:'竞价盘中'})).toBeNull();
 await act(async()=>savePreferences('55',{displayMode:'mobile'}));
 const bottom=await screen.findByRole('navigation',{name:'底部导航'});fireEvent.click(within(bottom).getByRole('button',{name:'更多'}));
 const menu=await screen.findByRole('dialog',{name:'全部功能'});
 follows(within(menu).getByRole('link',{name:'个股档案'}),within(menu).getByRole('link',{name:'产业价值研究'}));
 follows(within(menu).getByRole('link',{name:'资金脉冲 Beta（测试）'}),within(menu).getByRole('link',{name:'竞价盘中'}));
 expect(within(menu).getAllByRole('link',{name:'战法研究 Beta（测试）'})).toHaveLength(1);
 expect(requests.every(r=>r.method==='GET')).toBe(true);
 expect(requests.some(r=>/\/probe|\/jobs/.test(r.url))).toBe(false);
 expect(requests.filter(r=>r.url.includes('/api/data/fund-pulse')).every(r=>r.method==='GET'&&r.url.includes('kind=concept'))).toBe(true);
 vi.unstubAllGlobals();
});
