// Push-only worker. It does not intercept fetch, cache business data, or change
// page navigation. Clicks focus an existing page and ask its local drawer to open.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
 let data={};try{data=event.data?.json()||{};}catch{}
 const id=/^[0-9a-f-]{36}$/i.test(data.tag||'')?data.tag:null;
 event.waitUntil(self.registration.showNotification(String(data.title||'观澜提醒').slice(0,60),{
  body:'有一条事实需要复核，请打开消息中心查看来源与条件。',
  tag:id||'guanlan-facts',renotify:false,data:{id},
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();const id=event.notification.data?.id;
 event.waitUntil((async()=>{
  const list=await self.clients.matchAll({type:'window',includeUncontrolled:true}),client=list.find(c=>new URL(c.url).origin===self.location.origin&&new URL(c.url).pathname.startsWith('/next/'));
  if(client){client.postMessage({type:'guanlan-open-notification',id});return client.focus();}
  return self.clients.openWindow('/next/notifications'+(id?'?message='+encodeURIComponent(id):''));
 })());
});
