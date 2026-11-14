// @vitest-environment jsdom
import {test,expect,vi,afterEach}from'vitest';
import {render,screen,fireEvent,cleanup}from'@testing-library/react';
import OnboardingProvider,{useOnboarding}from'./Onboarding';
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks();vi.unstubAllGlobals();});
function Content(){const guide=useOnboarding();return <><nav data-tour="navigation">导航</nav><div data-tour="local-ai">本地Agent入口</div><button onClick={guide.start}>重新引导</button></>;}
function show(account='qa-v3',edition:'saas'|'harness'='saas',ready=true){return render(<OnboardingProvider account={account} ready={ready} {...{edition} as any}><Content/></OnboardingProvider>);}
const stored=(version:string,account:string,layout='desktop')=>'guanlan.onboarding.'+version+'.'+account+'.'+layout;
const current=(edition:string,account:string,layout='desktop')=>'guanlan.onboarding.v3.'+edition+'.'+account+'.'+layout;
test.each(['saas','harness'] as const)('v2 users see the %s update once without losing old completion',async edition=>{
 const previous=JSON.stringify({version:'v2',status:'completed'});localStorage.setItem(stored('v2','qa-return'),previous);const view=show('qa-return',edition);
 await screen.findByRole('dialog');expect(screen.getByText('最近功能更新')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'跳过引导'}));
 expect(localStorage.getItem(stored('v2','qa-return'))).toBe(previous);expect(JSON.parse(localStorage.getItem(current(edition,'qa-return'))||'{}').status).toBe('skipped');
 view.unmount();show('qa-return',edition);expect(screen.queryByRole('dialog')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'重新引导'}));expect(screen.getByText('观澜快速上手')).toBeTruthy();
});
test('seen edition stays quiet while the other edition is not silently marked complete',async()=>{
 localStorage.setItem(current('saas','qa-edition'),JSON.stringify({version:'v3',edition:'saas',status:'completed'}));const v=show('qa-edition','saas');expect(screen.queryByRole('dialog')).toBeNull();v.unmount();show('qa-edition','harness');await screen.findByRole('dialog');expect(localStorage.getItem(current('harness','qa-edition'))).toBeNull();
});
test('first mobile entry after desktop completion gets an update and keeps desktop state',async()=>{
 vi.stubGlobal('matchMedia',(q:string)=>({matches:q.includes('max-width:767px'),addEventListener:()=>{},removeEventListener:()=>{}}));const previous=JSON.stringify({version:'v3',edition:'saas',status:'completed'});localStorage.setItem(current('saas','qa-layout'),previous);show('qa-layout');await screen.findByRole('dialog');expect(screen.getByText('最近功能更新')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'跳过引导'}));expect(localStorage.getItem(current('saas','qa-layout'))).toBe(previous);expect(localStorage.getItem(current('saas','qa-layout','mobile'))).toContain('skipped');
});
test('Harness configuration is an explicit link, never an environment probe or model request',async()=>{
 const fetch=vi.fn();vi.stubGlobal('fetch',fetch);show('qa-harness','harness');await screen.findByRole('dialog');let link;
 for(let i=0;i<25;i++){link=screen.queryByRole('link',{name:'配置自己的 AI Agent'});if(link)break;const next=screen.queryByRole('button',{name:'下一步'});if(!next)break;fireEvent.click(next);}
 expect(link).toBeTruthy();expect(link?.getAttribute('href')).toBe('/next/local-ai');expect(fetch).not.toHaveBeenCalled();link!.addEventListener('click',e=>e.preventDefault(),{once:true});fireEvent.click(link!);expect(screen.queryByRole('dialog')).toBeNull();expect(JSON.parse(localStorage.getItem(current('harness','qa-harness'))||'{}').status).toBe('skipped');expect(fetch).not.toHaveBeenCalled();
});
test('SaaS full walkthrough never offers a local Agent configuration link and performs no requests',async()=>{
 const fetch=vi.fn();vi.stubGlobal('fetch',fetch);show('qa-saas');await screen.findByRole('dialog');for(let i=0;i<25;i++){expect(screen.queryByRole('link',{name:'配置自己的 AI Agent'})).toBeNull();const next=screen.queryByRole('button',{name:'下一步'});if(!next)break;fireEvent.click(next);}fireEvent.click(screen.getByRole('button',{name:'开始使用'}));expect(JSON.parse(localStorage.getItem(current('saas','qa-saas'))||'{}').status).toBe('completed');expect(fetch).not.toHaveBeenCalled();
});
test('pending identity and guests cannot persist or open a tour manually',()=>{
 show('guest','harness',false);fireEvent.click(screen.getByRole('button',{name:'重新引导'}));expect(screen.queryByRole('dialog')).toBeNull();expect(localStorage.length).toBe(0);
});

test('opening and changing steps keep the introduction at the top instead of scrolling to the footer',async()=>{
 const focus=vi.spyOn(HTMLElement.prototype,'focus');show('qa-scroll');const dialog=await screen.findByRole('dialog');
 expect(focus.mock.instances.some((node,i)=>node===dialog&&focus.mock.calls[i][0]?.preventScroll===true)).toBe(true);
 dialog.scrollTop=120;fireEvent.click(screen.getByRole('button',{name:'下一步'}));expect(dialog.scrollTop).toBe(0);
});
