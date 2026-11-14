import {Suspense,useState} from 'react';
import {Drawer,Skeleton} from './components';
import {OfficialStockAlerts as StockAlerts}from'./OfficialServices';
export default function StockAlertButton({code}:{code:string}){
 const [open,setOpen]=useState(false);
 return <><button className="outline-button" onClick={()=>setOpen(true)}>设置提醒</button><Drawer open={open} onOpenChange={setOpen} title="设置个股提醒"><Suspense fallback={<Skeleton label="个股提醒规则"/>}><StockAlerts code={code}/></Suspense></Drawer></>;
}
