import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {ChevronDown,Layers,Activity,Landmark,ExternalLink,Search} from 'lucide-react';
import StockLink from './StockLink';
import {publicQuery,number,pct,tone} from './api';
import {Widget} from './components';
import {beijingStamp} from './observation-shared';
import './high-board.css';
import HighBoardParticipation from './HighBoardParticipation';
import {matchesParticipation} from '../../web/shared/high-board-participation.mjs';
const value=(v:any,unit='')=>v==null?'未覆盖':number(v,2)+unit;
const money=(v:any)=>v==null?'—':number(v/10000,2);
function Leader({row:r,day,disclosureWindow}:{row:any,day:string,disclosureWindow:string}){
 const [open,setOpen]=useState(false),reduce=useReducedMotion();
 const sourceRow=r;r={...r,seats:r.seats.filter(g=>disclosureWindow==='all'||g.window===disclosureWindow)};
 return <article className={'high-board-card'+(open?' is-open':'')}>
  <header className="high-board-row"><div className="high-board-stock"><span className="high-board-height">{r.height}<small>连续板</small></span><div><StockLink code={r.code} name={r.name}/><small>{r.code} · {r.position}</small>{r.stat&&<span className="high-board-interval">{r.stat}</span>}</div></div><div className="high-board-labels">{r.themes.length?r.themes.slice(0,3).map(t=><span key={t.name}>{t.name}</span>):<small>原因标签未覆盖</small>}</div><div className="high-board-number"><small>换手率</small><b>{value(r.turnoverPct,'%')}</b></div><div className="high-board-number"><small>成交额</small><b>{value(r.amountYi,' 亿')}</b></div><div className="high-board-number"><small>当前口径披露</small><b>{r.seats.length?r.seats.length+' 组':sourceRow.seats.length?'其他口径有披露':r.seatStatus==='checked'?'本批未命中':'资料待补'}</b></div><button className="outline-button high-board-toggle" aria-expanded={open} aria-label={(open?'收起':'展开')+r.name+'依据'} onClick={()=>setOpen(v=>!v)}>{open?'收起依据':'查看依据'}<ChevronDown size={15} style={{transform:open?'rotate(180deg)':undefined}}/></button></header>
  <HighBoardParticipation row={sourceRow} window={disclosureWindow} onView={()=>setOpen(true)}/>
  <p className="high-board-summary">{r.observation}</p>
  <AnimatePresence initial={false}>{open&&<motion.div className="high-board-detail" initial={reduce?false:{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0,y:3}} transition={{duration:reduce?0:.18,ease:'easeOut'}}>
   <div className="high-board-evidence-grid"><section><h3><Layers size={17}/>高标归因与梯队</h3>{r.themes.map(t=><div className="high-board-theme" key={t.name}><b>{t.name}</b><p>{t.peers.length?t.peers.slice(0,8).map(p=><StockLink key={p.code} code={p.code} name={p.name}>{p.name} · {p.height}板</StockLink>):'同批封板池未命中其他同标签成员'}</p></div>)}<p className="provenance">题材标签来自已发布涨停池，不是已证明的价格因果。同行为同批封板池，不代表全板块支撑。</p>{r.evidence.map(e=><a key={e.url} href={e.url} target="_blank" rel="noreferrer">{e.title}<ExternalLink size={13}/></a>)}</section>
   <section><h3><Activity size={17}/>换手与封板观察</h3><dl className="high-board-facts"><div><dt>首封 / 末封</dt><dd>{r.first||'未覆盖'} / {r.last||'未覆盖'}</dd></div><div><dt>来源开板次数</dt><dd>{r.breaks==null?'未覆盖':r.breaks+' 次'}</dd></div><div><dt>来源封单快照</dt><dd>{value(r.sealYi,' 亿')}</dd></div><div><dt>已存换手样本中位数</dt><dd>{value(r.support.baselineTurnoverPct,'%')} · {r.support.baselineCount}次</dd></div></dl><b>{r.support.title}</b><p className="provenance">{r.support.note}</p>{r.support.risks.map((t,i)=><p key={i} className="high-board-counter">{t}</p>)}<small className="muted">{r.support.baselineScope}。封单是采样快照，不是买入成交或资金净流入。</small></section></div>
   <section className="high-board-seats"><h3><Landmark size={17}/>龙虎榜席位分析<small>{day} · 金额单位：万元</small></h3>{r.seats.length?r.seats.map(g=><div className="high-board-disclosure" key={g.id}><header><span className={'high-board-window '+(g.window==='daily'?'':'is-cumulative')}>{g.window==='daily'?'单日口径':g.window==='multi'?'累计口径 · 不与单日相加':'窗口未明确 · 独立展示'}</span><b>{g.reason}</b></header><div className="high-board-seat-totals"><span>披露席位去重净额 <b className={tone(g.net)}>{money(g.net)}</b></span><span>机构专用披露净额 <b className={tone(g.institutionNet)}>{money(g.institutionNet)}</b> <small>（{g.institutionRows}条匿名记录）</small></span></div>{g.conflict&&<p className="local-error">同席位记录有冲突或无法区分的重复，暂停金额合计，保留原记录核对。</p>}<div className="quote-scroll"><table className="data-table"><thead><tr><th>席位原名 / 类型</th><th>所在榜侧</th><th>买入</th><th>卖出</th><th>净额</th></tr></thead><tbody>{g.seats.map((s,i)=><tr key={s.identity+'-'+i}><td>{s.name}<small>{s.kind==='institution'?'机构专用 · 不披露具体机构':s.kind==='connect'?'互联互通通道 · 非单一投资者':'证券营业部 · 不推断游资身份'}</small></td><td>{s.sides.map(x=>x==='buy'?'买方前五':'卖方前五').join(' / ')}</td><td>{money(s.buy)}</td><td>{money(s.sell)}</td><td className={tone(s.net)}>{money(s.net)}</td></tr>)}</tbody></table></div><p className="provenance">{g.scope}。空值保留为缺项，不用0代替；净额不是下一日接力承诺。</p></div>):<p className="empty">{r.seatStatus==='checked'?'已核对该日席位明细，未命中本股；不等于从未上榜。':'当日买卖席位尚未完整取得，不能据此判断没有机构或游资参与。'}</p>}<a className="outline-button" href={'https://data.eastmoney.com/stock/lhb,'+day+','+r.code+'.html'} target="_blank" rel="noreferrer">核对本股公开披露<ExternalLink size={14}/></a></section>
   {r.seats.length>0&&<section className="high-board-seats"><h3>席位观察摘要</h3>{r.seats.map(g=><div key={g.id} className="high-board-disclosure"><b>{g.window==='daily'?'单日':g.window==='multi'?'累计':'窗口未明确'} · {g.reason}</b>{g.analysis?.map((text,i)=><p className="provenance" key={i}>{text}</p>)}</div>)}</section>}
  </motion.div>}</AnimatePresence>
 </article>;
}
export default function HighBoardPanel({day}:{day:string}){
 const query=useQuery({...publicQuery('/api/v2/high-board?date='+encodeURIComponent(day),300000),enabled:!!day}),data=query.data;
 const [filter,setFilter]=useState(''),[scope,setScope]=useState('all'),[limit,setLimit]=useState(10),[disclosureWindow,setDisclosureWindow]=useState('all'),[institution,setInstitution]=useState('all'),[known,setKnown]=useState('all');
 const ready=data?.day===day&&data.schema==='high-board-v1',all=ready?data.rows:[],max=Math.max(0,...all.map(r=>r.height)),rows=all.filter(r=>(scope!=='top'||r.height===max)&&matchesParticipation(r,{window:disclosureWindow,institution,known,text:filter}));
 return <div className="high-board-page"><Widget title="高标接力观察" subtitle="高标归因 · 换手封板 · 龙虎榜席位，复用后台共享成品" loading={query.isPending} refreshing={query.isFetching&&!!data} error={query.error?.message} retry={()=>void query.refetch()}>
  <div className="high-board-intro"><span className="high-board-method">规则解读 · 非AI评分</span><p>先看位置与同题材梯队，再核对换手封板和真实席位。只解释已经发生的事实，不推断下一日谁会接力。</p></div>
  {ready?<><div className="high-board-meta"><span>业务日期 <b>{data.day}</b></span><span>最高连续板 <b>{max||'未取得'}</b></span><span>连续2板及以上 <b>{data.total}只</b></span><span>席位资料 <b>{data.coverage.seatsComplete?'整批校验完成':'待补齐'}</b></span></div><p className="provenance">{beijingStamp(data.generatedAt)} · 版本 {data.version?.slice(0,8)||'未提供'} · 封板池覆盖 {data.coverage.pool} / {data.coverage.poolExpected??'未提供'}。{data.note}</p></>:!query.isPending&&<p className="empty">{data?.note||'该日期资料尚未取得，未用其他日期替代。'}</p>}
 </Widget>
 {ready&&<>
  <div className="high-board-tools"><div role="group" aria-label="高标范围"><button className="outline-button" aria-pressed={scope==='all'} onClick={()=>{setScope('all');setLimit(10);}}>全部接力梯队</button><button className="outline-button" aria-pressed={scope==='top'} onClick={()=>{setScope('top');setLimit(10);}}>最高连续板</button></div><label><Search size={16}/><input aria-label="筛选高标" placeholder="股票、题材、营业部或关联名称" value={filter} onChange={e=>{setFilter(e.target.value);setLimit(10);}}/></label><small>{rows.length}只匹配 · 连续板优先</small></div>
  <div className="high-board-filters">
   <label>披露口径<select aria-label="披露口径" value={disclosureWindow} onChange={e=>{setDisclosureWindow(e.target.value);setLimit(10);}}><option value="daily">单日披露</option><option value="multi">累计披露</option><option value="all">全部口径 · 分开列</option><option value="unknown">窗口未明确</option></select></label>
   <label>机构动向<select aria-label="机构动向" value={institution} onChange={e=>{setInstitution(e.target.value);setLimit(10);}}><option value="all">全部</option><option value="net-buy">机构净买入</option><option value="net-sell">机构净卖出</option><option value="buy">机构有买入</option><option value="incomplete">机构金额缺项</option></select></label>
   <label>知名席位<select aria-label="知名席位" value={known} onChange={e=>{setKnown(e.target.value);setLimit(10);}}><option value="all">全部</option><option value="present">有来源关联席位</option><option value="net-buy">知名席位净买入</option><option value="net-sell">知名席位净卖出</option><option value="uncertain">关联待核验</option></select></label>
   <p>筛选仅作用于所选披露口径。机构有买入不等于净买入；没有匹配记录不等于无人参与。</p>
  </div>
  {rows.slice(0,limit).map(r=><Leader key={day+r.code+disclosureWindow} row={r} day={day} disclosureWindow={disclosureWindow}/>)}
  {!rows.length&&<p className="empty">当前条件未命中已收录高标；可切换披露口径或清除参与者筛选，不代表市场没有相关交易。</p>}
  {rows.length>limit&&<button className="outline-button" onClick={()=>setLimit(v=>v+10)}>继续显示10只</button>}
  <details className="high-board-appendix"><summary>来源、覆盖与分析边界</summary><p>盘中只复用共享报价观察昨日封板股的再封板，不重新抓全市场；本页读取所选收盘日成品。盘后统一核验席位、生成规则解读并留版本，打开和刷新页面不调用模型。</p><p>席位金额保留原币种人民币，展示换算为万元。单日与累计窗口、不同上榜原因独立展示，不合并为“主力总额”。同一单日不同上榜原因且整组金额完全相同的列表摘要折为一组，原因全部保留，展开明细仍逐组列出，不相加。</p><p>知名席位仅使用带来源、报道日期和核对日期的精确营业部名称目录，不按街道名或相似名称猜配。媒体历史关联不是本次交易身份确认；关联不一致明确待核验，未命中目录不等于没有游资。目录版本 {data.associationVersion||'尚未补齐'}。</p>{data.sources.map((s,i)=><p key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.name}<ExternalLink size={12}/></a> · {s.date||'日期未提供'} · {beijingStamp(s.fetchedAt)}</p>)}</details>
 </>}
 </div>;
}
