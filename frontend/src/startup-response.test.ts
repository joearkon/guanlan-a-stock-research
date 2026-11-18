// @vitest-environment jsdom
import {test,expect,vi,afterEach} from 'vitest';
import {getJSON,clearResourceCache,queryClient} from './api';
afterEach(()=>{clearResourceCache();queryClient.clear();vi.unstubAllGlobals();delete (window as any).__guanlanStartupV1;});
test('the first identity query consumes the in-flight startup request instead of starting another network round trip',async()=>{
 const calls:string[]=[];vi.stubGlobal('fetch',async u=>{calls.push(String(u));return Response.json({user:{id:99}});});
 (window as any).__guanlanStartupV1={at:Date.now(),controller:new AbortController(),promise:Promise.resolve(Response.json({user:{id:55}}))};
 expect(await getJSON('/api/me')).toEqual({user:{id:55}});expect(calls).toEqual([]);expect((window as any).__guanlanStartupV1).toBeUndefined();
 expect(await getJSON('/api/me')).toEqual({user:{id:99}});expect(calls).toEqual(['/api/me']);
});
test('logout discards and aborts an unclaimed identity request without priming a new account',async()=>{
 const controller=new AbortController();(window as any).__guanlanStartupV1={at:Date.now(),controller,promise:Promise.resolve(Response.json({user:{id:55}}))};
 clearResourceCache();expect(controller.signal.aborted).toBe(true);expect((window as any).__guanlanStartupV1).toBeUndefined();
 vi.stubGlobal('fetch',async()=>Response.json({user:null}));expect(await getJSON('/api/me')).toEqual({user:null});
});
test('expired startup identity is discarded and unrelated resources never consume it',async()=>{
 const controller=new AbortController(),calls:string[]=[];(window as any).__guanlanStartupV1={at:Date.now()-16000,controller,promise:Promise.resolve(Response.json({user:{id:55}}))};
 vi.stubGlobal('fetch',async u=>{calls.push(String(u));return Response.json({fresh:true});});await getJSON('/api/data/free');expect((window as any).__guanlanStartupV1).toBeTruthy();
 expect(await getJSON('/api/me')).toEqual({fresh:true});expect(controller.signal.aborted).toBe(true);expect(calls).toEqual(['/api/data/free','/api/me']);
});

test('a timed-out startup read is surfaced without adding a second twenty-second identity wait',async()=>{
 let calls=0;(window as any).__guanlanStartupV1={at:Date.now(),controller:new AbortController(),error:new DOMException('deadline','TimeoutError'),promise:Promise.resolve(null)};vi.stubGlobal('fetch',async()=>{calls++;return Response.json({user:null});});
 await expect(getJSON('/api/me')).rejects.toMatchObject({name:'TimeoutError'});expect(calls).toBe(0);
});
test('an identity claimed before logout cannot complete into a different account',async()=>{
 let release!:(r:Response)=>void;const controller=new AbortController();(window as any).__guanlanStartupV1={at:Date.now(),controller,promise:new Promise<Response>(r=>release=r)};const pending=getJSON('/api/me');clearResourceCache();expect(controller.signal.aborted).toBe(true);release(Response.json({user:{id:55}}));await expect(pending).rejects.toMatchObject({name:'AbortError'});
 vi.stubGlobal('fetch',async()=>Response.json({user:null}));expect(await getJSON('/api/me')).toEqual({user:null});
});
