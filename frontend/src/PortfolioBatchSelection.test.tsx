// @vitest-environment jsdom
import {test,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {QuoteTable} from './components';
afterEach(cleanup);
test('batch checkbox and row taps use typed identities without selecting the quote or opening editing',()=>{
 const toggle=vi.fn(),select=vi.fn(),edit=vi.fn(),Table=QuoteTable as any;
 render(<Table rows={[{code:'600001',name:'甲',kind:'stock'},{code:'600001',name:'乙ETF',kind:'etf'}]} quotes={{}} selected="600001" onSelect={select} onManage={edit} selection={{keys:['etf:600001'],onToggle:toggle}}/>);
 expect(screen.getByRole('checkbox',{name:'选择乙ETF 600001'})).toHaveProperty('checked',true);
 fireEvent.click(screen.getByRole('checkbox',{name:'选择甲 600001'}));expect(toggle).toHaveBeenCalledExactlyOnceWith('stock:600001');expect(select).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('row',{name:/乙ETF/}));expect(toggle).toHaveBeenLastCalledWith('etf:600001');expect(select).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'管理甲'})).toHaveProperty('disabled',true);expect(edit).not.toHaveBeenCalled();
});
