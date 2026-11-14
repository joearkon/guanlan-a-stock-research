// @vitest-environment jsdom
import {test,expect,vi,afterEach}from'vitest';import {render,screen,fireEvent,cleanup}from'@testing-library/react';import {QueryClient,QueryClientProvider}from'@tanstack/react-query';import {MemoryRouter}from'react-router-dom';import {PreferenceProvider}from'./personal-preferences';
import * as status from './LocalAIStatus';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
test.each([['not_installed','未安装'],['signed_out','未登录'],['retest','需重新测试']])('startup %s gives actionable guidance and only reads status',async(kind,label)=>{
 const Notice=(status as any).LocalAIStartup;expect(typeof Notice).toBe('function');let reads=0;
 vi.stubGlobal('fetch',vi.fn(async(_url:any,init:any={})=>{expect(init.method||'GET').toBe('GET');reads++;return Response.json({engine:'claude',kind,label,detail:'请本人在官方 CLI 完成安装与登录'});}));
 render(<QueryClientProvider client={new QueryClient()}><PreferenceProvider account="55"><MemoryRouter><Notice/></MemoryRouter></PreferenceProvider></QueryClientProvider>);
 expect(await screen.findByText(new RegExp(label))).toBeTruthy();expect(screen.getByRole('link',{name:'打开本地 AI Agent 配置'}).getAttribute('href')).toBe('/local-ai');expect(reads).toBe(1);
 fireEvent.click(screen.getByRole('button',{name:'关闭连接提示'}));expect(screen.queryByRole('status')).toBeNull();
});
test('startup read failure offers retry and cannot keep a green state',async()=>{
 const Notice=(status as any).LocalAIStartup;vi.stubGlobal('fetch',vi.fn(async()=>{throw Error('offline');}));
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><PreferenceProvider account="55"><MemoryRouter><Notice/></MemoryRouter></PreferenceProvider></QueryClientProvider>);
 expect(await screen.findByText(/本机服务读取失败/)).toBeTruthy();expect(screen.getByRole('button',{name:'重新检测'})).toBeTruthy();expect(document.querySelector('[data-connection-state="verified"]')).toBeNull();
});
