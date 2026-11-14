// @vitest-environment jsdom
import {test,expect,afterEach}from'vitest';import {render,screen,cleanup}from'@testing-library/react';import LiveEventStream from'./LiveEventStream';
afterEach(cleanup);
test('an empty saved day is not described as the current intraday window',()=>{
 render(<LiveEventStream events={[]} onSelect={()=>{}} remote/>);
 expect(screen.getByText('该日已存档范围暂无匹配事件；是否完整请查看采样覆盖。',{exact:true})).toBeTruthy();expect(screen.queryByText('当前采样窗口暂无盘中事件。',{exact:true})).toBeNull();
});
