window.GLHuman=(()=>{
  let widget=null,token='',loading=null;
  async function script(){
    if(window.turnstile)return;
    if(!loading)loading=new Promise((resolve,reject)=>{
      const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;
      s.onload=resolve;s.onerror=()=>reject(new Error('人类验证组件加载失败，请检查网络'));document.head.append(s);
    });
    await loading;
    if(!window.turnstile)throw new Error('人类验证组件不可用');
  }
  function clear(){token='';if(widget!==null&&window.turnstile){try{window.turnstile.remove(widget);}catch{}}widget=null;}
  async function mount(root=document){
    clear();const host=root.querySelector('#humanBox');if(!host)return;
    try{
      const response=await fetch('/api/auth/config',{credentials:'same-origin'});
      if(!response.ok)throw new Error('无法读取人类验证配置');
      const config=await response.json();
      if(!config.turnstileSitekey)throw new Error('人类验证尚未配置，暂不能发送验证码');
      await script();if(!host.isConnected)return;
      host.textContent='';
      widget=window.turnstile.render(host,{sitekey:config.turnstileSitekey,action:'auth_email',callback:value=>{token=value;},'expired-callback':()=>{token='';},'error-callback':()=>{token='';host.dataset.error='验证失败，请重试';}});
    }catch(error){if(host.isConnected)host.textContent=error.message;}
  }
  function value(){return token;}
  function reset(){token='';if(widget!==null&&window.turnstile)window.turnstile.reset(widget);}
  return {mount,value,reset,clear};
})();
