import {useState} from 'react';
import {Drawer} from './components';
import './theme-frequency.css';

type Props={data?:any;error?:unknown;retry?:()=>void};
const validFrequency=(d:any)=>d?.schema===2&&d?.rankLimit===10&&Array.isArray(d.days)&&Array.isArray(d.missingDays)&&Array.isArray(d.rows)&&typeof d.day==='string'&&typeof d.until==='string';
const rowFor=(data:any,code:string,direction:string)=>{const all=[...(data?.rows||[]),...(data?.extras||[])],same=all.find((r:any)=>r.code===code&&r.direction===direction);if(same)return same;const opposite=all.find((r:any)=>r.code===code&&r.direction!==direction);return opposite?{...empty(direction),code,name:opposite.name,opposite}:undefined;};
const empty=(direction:string)=>({direction,dates:[],ranks:{},count5:0,count10:0,bothDates:[]});

function Distribution({data,row,error,retry}:{data:any;row:any;error?:unknown;retry?:()=>void}){
 const primary=row||empty('rise'),other=primary.opposite||empty(primary.direction==='rise'?'fall':'rise');
 const up=primary.direction==='rise'?primary:other,down=primary.direction==='fall'?primary:other;
 return <>
  {!!error&&<p className="local-error">上榜频次读取失败，已取得的日期保留。{retry&&<button onClick={retry}>重试频次</button>}</p>}
  {retry&&<button className="outline-button" onClick={retry}>重新读取上榜频次</button>}
  {!data?<p>前10上榜频次尚待准备，不按0天处理。</p>:<>
   <p className="provenance">截至 {data.until.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2}).*/,'$1-$2-$3 $4:$5')} · 热点榜前10 · {data.provider}。{data.provisional?'当日统计中。':'已归档观察。'}</p>
   <p>当前{primary.direction==='fall'?'向下':'向上'}方向：近5日已确认上榜 {primary.count5} 天，近10日 {primary.count10} 天；累计出现，不要求连续。</p>
   <div className="theme-frequency-comparison">
    <span>向上前10：近5日 {up.count5}天 / 近10日 {up.count10}天</span>
    <span>向下前10：近5日 {down.count5}天 / 近10日 {down.count10}天</span>
    <strong>近10日同日双向上榜 {primary.bothDates?.length||0}天</strong>
   </div>
   <div className="theme-frequency-dates">{data.days.map((day:string)=>{
    const missing=data.missingDays.includes(day),u=up.dates.includes(day),d=down.dates.includes(day);
    const state=missing?'缺档':u&&d?'同日双向上榜':u?'仅向上前10':d?'仅向下前10':'已存档未上榜';
    return <span key={day} data-state={missing?'缺档':u&&d?'双向':u||d?'上榜':'未上榜'}>
     <b>{day} · {state}</b>
     {!missing&&(u||d)&&<small>{u?'向上首次第'+up.ranks?.[day]+'名':''}{u&&d?'；':''}{d?'向下首次第'+down.ranks?.[day]+'名':''}</small>}
    </span>;
   })}</div>
   {(!data.calendarComplete||data.missingDays.length>0)&&<p className="provenance">日历或档案未完全覆盖，天数只列已确认记录，不将缺档算作未上榜。</p>}
   <p className="provenance">{data.scope} 同日双向只表示一天内两个方向都曾进入前10，不表示同一时刻，也不是持续走强。不能据此推断后续涨跌。</p>
  </>}
 </>;
}
export function ThemeFrequencyBadge({data:input,board,direction,error,retry}:Props&{board:any;direction:string}){
 const data=validFrequency(input)?input:undefined,[open,setOpen]=useState(false);
 const row=rowFor(data,board.code,direction)||empty(direction);
 return <>
  <button type="button" className="theme-frequency-badge" aria-label={'查看'+board.name+'上榜日期'} onClick={()=>setOpen(true)}>{data?<>前10 · 近5日 {row.count5}天 · 近10日 {row.count10}天{data.missingDays.length?' *':''}</>:'前10上榜频次待准备'}</button>
  <Drawer open={open} onOpenChange={setOpen} title={board.name+' · 上榜日期'}><Distribution data={data} row={row} error={error} retry={retry}/></Drawer>
 </>;
}
export function ThemeContinuity({data:input,error,retry}:Props){
 const data=validFrequency(input)?input:undefined,[window,setWindow]=useState(10),[limit,setLimit]=useState(20),[chosen,setChosen]=useState<any>(null);
 const rows=(data?.rows||[]).filter((r:any)=>r[window===5?'count5':'count10']>0).sort((a:any,b:any)=>b[window===5?'count5':'count10']-a[window===5?'count5':'count10']||b.lastDay.localeCompare(a.lastDay)||a.code.localeCompare(b.code));
 return <section className="theme-continuity" aria-label="题材持续性">
  <header><div><h3>题材持续性</h3><p className="provenance">仅统计热点榜前10，累计出现不代表持续走强。{data?.day&&<>观察截至 {data.day}；{data.provisional?'当日统计中':'已归档'}。</>}</p></div><label>观察范围<select aria-label="持续性观察范围" value={window} onChange={e=>{setWindow(Number(e.target.value));setLimit(20);}}><option value={5}>近5个交易日</option><option value={10}>近10个交易日</option></select></label></header>
  {!!error&&<p className="local-error">持续性资料读取失败，已有结果保留。{retry&&<button onClick={retry}>重试持续性</button>}</p>}
  {!data?<p className="provenance">持续性摘要尚待准备，不按无持续题材处理。</p>:<>
   <p className="provenance">{data.scope}{data.missingDays.length>0&&<> 缺档：{data.missingDays.join('、')}。</>}</p>
   <div className="theme-continuity-scroll"><table><thead><tr><th>方向 / 板块</th><th>前10·近5日</th><th>前10·近10日</th><th>反向前10·5/10日</th><th>双向·所选窗</th><th>最近上榜</th><th>日期分布</th></tr></thead><tbody>{rows.slice(0,limit).map((r:any)=><tr key={r.direction+r.code}>
    <th scope="row">{r.name}<small>{r.direction==='fall'?'向下':'向上'} · {r.code}</small></th><td>{r.count5}天</td><td>{r.count10}天</td><td>{r.opposite?.count5??'—'} / {r.opposite?.count10??'—'}天</td><td>{r.bothDates?.filter((d:string)=>data.days.slice(-window).includes(d)).length||0}天</td><td>{r.lastDay}</td><td><button className="outline-button" aria-label={'查看'+r.name+'上榜日期'} onClick={()=>setChosen(r)}>查看分布</button></td>
   </tr>)}</tbody></table></div>
   {rows.length>limit&&<button className="outline-button" onClick={()=>setLimit(n=>n+20)}>继续显示20个题材</button>}
   {!rows.length&&<p>已存档范围内暂无此方向的前10记录，缺档不作推断。</p>}
  </>}
  <Drawer open={!!chosen} onOpenChange={v=>!v&&setChosen(null)} title={(chosen?.name||'题材')+' · 上榜日期'}>{chosen&&<Distribution data={data} row={chosen} error={error} retry={retry}/>}</Drawer>
 </section>;
}
