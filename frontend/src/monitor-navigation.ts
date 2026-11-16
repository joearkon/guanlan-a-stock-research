// Preview exposes the page only; it must not enable unpublished data reads.
export const fundPulsePreview=(import.meta.env.VITE_FUND_PULSE_ENABLED??'preview')==='preview';
export const fundPulseEnabled=fundPulsePreview||import.meta.env.VITE_FUND_PULSE_ENABLED==='1';
export function monitorLinks(enabled=fundPulseEnabled):[string,string][]{return [['/monitor','实时动态'],['/relay','异动接力'],...(enabled?[['/fund-pulse','资金脉冲'] as [string,string]]:[]),['/auction','竞价盘中']];}
export function isMonitorPath(path:string,enabled=fundPulseEnabled){return /^\/(monitor|relay|auction)(\/|$)/.test(path)||(enabled&&/^\/fund-pulse(\/|$)/.test(path));}
