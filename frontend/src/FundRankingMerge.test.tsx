// @vitest-environment jsdom
import {test,expect,afterEach} from 'vitest';
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react';
import {FundPulsePanel} from './FundPulse';
afterEach(cleanup);
const row={id:'BK1000',code:'BK1000',name:'半导体',net:200000,pulse:-10000,pct:1,trend:{points:[]}};
const data={schema:1,kind:'industry',day:'2026-11-17',status:'archived_snapshot',completed_at:'2026-11-17T07:05:07Z',cadence_minutes:30,validation:{qualified:true},trend:{model:'a'.repeat(64),samples:7,directory:[],change_available:true},coverage:{expected:1,received:1},ranks:{inflow:[row],outflow:[],pulseIn:[],pulseOut:[row]},checkpoints:[]};
test('one real-time ranking entry replaces duplicate tabs while both money bases remain explicit',()=>{
 render(<FundPulsePanel kind="industry" data={data}/>);const nav=within(screen.getByRole('navigation',{name:'资金视图'}));expect(nav.getAllByRole('button').map(b=>b.textContent)).toEqual(['实时排行','时点快照']);expect(screen.getByText('更新频率：交易时段计划每30分钟采样，非逐笔实时。')).toBeTruthy();expect(screen.getByText('+20.00')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'相邻变化'}));fireEvent.click(screen.getByRole('button',{name:'流出'}));expect(screen.getByText('-1.00')).toBeTruthy();expect(screen.getByText('相邻采样净额变化 / 万元')).toBeTruthy();
 fireEvent.click(nav.getByRole('button',{name:'时点快照'}));expect(screen.queryByRole('button',{name:'相邻变化'})).toBeNull();fireEvent.click(nav.getByRole('button',{name:'实时排行'}));expect(screen.getByRole('button',{name:'相邻变化'}).getAttribute('aria-pressed')).toBe('true');expect(screen.getByText('-1.00')).toBeTruthy();
});
test('pending source preview has the same two views and no invented ranking',()=>{
 render(<FundPulsePanel kind="industry" data={{status:'pending_source_validation'}}/>);expect(within(screen.getByRole('navigation',{name:'资金视图'})).getAllByRole('button')).toHaveLength(2);fireEvent.click(screen.getByRole('button',{name:'相邻变化'}));expect(screen.getByText(/相邻有效采样不足/)).toBeTruthy();expect(screen.queryByRole('table')).toBeNull();
});
