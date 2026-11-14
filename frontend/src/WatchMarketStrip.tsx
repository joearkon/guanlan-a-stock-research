import Prices from '../../web/v2/price-policy.mjs';
import {number,pct,tone} from './api';
export default function WatchMarketStrip({free,live}:{free:any,live:any}){return <div className="watch-market-strip" role="group" aria-label="大盘行情">{[['000001','上证'],['399001','深成'],['399006','创业']].map(([code,name])=>{const q=Prices.index(live,free?.indices?.find(i=>i.code===code)||{code},free?.asof);return <span key={code} title={q.label}>{name}<b>{number(q.price)}</b><em className={tone(q.pct)}>{pct(q.pct)}</em></span>;})}</div>;}
