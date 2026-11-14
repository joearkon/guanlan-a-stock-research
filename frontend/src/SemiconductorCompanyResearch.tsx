import {semiconductorResearch} from './semiconductor-company-research';
const amount=(v:number)=>(v/1e8).toFixed(2)+' 亿元';
const change=(v:number|null)=>v===null?'同比不适用':`同比 ${v>0?'+':''}${v.toFixed(2)}%`;
export default function SemiconductorCompanyResearch({code}:{code:string}){
 const c=semiconductorResearch(code);if(!c)return null;
 return <section className="sw-section" aria-label="已核对公司价值研究"><header><h2>公司赚钱路径与价值研究</h2><span>{c.version} · 整理 2026-11-11</span></header><p>{c.money}</p><p>{c.moat}</p><div className="sw-kpis">{[['收入',c.revenue,c.revenueYoy],['归母净利润',c.profit,c.profitYoy],['经营现金',c.cash,c.cashYoy]].map(([label,value,yoy])=><article key={String(label)}><h3>{label}</h3><strong className={Number(value)<0?'down':''}>{amount(Number(value))}</strong><small>{change(yoy as number|null)}</small></article>)}</div><small>{c.period} · 合并累计人民币元换算亿元 · 季报未经审计 · 披露 {c.date}，非实时刷新</small><p>{c.cashNote}</p><div className="company-four-questions">{c.answers.map((answer,i)=><article key={i}><h3>{['利润来源与产业位置','持续获利与现金兑现','估值边界与价格预期','反证与持续验证'][i]}</h3><p>{answer}</p></article>)}</div><div className="cr-refs"><a className="outline-button" href={c.source} target="_blank" rel="noopener noreferrer">{c.sourceTitle} · {c.date}</a><a className="outline-button" href={c.businessSource} target="_blank" rel="noopener noreferrer">{c.businessTitle}</a></div></section>;
}
