// @vitest-environment jsdom
import {test,expect,vi,afterEach}from'vitest';import {render,screen,cleanup,act}from'@testing-library/react';import{QueryClient,QueryClientProvider}from'@tanstack/react-query';import{MemoryRouter,Routes,Route,useLocation}from'react-router-dom';import * as scope from './AccountScope';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
function Location(){const l=useLocation();return <p data-testid="location">{l.pathname+l.search+l.hash}</p>;}
function setup(response:()=>Promise<Response>,cached=false){const Gate=(scope as any).LocalSessionGate;expect(typeof Gate).toBe('function');const calls:string[]=[];vi.stubGlobal('fetch',vi.fn(async(url:any)=>{calls.push(String(url));return response();}));const client=new QueryClient({defaultOptions:{queries:{retry:false}}});if(cached)client.setQueryData(['resource','/api/me'],{user:{id:8}});
 render(<QueryClientProvider client={client}><MemoryRouter basename="/next" initialEntries={['/next/local-ai?setup=fresh#choice']}><Location/><Routes><Route path="login" element={<h1>登录入口</h1>}/><Route path="local-ai" element={<Gate><h1>受保护内容</h1></Gate>}/></Routes></MemoryRouter></QueryClientProvider>);return{calls,client};}
test('anonymous direct entry redirects to login with the complete local destination and never renders business content',async()=>{
 const {calls}=setup(async()=>Response.json({user:null,localHarness:true}));await screen.findByRole('heading',{name:'登录入口'});expect(screen.queryByText('受保护内容')).toBeNull();expect(screen.getByTestId('location').textContent).toBe('/login?returnTo=%2Fnext%2Flocal-ai%3Fsetup%3Dfresh%23choice');expect(calls).toEqual(['/api/me']);
});
test('an old cached login cannot flash protected content before a fresh check finishes',async()=>{
 let release:(v:Response)=>void=()=>{};const pending=new Promise<Response>(r=>release=r);setup(()=>pending,true);expect(screen.queryByText('受保护内容')).toBeNull();await act(async()=>release(Response.json({user:null,localHarness:true})));await screen.findByRole('heading',{name:'登录入口'});
});
test('a confirmed account enters the original route without a model request',async()=>{
 const {calls}=setup(async()=>Response.json({user:{id:8},localHarness:true}));await screen.findByRole('heading',{name:'受保护内容'});expect(screen.getByTestId('location').textContent).toBe('/local-ai?setup=fresh#choice');expect(calls).toEqual(['/api/me']);
});
test('identity service failure stays closed with retry instead of pretending the user is signed out',async()=>{
 setup(async()=>Response.json({error:'unavailable'},{status:503}));expect(await screen.findByRole('alert')).toBeTruthy();expect(screen.queryByText('受保护内容')).toBeNull();expect(screen.queryByText('登录入口')).toBeNull();expect(screen.getByRole('button',{name:'重新检查登录'})).toBeTruthy();
});
test('expired identity redirects once rather than looping on login checks',async()=>{
 const {calls}=setup(async()=>Response.json({error:'expired'},{status:401}));await screen.findByRole('heading',{name:'登录入口'});expect(calls).toEqual(['/api/me']);
});
test('the real account wrapper and route guard stop after failed identity reads instead of remounting forever',async()=>{
 let calls=0;vi.stubGlobal('fetch',vi.fn(async()=>{calls++;return Response.json({error:'offline'},{status:503});}));
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}}),Account=scope.default,Gate=scope.LocalSessionGate;
 render(<QueryClientProvider client={client}><MemoryRouter><Account><Gate><h1>受保护内容</h1></Gate></Account></MemoryRouter></QueryClientProvider>);
 await screen.findByRole('heading',{name:'暂时无法确认登录状态'});expect(screen.queryByText('受保护内容')).toBeNull();expect(calls).toBeLessThanOrEqual(3);
});
