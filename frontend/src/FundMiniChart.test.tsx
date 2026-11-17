// @vitest-environment jsdom
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,act,cleanup} from '@testing-library/react';
import {FundSpark} from './FundTrend';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
test('offscreen charts keep a stable preview and only mount the financial chart on intersection',async()=>{
 let notify:any;const disconnect=vi.fn();vi.stubGlobal('IntersectionObserver',class{constructor(cb:any){notify=cb;}observe(){}disconnect=disconnect;});
 render(<FundSpark name="半导体" points={[{at:'2026-11-17T05:00:00Z',net:10,break_before:true}]} onClick={()=>{}}/>);expect(screen.queryByRole('img')).toBeNull();
 await act(async()=>notify([{isIntersecting:false}]));expect(screen.queryByRole('img')).toBeNull();await act(async()=>notify([{isIntersecting:true}]));expect(await screen.findByRole('img',{name:'半导体累计资金走势，按实际时间采样，缺口断线'},{timeout:5000})).toBeTruthy();expect(screen.getByText('单点')).toBeTruthy();
});
