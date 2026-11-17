// @vitest-environment jsdom
import {test,expect,vi,afterEach} from 'vitest';import {render,screen,fireEvent,cleanup,waitFor,within} from '@testing-library/react';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {MemoryRouter} from 'react-router-dom';
import StockObservation from './StockObservation';import {PreferenceProvider} from './personal-preferences';
import {StrictMode} from 'react';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const fixture={mode:'close',day:'2026-11-09',collectedAt:'2026-11-09T07:01:00Z',source:'共享收盘快照',model:'a'.repeat(64),criteria:{board:'chinext',minPct:10},counts:{matched:1,missing:1,unmet:3},coverage:{missing:{turnover:1}},total:1,universe:5,next:null,rows:[{code:'300006',name:'莱美药业',board:'chinext',price:11.16,pct:14.34,amount:3,turnover:23,volumeRatio:null,marketCap:null,peakPct:15,quoteTime:'20261109150001'}]};
function mount(){return render(<StrictMode><QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter><PreferenceProvider account="qa55"><StockObservation/></PreferenceProvider></MemoryRouter></QueryClientProvider></StrictMode>);}

test('MA and MACD are combined only on apply, with daily evidence and missing labels',async()=>{
 const reads:string[]=[];vi.stubGlobal('fetch',async url=>{reads.push(String(url));return Response.json(String(url).includes('/schemes')?{version:0,schemes:[]}:{...fixture,technical:{day:'2026-11-09',previousDay:'2026-11-06',source:'TuShare stk_factor_pro'},rows:[{...fixture.rows[0],missing:['crossMa5']}]});});
 mount();await screen.findByRole('button',{name:/莱美药业/});fireEvent.click(screen.getByRole('button',{name:'调整筛选条件'}));fireEvent.click(screen.getByRole('button',{name:/更多条件/}));const count=reads.length;
 fireEvent.click(screen.getByLabelText('收盘价高于5日均线'));fireEvent.click(screen.getByLabelText('MACD当日金叉'));expect(reads).toHaveLength(count);
 fireEvent.click(screen.getByRole('button',{name:'应用筛选'}));await waitFor(()=>expect(decodeURIComponent(reads.at(-1)!)).toContain('technical=aboveMa5,macdGolden'));
 expect(screen.getByText('缺少：当日上穿5日均线')).toBeTruthy();expect(screen.getByText(/日线指标.*2026-11-09.*2026-11-06/)).toBeTruthy();
});

test('technical draft is retained but cannot be applied as an intraday signal',async()=>{
 const reads:string[]=[];vi.stubGlobal('fetch',async url=>{reads.push(String(url));return Response.json(String(url).includes('/schemes')?{version:0,schemes:[]}:fixture);});
 mount();await screen.findByRole('button',{name:/莱美药业/});fireEvent.click(screen.getByRole('button',{name:'调整筛选条件'}));fireEvent.click(screen.getByRole('button',{name:/更多条件/}));fireEvent.click(screen.getByLabelText('当日上穿5日均线'));fireEvent.click(screen.getByRole('button',{name:'关闭抽屉'}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());fireEvent.click(screen.getByRole('button',{name:'盘中快照'}));const count=reads.length;fireEvent.click(screen.getByRole('button',{name:'应用筛选'}));expect(reads).toHaveLength(count);expect(screen.getByRole('alert').textContent).toContain('收盘');
});
test('results remain on the main page while filter and scheme editors open only on demand',async()=>{
 const reads:string[]=[];vi.stubGlobal('fetch',async url=>{reads.push(String(url));return Response.json(String(url).includes('/schemes')?{version:0,schemes:[]}:fixture);});mount();await screen.findByRole('button',{name:/莱美药业/});
 expect(screen.getAllByRole('columnheader').slice(0,3).map(x=>x.textContent)).toEqual(['股票 / 市场','价格','涨幅']);expect(screen.getAllByRole('columnheader').at(-2)?.textContent).toBe('行业');
 expect(screen.queryByLabelText('方案名称')).toBeNull();expect(screen.queryByLabelText('涨幅下限（严格大于）')).toBeNull();const baseline=reads.length;
 fireEvent.click(screen.getByRole('button',{name:'管理方案'}));expect(screen.getByRole('dialog',{name:'管理筛选方案'})).toBeTruthy();expect(screen.getByLabelText('方案名称')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'关闭抽屉'}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());fireEvent.click(screen.getByRole('button',{name:'调整筛选条件'}));fireEvent.change(screen.getByLabelText('涨幅下限（严格大于）'),{target:{value:'15'}});fireEvent.click(screen.getByRole('button',{name:'关闭抽屉'}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(reads).toHaveLength(baseline);expect(screen.getByText(/条件已修改/)).toBeTruthy();expect(screen.getByRole('button',{name:/莱美药业/})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'应用筛选'}));await waitFor(()=>expect(reads.at(-1)).toContain('minPct=15'));
});
test('default is close; editing conditions does not fetch until applied; failure retains old dated result',async()=>{
 const reads:string[]=[];let fail=false;vi.stubGlobal('fetch',async url=>{if(String(url).includes('/schemes'))return Response.json({version:0,schemes:[]});reads.push(String(url));return fail?Response.json({error:'source unavailable'},{status:503}):Response.json(fixture);});mount();await screen.findByRole('button',{name:/莱美药业/});expect(reads[0]).toContain('mode=close');
 const baseline=reads.length;fireEvent.click(screen.getByRole('button',{name:'调整筛选条件'}));fireEvent.change(screen.getByLabelText('涨幅下限（严格大于）'),{target:{value:'15'}});expect(reads).toHaveLength(baseline);
 fail=true;fireEvent.click(screen.getByRole('button',{name:'应用筛选'}));await screen.findByText(/筛选读取失败/);expect(screen.getByText(/2026-11-09/)).toBeTruthy();expect(screen.getByRole('button',{name:/莱美药业/})).toBeTruthy();expect(reads).toHaveLength(baseline+1);
});
test('missing data is a separate result and snapshot switch is explicit; schemes save to the same account library',async()=>{
 const requests:any[]=[];let saved={version:0,schemes:[] as any[]};vi.stubGlobal('fetch',async(url,init)=>{requests.push({url:String(url),init});if(String(url).includes('/schemes')){if(init?.method==='PUT'){const b=JSON.parse(init.body);saved={version:1,schemes:b.schemes};}return Response.json(saved);}const missing=String(url).includes('result=missing');return Response.json({...fixture,mode:String(url).includes('mode=live')?'live':'close',rows:missing?[{...fixture.rows[0],turnover:null,missing:['turnover']}]:fixture.rows});});mount();await screen.findByRole('button',{name:/莱美药业/});
 fireEvent.click(screen.getByRole('button',{name:/缺数据/}));await screen.findByText('缺少：换手率');fireEvent.click(screen.getByRole('button',{name:'盘中快照'}));fireEvent.click(screen.getByRole('button',{name:'应用筛选'}));await waitFor(()=>expect(requests.some(r=>r.url.includes('mode=live'))).toBe(true));
 fireEvent.click(screen.getByRole('button',{name:'管理方案'}));fireEvent.change(screen.getByLabelText('方案名称'),{target:{value:'我的双创'}});fireEvent.click(screen.getByRole('button',{name:'保存方案'}));await screen.findByText('方案已保存到账户');expect(saved.schemes[0].criteria.mode).toBe('live');expect(requests.filter(r=>r.init?.method==='PUT')).toHaveLength(1);
});
test('sorting reuses the pinned model and does not silently apply unfinished filter edits',async()=>{
 const reads:string[]=[];vi.stubGlobal('fetch',async url=>{reads.push(String(url));return Response.json(String(url).includes('/schemes')?{version:0,schemes:[]}:fixture);});mount();await screen.findByRole('button',{name:/莱美药业/});fireEvent.click(screen.getByRole('button',{name:'调整筛选条件'}));fireEvent.change(screen.getByLabelText('涨幅下限（严格大于）'),{target:{value:'18'}});fireEvent.click(screen.getByRole('button',{name:'关闭抽屉'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());fireEvent.change(screen.getByLabelText('结果排序'),{target:{value:'amount'}});await waitFor(()=>expect(reads.some(u=>u.includes('sort=amount'))).toBe(true));const last=reads.at(-1)!;expect(last).toContain('minPct=10');expect(last).toContain('model='+fixture.model);
});
test('a known failed condition remains visible even when the same row has another missing field',async()=>{
 vi.stubGlobal('fetch',async url=>Response.json(String(url).includes('/schemes')?{version:0,schemes:[]}:String(url).includes('result=unmet')?{...fixture,rows:[{...fixture.rows[0],failed:['pct'],missing:['turnover']}]}:fixture));mount();await screen.findByRole('button',{name:/莱美药业/});fireEvent.click(screen.getByRole('button',{name:/不符合 /}));await screen.findByText('未满足：涨幅；另缺：换手率');
});

test('main-board limit-up preset uses the published limit price and only queries after apply',async()=>{
 const reads:string[]=[];vi.stubGlobal('fetch',async url=>{reads.push(String(url));return Response.json(String(url).includes('/schemes')?{version:0,schemes:[]}:fixture);});mount();await screen.findByRole('button',{name:/莱美药业/});const baseline=reads.length;
 fireEvent.click(screen.getByRole('button',{name:/主板涨停/}));expect(reads).toHaveLength(baseline);fireEvent.click(screen.getByRole('button',{name:'调整筛选条件'}));expect((screen.getByLabelText('市场范围') as HTMLSelectElement).value).toBe('main');expect((screen.getByLabelText('封板状态') as HTMLSelectElement).value).toBe('yes');
 fireEvent.click(screen.getByRole('button',{name:'应用筛选'}));await waitFor(()=>expect(reads.at(-1)).toContain('board=main'));expect(reads.at(-1)).toContain('sealed=yes');expect(reads.at(-1)).not.toContain('minPct=');
});

test('advanced filters start collapsed, retain edits across collapse and apply while hidden',async()=>{
 const reads:string[]=[];vi.stubGlobal('fetch',async url=>{reads.push(String(url));return Response.json(String(url).includes('/schemes')?{version:0,schemes:[]}:fixture);});mount();await screen.findByRole('button',{name:/莱美药业/});
 fireEvent.click(screen.getByRole('button',{name:'调整筛选条件'}));expect(screen.getByLabelText('市场范围')).toBeTruthy();expect(screen.queryByLabelText('量比下限')).toBeNull();const baseline=reads.length;
 fireEvent.click(screen.getByRole('button',{name:/更多条件/}));fireEvent.change(screen.getByLabelText('量比下限'),{target:{value:'2'}});fireEvent.click(screen.getByRole('button',{name:/收起更多条件/}));await waitFor(()=>expect(screen.queryByLabelText('量比下限')).toBeNull());expect(reads).toHaveLength(baseline);
 expect(within(screen.getByRole('dialog',{name:'条件筛选'})).getByText(/量比 ≥2/)).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'应用筛选'}));await waitFor(()=>expect(reads.at(-1)).toContain('minVolumeRatio=2'));
});

test('industry and concept choice preserves source identity and industry column is not guessed',async()=>{
 const reads:string[]=[];vi.stubGlobal('fetch',async url=>{reads.push(String(url));return Response.json(String(url).includes('/schemes')?{version:0,schemes:[]}:String(url).includes('catalog=1')?{groups:[{provider:'sw',code:'SW1',name:'医药生物',memberCount:100},{provider:'ths',code:'885001.TI',name:'医药概念',memberCount:50}],model:fixture.model}:{...fixture,rows:[{...fixture.rows[0],industry:'化学制药'}]});});mount();await screen.findByRole('cell',{name:'化学制药'});
 fireEvent.click(screen.getByRole('button',{name:'调整筛选条件'}));fireEvent.change(screen.getByLabelText('行业或概念'),{target:{value:'医药'}});fireEvent.click(await screen.findByRole('button',{name:/医药概念.*同花顺/}));fireEvent.click(screen.getByRole('button',{name:'应用筛选'}));await waitFor(()=>expect(reads.at(-1)).toContain('groupProvider=ths'));expect(reads.at(-1)).toContain('groupCode=885001.TI');
});
