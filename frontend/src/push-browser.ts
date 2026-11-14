const decode=(value:string)=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export async function subscribeBrowser(publicKey:string):Promise<PushSubscription>{
 if(typeof Notification==='undefined')throw Error('当前浏览器不支持系统通知，可继续使用站内收件箱');
 if(Notification.permission==='denied')throw Error('浏览器通知已关闭，请先在站点设置中允许，再回来授权');
 if(!('serviceWorker' in navigator)||typeof PushManager==='undefined')throw Error('当前浏览器不支持Web Push，可继续使用站内收件箱');
 // Called only by an explicit button click, never on page load.
 const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
 if(permission!=='granted')throw Error('尚未获得浏览器通知授权，站内消息不受影响');
 const registration=await navigator.serviceWorker.register('/next/push-sw.js',{scope:'/next/'});
 if(!registration.active)await new Promise<void>((resolve,reject)=>{
  const worker=registration.installing||registration.waiting;if(!worker){reject(Error('通知服务尚未就绪，请重试'));return;}
  const timer=setTimeout(()=>{worker.removeEventListener('statechange',change);reject(Error('通知服务启动超时，请重试'));},10000);
  function change(){if(worker!.state==='activated'){clearTimeout(timer);worker!.removeEventListener('statechange',change);resolve();}else if(worker!.state==='redundant'){clearTimeout(timer);reject(Error('通知服务未能启动'));}}
  worker.addEventListener('statechange',change);change();
 });
 const key=decode(publicKey),current=await registration.pushManager.getSubscription(),oldKey=current?.options?.applicationServerKey;
 if(current&&oldKey){const raw=new Uint8Array(oldKey);if(raw.length===key.length&&raw.every((n,i)=>n===key[i]))return current;await current.unsubscribe();}
 else if(current)return current;
 return registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
}
