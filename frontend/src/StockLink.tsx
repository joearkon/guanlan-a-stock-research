import {createContext,lazy,Suspense,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import {useLocation} from 'react-router-dom';
import PageLoading from './PageLoading';
type Stock={code:string,name?:string};
const OpenStock=createContext<((stock:Stock)=>void)|null>(null);
const Quote=lazy(()=>import('./StockQuoteDrawer'));
export function StockDrawerProvider({children}:{children:ReactNode}){
 const [stock,setStock]=useState<Stock|null>(null),location=useLocation(),open=useCallback((value:Stock)=>setStock(value),[]);
 useEffect(()=>setStock(null),[location.pathname]);
 return <OpenStock.Provider value={open}>{children}{stock&&<Suspense fallback={<PageLoading label="正在打开个股行情" variant="overlay"/>}><Quote stock={stock} onClose={()=>setStock(null)}/></Suspense>}</OpenStock.Provider>;
}
export function useOpenStock(){return useContext(OpenStock);}
export default function StockLink({code,name,kind='stock',children,className='',onInspect}:{code:string,name?:string,kind?:string,children?:ReactNode,className?:string,onInspect?:()=>void}){
 const open=useOpenStock(),[local,setLocal]=useState<Stock|null>(null),stock=useMemo(()=>({code,name}),[code,name]);
 if(kind!=='stock'||!/^\d{6}$/.test(String(code||'')))return <span className={className}>{children||name||code}</span>;
 return <><button type="button" className={'stock-link '+className} aria-label={'查看'+(name||code)+'行情详情'} onClick={e=>{e.stopPropagation();onInspect?.();if(open)open(stock);else setLocal(stock);}}>{children||name||code}</button>{local&&<Suspense fallback={<PageLoading label="正在打开个股行情" variant="overlay"/>}><Quote stock={local} onClose={()=>setLocal(null)}/></Suspense>}</>;
}
