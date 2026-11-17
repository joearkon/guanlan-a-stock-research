// @vitest-environment jsdom
import {expect,test} from 'vitest';
import {render,screen} from '@testing-library/react';
import ChartCredits from './ChartCredits';
test('local chart credits use the existing public static prefix rather than the SPA fallback',()=>{
 render(<ChartCredits/>);expect(screen.getByRole('link',{name:'图表引擎与开源许可'}).getAttribute('href')).toBe('/next/licenses/chart-licenses.html');
});
