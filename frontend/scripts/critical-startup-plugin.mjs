import {readFileSync} from 'node:fs';
const routes={'/':'Home','/screener':'StockObservation','/relay':'Relay','/fund-pulse':'FundPulse','/monitor':'Monitor','/auction':'Auction','/watchlist':'Portfolio','/holdings':'Portfolio','/my-research':'MyResearch','/stock':'Stock','/market-observation':'ReviewWorkspace','/industry':'IndustryHub'};
export default function criticalStartupPlugin(){return {name:'guanlan-critical-startup',transformIndexHtml:{order:'post',handler(_html,context){
 const bundle=context.bundle,manifest={};
 // Prepare only the route entry. Eagerly traversing every dependency competes
 // with identity and the shell on cold connections; Vite owns that graph.
 if(bundle)for(const [route,name]of Object.entries(routes)){const chunk=Object.values(bundle).find(v=>v.type==='chunk'&&v.name===name);if(!chunk)continue;manifest[route]={js:['/next/'+chunk.fileName],css:[...(chunk.viteMetadata?.importedCss||[])].map(f=>'/next/'+f)};}
 const loader=`(()=>{const routes=${JSON.stringify(manifest).replace(/</g,'\\u003c')},route=location.pathname.replace(/^\\/next/,'')||'/',assets=routes[route];if(!assets)return;for(const [rel,files]of [['modulepreload',assets.js],['stylesheet',assets.css]])for(const href of files){if(!href.startsWith('/next/assets/')||[...document.querySelectorAll('link')].some(e=>e.getAttribute('href')===href&&e.rel===rel))continue;const link=document.createElement('link');link.rel=rel;link.href=href;if(rel==='modulepreload')link.crossOrigin='';document.head.appendChild(link);}})();`;
 return [{tag:'script',children:readFileSync(new URL('../src/startup-bootstrap.js',import.meta.url),'utf8'),injectTo:'head-prepend'},{tag:'script',children:loader,injectTo:'head-prepend'}];
 }}};}
