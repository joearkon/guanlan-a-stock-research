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

test('board trend is immediately after its identity and the money columns still match their headers',()=>{
 render(<FundPulsePanel kind="industry" data={data}/>);
 const table=screen.getByRole('table');expect(within(table).getAllByRole('columnheader').map(e=>e.textContent)).toEqual(['名称 / 代码','累计趋势','快照主力净额 / 万元','快照涨跌幅']);
 const cells=within(table).getAllByRole('row')[1].querySelectorAll('td');expect(cells[0].textContent).toContain('半导体');expect(within(cells[1]).getByRole('button',{name:'查看半导体资金趋势'})).toBeTruthy();expect(cells[2].textContent).toBe('+20.00');expect(cells[3].textContent).toBe('+1.00%');
 fireEvent.click(screen.getByRole('button',{name:'相邻变化'}));fireEvent.click(screen.getByRole('button',{name:'流出'}));const delta=within(table).getAllByRole('row')[1].querySelectorAll('td');expect(delta[2].textContent).toBe('-1.00');expect(delta[3].textContent).toBe('+1.00%');
});

test('changing category while adjacent-change mode is selected survives the next category loading state',()=>{
 const r=render(<FundPulsePanel kind="industry" data={data}/>);fireEvent.click(screen.getByRole('button',{name:'相邻变化'}));
 expect(()=>r.rerender(<FundPulsePanel kind="concept"/>)).not.toThrow();expect(screen.getByRole('status',{name:'正在加载资金概念'})).toBeTruthy();expect(screen.queryByText('半导体')).toBeNull();
 r.rerender(<FundPulsePanel kind="concept" data={{...data,kind:'concept'}}/>);expect(screen.getByRole('button',{name:'累计净额'}).getAttribute('aria-pressed')).toBe('true');
});
