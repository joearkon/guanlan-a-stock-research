import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {JSDOM} from 'jsdom';
const root=process.env.CRITICAL_BUILD_DIR||fileURLToPath(new URL('../../web/dist/next',import.meta.url)),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const [route,name]of [['/','Home'],['/screener','StockObservation'],['/relay','Relay'],['/fund-pulse','FundPulse']])test('HTML starts identity and current '+route+' resources before the main module executes',async()=>{
 const dom=new JSDOM(html,{url:'https://example.invalid/next'+route,runScripts:'outside-only'}),calls=[];dom.window.fetch=async(u,opt)=>{calls.push({u,opt});return new Response('{}');};dom.window.AbortSignal.timeout=()=>new dom.window.AbortController().signal;
 const initialLinks=new Set([...dom.window.document.querySelectorAll('link[rel=modulepreload]')].map(e=>e.getAttribute('href')));
 for(const s of dom.window.document.scripts)if(!s.src&&s.type!=='module')dom.window.eval(s.textContent);
 assert.deepEqual(calls.map(c=>String(c.u)),['/api/me']);assert.equal(calls[0].opt.credentials,'same-origin');
 const links=[...dom.window.document.querySelectorAll('link[rel=modulepreload]')].map(e=>e.getAttribute('href'));assert.ok(links.some(h=>new RegExp('/'+name+'-[^/]+\\.js$').test(h)),name+' code was not prepared early');
 assert.ok(links.filter(h=>!initialLinks.has(h)).length<=1,'route preparation must not eagerly compete with identity for the full dependency graph');
 for(const h of links){assert.ok(h.startsWith('/next/assets/'));assert.ok(fs.existsSync(path.join(root,h.replace('/next/',''))));}dom.window.close();
});
