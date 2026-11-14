// Shared by React and the retained v2 pages. Scroll state never refetches data.
export function bindSectionNavigation(root){
 const doc=root.ownerDocument,win=doc.defaultView,scope=root.matches('nav')?(root.parentElement||root):root;
 let frame=0,requested=null,expires=0,initialHash=true,destroyed=false,waiting=false,settled=null;
 const nav=()=>root.matches('nav')?root:root.querySelector('.mo-anchors,.anchor-tabs');
 const buttons=()=>[...(nav()?.querySelectorAll('[data-mo-anchor],a[href^="#"]')||[])];
 const idOf=el=>el.dataset.moAnchor||el.getAttribute('href')?.slice(1);
 const reduced=()=>doc.documentElement.dataset.uiMotion==='reduced'||win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const vertical=()=>{const n=nav();return n?.classList.contains('section-nav-rail')&&win.getComputedStyle(n).getPropertyValue('--section-nav-axis').trim()!=='horizontal';};
 const gap=()=>{const n=nav();return n?(parseFloat(win.getComputedStyle(n).top)||0)+(vertical()?0:n.getBoundingClientRect().height)+12:12;};
 const destination=target=>{const top=Math.max(0,win.scrollY+target.getBoundingClientRect().top-gap()),maximum=doc.documentElement.scrollHeight-win.innerHeight;return maximum>0?Math.min(top,maximum):top;};
 function mark(id){
  const n=nav();if(!n)return;
  n.classList.add('section-nav');
  const links=buttons(),selected=links.find(el=>idOf(el)===id);if(!selected)return;
  for(const el of links){if(el===selected)el.setAttribute('aria-current','location');else el.removeAttribute('aria-current');}
  let line=n.querySelector('.section-nav-indicator');
  if(!line){line=doc.createElement('span');line.className='section-nav-indicator';line.setAttribute('aria-hidden','true');n.append(line);}
  line.style.transform=vertical()?'translate3d(0,'+selected.offsetTop+'px,0) scaleY('+selected.offsetHeight+')':'translate3d('+selected.offsetLeft+'px,0,0) scaleX('+selected.offsetWidth+')';
  const left=selected.offsetLeft,right=left+selected.offsetWidth;
  if(!vertical()&&(left<n.scrollLeft||right>n.scrollLeft+n.clientWidth)&&n.clientWidth>0)n.scrollTo?.({left:Math.max(0,left-(n.clientWidth-selected.offsetWidth)/2),behavior:reduced()?'instant':'smooth'});
 }
 function go(id,updateHash=true){
  if(!buttons().some(el=>idOf(el)===id))return;
  requested=id;settled=null;expires=Date.now()+1500;initialHash=false;mark(id);
  if(updateHash){const url=new URL(win.location.href);url.hash=id;win.history.replaceState(win.history.state,'',url);}
  const target=doc.getElementById(id);waiting=!target;if(target)win.scrollTo({top:destination(target),behavior:reduced()?'instant':'smooth'});
 }
 function sync(){
  frame=0;if(destroyed)return;
  const n=nav(),links=buttons();if(!n||!links.length)return;
  if(initialHash){let id='';try{id=decodeURIComponent(win.location.hash.slice(1));}catch{}initialHash=false;if(links.some(el=>idOf(el)===id)){go(id,false);return;}}
  if(requested){const target=doc.getElementById(requested);if(!target)return;if(waiting){go(requested,false);return;}if(Math.abs(win.scrollY-destination(target))<=3){mark(requested);settled={id:requested,y:win.scrollY};requested=null;return;}if(Date.now()<expires){mark(requested);return;}requested=null;}
  if(settled&&Math.abs(win.scrollY-settled.y)<=3){mark(settled.id);return;}settled=null;
  const edge=vertical()?gap()+4:n.getBoundingClientRect().bottom+16,visible=links.filter(el=>doc.getElementById(idOf(el)));
  let current=idOf(visible[0]||links[0]);
  for(const el of visible)if(doc.getElementById(idOf(el)).getBoundingClientRect().top<=edge)current=idOf(el);
  const maximum=doc.documentElement.scrollHeight-win.innerHeight;
  if(maximum>0&&win.scrollY>=maximum-3&&visible.length)current=idOf(visible.at(-1));
  mark(current);
 }
 const schedule=()=>{if(!frame&&!destroyed)frame=win.requestAnimationFrame(sync);};
 const interrupt=()=>{requested=null;settled=null;initialHash=false;schedule();};
 const onKey=e=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key))interrupt();};
 const onClick=e=>{const n=nav(),el=e.target.closest('[data-mo-anchor],a[href^="#"]');if(!n||!el||!n.contains(el)||e.button>0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();go(idOf(el));};
 const hash=()=>{let id='';try{id=decodeURIComponent(win.location.hash.slice(1));}catch{}go(id,false);};
 root.addEventListener('click',onClick);
 win.addEventListener('scroll',schedule,{passive:true});win.addEventListener('resize',schedule,{passive:true});win.addEventListener('hashchange',hash);
 win.addEventListener('wheel',interrupt,{passive:true});win.addEventListener('touchstart',interrupt,{passive:true});win.addEventListener('pointerdown',interrupt,{passive:true});win.addEventListener('keydown',onKey);
 const observer=new win.MutationObserver(schedule);observer.observe(scope,{childList:true,subtree:true});
 const resize=win.ResizeObserver?new win.ResizeObserver(schedule):null;resize?.observe(scope);
 schedule();
 return()=>{destroyed=true;win.cancelAnimationFrame(frame);observer.disconnect();resize?.disconnect();root.removeEventListener('click',onClick);win.removeEventListener('scroll',schedule);win.removeEventListener('resize',schedule);win.removeEventListener('hashchange',hash);win.removeEventListener('wheel',interrupt);win.removeEventListener('touchstart',interrupt);win.removeEventListener('pointerdown',interrupt);win.removeEventListener('keydown',onKey);};
}
