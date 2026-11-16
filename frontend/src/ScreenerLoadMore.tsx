import {useEffect,useRef} from 'react';
export default function ScreenerLoadMore({count,total,hasMore,busy,waiting,error,onMore,onReload}:{count:number;total:number;hasMore:boolean;busy:boolean;waiting:boolean;error:any;onMore:()=>unknown;onReload:()=>void}){
 const host=useRef<HTMLDivElement>(null),latest=useRef({hasMore,busy,waiting,error,onMore});latest.current={hasMore,busy,waiting,error,onMore};
 useEffect(()=>{if(!host.current||typeof IntersectionObserver==='undefined')return;let entered=false;
  const observer=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting){entered=false;continue;}if(entered)continue;entered=true;const s=latest.current;if(s.hasMore&&!s.busy&&!s.waiting&&!s.error&&document.visibilityState!=='hidden'&&!host.current?.closest('[hidden]'))void s.onMore();}},{rootMargin:'0px 0px 80px 0px'});
  observer.observe(host.current);return()=>observer.disconnect();
 },[]);
 return <div ref={host} className="screener-load-more" aria-label="结果追加加载" aria-busy={busy}>
  <span className="provenance" role="status">{waiting?'正在读取新结果，原列表保留':hasMore||error?`已显示 ${count} / ${total}`:count>=total?`已全部显示 · ${count} / ${total}`:`已显示 ${count} / ${total} · 本批后续记录未取得`}</span>
  {error?<><p role="alert">{error.status===409?'分页快照已失效或不一致，请读取最新共享快照；已加载结果保留。':'追加读取失败，已加载结果保留，不会自动重试。'}</p><button className="outline-button" onClick={error.status===409?onReload:onMore}>{error.status===409?'重新读取最新结果':'重试加载'}</button></>:hasMore&&<button className="outline-button" disabled={busy||waiting} onClick={onMore}>{busy?'正在加载下一批…':'继续加载20条'}</button>}
 </div>;
}
