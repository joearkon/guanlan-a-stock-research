import{diagnosticPage,diagnosticFile}from'../../web/shared/client-error-contract.mjs';
type Kind='render'|'resource'|'runtime'|'promise';
type Options={page?:string;entry?:string;online?:boolean;width?:number;asset?:string|null};
export function buildErrorDiagnostic(error:unknown,kind:Kind,options:Options={}){
 const e=error instanceof Error?error:null,frames:{file:string;line:number;column:number}[]=[];
 // Only bundled file/line/column. Never send function names, original stack or URL arguments.
 for(const line of (e?.stack||'').split('\n').slice(0,24)){
  const m=line.match(/(?:https?:\/\/[^\s/]+)?\/next\/assets\/([A-Za-z][\w-]*\.js)(?:\?[^\s)]*)?:(\d+):(\d+)/);if(!m)continue;
  const f={file:m[1],line:Number(m[2]),column:Number(m[3])};if(diagnosticFile(f.file)&&f.line>0&&f.column>0&&f.line<=10000000&&f.column<=10000000)frames.push(f);if(frames.length===8)break;
 }
 const asset=options.asset||e?.message.match(/\/next\/assets\/([A-Za-z][\w-]*\.js)/)?.[1];
 return{id:crypto.randomUUID(),page:diagnosticPage(options.page??location.pathname),kind,errorType:e&&['Error','TypeError','ReferenceError','SyntaxError','RangeError'].includes(e.name)?e.name:'Unknown',reactCode:e?.message.match(/Minified React error #(\d{1,4})\b/)?.[1]||null,entry:diagnosticFile(options.entry||[...document.scripts].map(s=>s.src.match(/\/next\/assets\/(index-[\w-]+\.js)(?:[?#]|$)/)?.[1]).find(Boolean))||'unknown',asset:diagnosticFile(asset),frames,viewport:(options.width??innerWidth)<768?'mobile':(options.width??innerWidth)<1100?'tablet':'desktop',online:options.online??navigator.onLine};
}
export function createErrorReporter(send:(value:ReturnType<typeof buildErrorDiagnostic>)=>Promise<unknown>){
 const seen=new Map<string,string>();let count=0;
 return(error:unknown,kind:Kind,options:Options={})=>{try{const d=buildErrorDiagnostic(error,kind,options),key=JSON.stringify({...d,id:null,kind:null});if(seen.has(key))return seen.get(key)!;if(count>=5)return null;seen.set(key,d.id);count++;void send(d).catch(()=>{});return d.id;}catch{return null;}};
}
export const reportClientError=createErrorReporter(async d=>{
 // Non-blocking, same origin, no retries and no third-party telemetry SDK.
 await fetch('/api/client-errors',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','x-gl':'1'},body:JSON.stringify(d),signal:AbortSignal.timeout(4000),keepalive:true});
});
export function installErrorListeners(){
 const runtime=(event:ErrorEvent|Event)=>{if(event instanceof ErrorEvent){if(event.error)reportClientError(event.error,'runtime');return;}const target=event.target;if(target instanceof HTMLScriptElement){const url=new URL(target.src,location.href);if(url.origin===location.origin){const asset=url.pathname.match(/^\/next\/assets\/([A-Za-z][\w-]*\.js)$/)?.[1];if(asset)reportClientError(null,'resource',{asset});}}};
 const rejection=(event:PromiseRejectionEvent)=>{if(event.reason instanceof Error&&!['AbortError','TimeoutError'].includes(event.reason.name))reportClientError(event.reason,'promise');};
 window.addEventListener('error',runtime,true);window.addEventListener('unhandledrejection',rejection);
 return()=>{window.removeEventListener('error',runtime,true);window.removeEventListener('unhandledrejection',rejection);};
}
