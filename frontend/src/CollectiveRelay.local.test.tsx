// @vitest-environment jsdom
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,cleanup,fireEvent} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {PreferenceProvider} from './personal-preferences';
import CollectiveRelay from './CollectiveRelay';
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
function fixture({calendar=true,current=false}={}){
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date(current?'2026-11-16T02:15:00Z':'2026-11-14T02:15:00Z'));
 const day=current?'2026-11-16':'2026-11-13',stamp=day.replaceAll('-','')+(current?'101500':'150100');
 const model={id:'fixture-model',provider:'sw',day,asof:stamp,quoteCollectedAt:stamp,computedAt:stamp,closed:!current,evidenceReady:true,boards:[{code:'SW720501',name:'院线',memberCount:4,signal:'多股走强',taxonomy:{industryPath:['传媒','院线']},collective:{state:'当日向上支撑',quality:{covered:4},rise:{daily:{strongCount:4,coreCount:1,memberRatio:null},window:{}},rolling:{coverageReady:true,medianChange:0}},lifecycle:{rise:{phase:'当日支撑'}}}]};
 vi.stubGlobal('fetch',vi.fn(async(input:any)=>{const u=new URL(String(input),'http://localhost');if(u.pathname==='/api/profile')return Response.json({version:0,profile:{pool:[],positions:[]}});if(u.pathname==='/api/data/free')return Response.json({trading_calendar:calendar?{from:'2026-11-13',through:'2026-11-16',open_days:['2026-11-13','2026-11-16']}:null});if(u.pathname==='/api/data/events')return Response.json({events:[],total:0,coverage:{}});if(u.searchParams.has('frequency'))return Response.json({});if(u.searchParams.has('history'))return Response.json({snapshots:[]});if(u.searchParams.has('head'))return Response.json({id:model.id});return Response.json(model);}));
 render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><PreferenceProvider account="55"><MemoryRouter><CollectiveRelay/></MemoryRouter></PreferenceProvider></QueryClientProvider>);
}
test('closed-day boards show the actual snapshot date, not current intraday claims or zero for a missing ratio',async()=>{
 fixture();expect(await screen.findByText(/当前休市.*2026-11-13.*快照/)).toBeTruthy();expect(screen.getByText('快照日向上支撑',{exact:true})).toBeTruthy();expect(screen.queryByText('当日向上支撑',{exact:true})).toBeNull();expect(screen.getByText(/快照窗口事件/)).toBeTruthy();expect(screen.getByText('支撑比例 —',{exact:true})).toBeTruthy();
});
test('missing calendar retains dated historical results without asserting a confirmed market closure',async()=>{
 fixture({calendar:false});expect(await screen.findByText(/历史快照.*2026-11-13/)).toBeTruthy();expect(screen.queryByText(/当前休市/)).toBeNull();
});
test('an intraday board retains current labels while failed artwork has a clean decorative fallback',async()=>{
 fixture({current:true});await screen.findByText('当日向上支撑',{exact:true});const image=document.querySelector('.collective-summary img')!;expect(image).not.toBeNull();fireEvent.error(image);expect(document.querySelector('.collective-summary img')).toBeNull();expect(document.querySelector('.collective-summary .relay-art-fallback')).not.toBeNull();expect(screen.queryByText(/历史快照.*2026-11-16/)).toBeNull();
});
