// @vitest-environment jsdom
import {test,expect,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import LiveEventStream from './LiveEventStream';
test('event window changes keep their signs and use market direction colors, while missing values stay neutral',()=>{
 const view=render(<LiveEventStream events={[{code:'600021',name:'上行样本',kind:'急拉',time:'20261116140000',change_pct:1.53},{code:'600022',name:'下行样本',kind:'急跌',time:'20261116135900',change_pct:-2.01},{code:'600023',name:'缺项样本',kind:'急拉',time:'20261116135800',change_pct:null}]} onSelect={()=>{}}/>);
 try{expect(view.getByText('+1.53%').className).toContain('up');expect(view.getByText('-2.01%').className).toContain('down');expect(view.getByText('—').className).not.toMatch(/up|down/);}finally{view.unmount();}
});
test('an unsorted recent snapshot renders newest event first without mutating the source',()=>{
 const source=[{code:'600111',name:'较早窗口',kind:'急拉',time:'20261029135654'},{code:'600112',name:'最新窗口',kind:'急拉',time:'20261029135700'}];
 const view=render(<LiveEventStream events={source} onSelect={()=>{}}/>);
 try{expect(view.getAllByRole('listitem')[0].textContent).toContain('最新窗口');expect(source[0].name).toBe('较早窗口');}finally{view.unmount();}
});
test('the event evidence action marks only the inspected event, without making the whole row a button',()=>{
 const onSelect=vi.fn();render(<LiveEventStream events={[{code:'600001',name:'事件甲',kind:'急拉',time:'20261029140000'},{code:'600002',name:'事件乙',kind:'急跌',time:'20261029135900'}]} onSelect={onSelect}/>);
 const rows=screen.getAllByRole('listitem');fireEvent.click(screen.getByRole('button',{name:'查看事件甲急拉触发依据'}));expect(rows[0].getAttribute('data-selected')).toBe('true');expect(rows[1].getAttribute('data-selected')).toBe('false');fireEvent.click(screen.getByRole('button',{name:'查看事件乙急跌触发依据'}));expect(rows[0].getAttribute('data-selected')).toBe('false');expect(rows[1].getAttribute('data-selected')).toBe('true');expect(onSelect).toHaveBeenCalledTimes(2);
});
