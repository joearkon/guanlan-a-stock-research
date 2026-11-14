import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';import {randomUUID} from 'node:crypto';import path from 'node:path';import {fail} from './core.mjs';
export const deepSeekBilling='DeepSeek 本人 API 余额（含联网工具费用）';
function crypt(mode,value){
 if(process.platform!=='win32')return Promise.reject(fail('vault_unavailable','当前仅支持 Windows 用户级凭据加密；没有明文回退。'));
 return new Promise((resolve,reject)=>{
  const child=spawn(path.join(process.env.SystemRoot||'C:/Windows','System32/WindowsPowerShell/v1.0/powershell.exe'),['-NoProfile','-NonInteractive','-File',fileURLToPath(new URL('./dpapi.ps1',import.meta.url))],{windowsHide:true,stdio:['pipe','pipe','ignore']});
  let output='',settled=false;const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(fail('vault_unavailable','本机凭据加解密未完成；旧配置保留，没有明文回退。')):resolve(result);};
  const timer=setTimeout(()=>{child.kill();finish(true);},15000);
  child.stdout.on('data',chunk=>{output+=chunk;if(output.length>64000){child.kill();finish(true);}});child.on('error',()=>finish(true));child.stdin.on('error',()=>finish(true));
  child.on('close',code=>{try{const result=JSON.parse(output);finish(code!==0||typeof result!=='string',result);}catch{finish(true);}});
  // Secret is sent only over a private pipe, never argv, logs or a shell string.
  child.stdin.end(JSON.stringify({mode,value}));
 });
}
export class ProviderVault{
 constructor(store){this.store=store;}
 status(account){const row=this.store.setting(account,'deepseek')?.value;return{configured:!!row?.sealed,authRevision:row?.sealed?row.revision:null,model:'deepseek-flash',billingSource:deepSeekBilling,storage:'windows_dpapi_current_user'};}
 async save(account,key){if(typeof key!=='string'||!/^[!-~]{8,512}$/.test(key))throw fail('invalid_request','API Key 格式无效，请在本机输入有效密钥。');const sealed=await crypt('seal',key);this.store.setSetting(account,'deepseek',{sealed,revision:randomUUID()});return this.status(account);}
 async remove(account){this.store.setSetting(account,'deepseek',null);return this.status(account);}
 async secret(account,revision){const row=this.store.setting(account,'deepseek')?.value;if(!row?.sealed||!revision||row.revision!==revision)throw fail('provider_config_changed','DeepSeek 密钥已移除或更新；请重新测试，不会使用其他密钥。');return crypt('open',row.sealed);}
}
export function deepSeekCapability(config){return{id:'deepseek',name:'DeepSeek',provider:'api-deepseek',version:config.model,installed:true,authenticated:config.configured,available:config.configured,status:config.configured?'ready':'not_authenticated',authRevision:config.authRevision,billingSource:config.billingSource,detail:config.configured?'本机密钥已加密保存；尚需真实连接测试':'请在本页配置本人 DeepSeek API Key；不是网页聊天额度'};}
