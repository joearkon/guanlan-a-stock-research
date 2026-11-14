import {useState} from 'react';
import {Link} from 'react-router-dom';
import {RecordEditor,RecordHistory} from './StockRecords';
import {PrivacyGuard} from './Privacy';
export default function ResearchRecordDetail({record,onSaved}:{record:any;onSaved:(r:any)=>void}){
 const [editing,setEditing]=useState(false);
 return <PrivacyGuard><div className="stack-form"><div className="research-button-row">{record.origin==='manual'&&<button type="button" className="outline-button" onClick={()=>setEditing(v=>!v)}>{editing?'返回已保存版本':'修订文字档案'}</button>}<Link className="outline-button" to={'/stock?code='+record.stockCode+'&tab=overview'}>查看个股资料</Link></div>{editing?<RecordEditor code={record.stockCode} record={record} evidence={[]} onSaved={onSaved}/>:<RecordHistory id={record.id}/>}</div></PrivacyGuard>;
}
