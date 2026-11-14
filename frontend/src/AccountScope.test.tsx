// @vitest-environment jsdom
import {test,expect,vi,afterEach}from'vitest';import {render,screen,cleanup,act}from'@testing-library/react';import {QueryClient,QueryClientProvider}from'@tanstack/react-query';import AccountScope,{signalSessionChange,sessionSignalKey}from'./AccountScope';import {usePreferences}from'./personal-preferences';
import {getJSON}from'./api';
afterEach(()=>{cleanup();vi.unstubAllGlobals();localStorage.clear();});
function Owner(){const {account}=usePreferences();return <output aria-label="当前配置所属账号">{account}</output>;}
test('login refreshes the active account scope after the query cache was cleared',async()=>{let id:number|null=null;vi.stubGlobal('fetch',async()=>Response.json({user:id?{id}:null,localHarness:true}));const client=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={client}><AccountScope><Owner/></AccountScope></QueryClientProvider>);await screen.findByText('guest');
 await act(async()=>{id=7;client.clear();signalSessionChange();});await screen.findByText('7');
 await act(async()=>{id=null;signalSessionChange();});await screen.findByText('guest');
});
test('a session change in another tab clears stale account data and reads the current cookie identity',async()=>{let id=7;vi.stubGlobal('fetch',async()=>Response.json({user:{id},localHarness:true}));const client=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={client}><AccountScope><Owner/></AccountScope></QueryClientProvider>);await screen.findByText('7');client.setQueryData(['private-old-account'],{secret:'not for next user'});
 await act(async()=>{id=9;window.dispatchEvent(new StorageEvent('storage',{key:sessionSignalKey,newValue:'changed'}));});await screen.findByText('9');expect(client.getQueryData(['private-old-account'])).toBeUndefined();
});
test('an API 401 clears stale private data and rechecks identity without retrying the failed operation',async()=>{
 let signedIn=true,privateReads=0;vi.stubGlobal('fetch',async(url:any)=>{if(url==='/api/me')return Response.json({user:signedIn?{id:7}:null,localHarness:true});privateReads++;return Response.json({error:'expired'},{status:401});});const client=new QueryClient({defaultOptions:{queries:{retry:false}}});render(<QueryClientProvider client={client}><AccountScope><Owner/></AccountScope></QueryClientProvider>);await screen.findByText('7');client.setQueryData(['private-old-account'],{secret:'stale'});
 await act(async()=>{signedIn=false;try{await getJSON('/api/profile');}catch{}});await screen.findByText('guest');expect(client.getQueryData(['private-old-account'])).toBeUndefined();expect(privateReads).toBe(1);
});
