import {expect,test,vi} from 'vitest';
import {monitorLinks,isMonitorPath} from './monitor-navigation';

test('monitor navigation places fund pulse before auction while retaining all existing destinations',()=>{
 expect(monitorLinks(true)).toEqual([['/monitor','实时动态'],['/relay','异动接力'],['/fund-pulse','资金脉冲'],['/auction','竞价盘中']]);
});
test('fund pulse stays out of public navigation until source acceptance, then joins monitoring on desktop and mobile',()=>{
 expect(monitorLinks(false).map(x=>x[0])).not.toContain('/fund-pulse');
 expect(monitorLinks(true)).toContainEqual(['/fund-pulse','资金脉冲']);
 expect(isMonitorPath('/fund-pulse',false)).toBe(false);expect(isMonitorPath('/fund-pulse',true)).toBe(true);
 expect(isMonitorPath('/funding-observation',true)).toBe(false);
 expect(isMonitorPath('/relay',false)).toBe(true);
});
test('explicit preview build makes the entry reachable without declaring live data enabled',async()=>{
 vi.stubEnv('VITE_FUND_PULSE_ENABLED','preview');vi.resetModules();
 try{const nav=await import('./monitor-navigation');expect(nav.monitorLinks()).toContainEqual(['/fund-pulse','资金脉冲']);expect(nav.isMonitorPath('/fund-pulse')).toBe(true);expect(nav.fundPulsePreview).toBe(true);}
 finally{vi.unstubAllEnvs();vi.resetModules();}
});
test('snapshot mode exposes independent archived reads without hiding the monitoring entry',async()=>{
 vi.stubEnv('VITE_FUND_PULSE_ENABLED','snapshots');vi.resetModules();
 try{const nav=await import('./monitor-navigation');expect(nav.fundPulseEnabled).toBe(true);expect(nav.fundPulsePreview).toBe(false);expect(nav.monitorLinks()).toContainEqual(['/fund-pulse','资金脉冲']);}finally{vi.unstubAllEnvs();vi.resetModules();}
});
