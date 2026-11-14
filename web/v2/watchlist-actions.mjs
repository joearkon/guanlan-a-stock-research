const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validDate=value=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(`${value}T00:00:00Z`);
 return Number.isFinite(+date)&&date.toISOString().slice(0,10)===value;
};
const identity=item=>({kind:item?.kind||'stock',code:String(item?.code||'')});
const asList=value=>Array.isArray(value)?value:[];

export function watchlistActionsMarkup({mode='manage',item={},error='',busy=false}={}){
 const title=esc(item.name||item.code||'关注对象');
 const status=error?`<p class="wa-error" role="alert">${esc(error)}</p>`:'';
 const close='<button type="button" data-wa-action="close" class="wa-button">关闭</button>';
 let content;
 if(mode==='remove')content=`<h2 id="wa-title">移除${title}？</h2><p>移出当前观察池；已保存的研究记录不会删除。</p><div class="wa-actions">${close}<button type="button" data-wa-action="confirm-remove" class="wa-button wa-danger" ${busy?'disabled':''}>移除关注</button></div>`;
 else if(mode==='removed')content=`<h2 id="wa-title">已从观察池移除</h2><p>${title}的研究记录仍保留；你可以撤销本次移除。</p><div class="wa-actions">${close}<button type="button" data-wa-action="undo" class="wa-button wa-primary" ${busy?'disabled':''}>撤销移除</button></div>`;
 else{
  const tasks=asList(item.tasks).map(task=>`<li class="wa-task"><button type="button" data-wa-action="toggle-task" data-task-id="${esc(task.id)}" aria-label="${task.done?'恢复':'完成'}：${esc(task.text)}" ${busy?'disabled':''}>${task.done?'☑':'□'}</button><span>${esc(task.text)}</span>${task.dueDate?`<time>${esc(task.dueDate)}</time>`:''}</li>`).join('');
  const stages=['未标注研究阶段','待研究','研究中','待复核'];
  const selected=stages.includes(item.status)?item.status:stages[0];
  content=`<h2 id="wa-title">${title} · 研究跟踪</h2><p class="wa-meta">${esc(item.code||'')} · 关注原因与复核任务属于当前账号记录</p>
   <form data-wa-form="reason"><label for="wa-reason">关注原因</label><textarea id="wa-reason" name="reason" maxlength="600" placeholder="由你填写，不自动生成">${esc(item.reason||'')}</textarea><button type="submit" class="wa-button wa-primary" ${busy?'disabled':''}>保存关注原因</button></form>
   <form data-wa-form="research"><label for="wa-focus">关键关注点 · 下一项需核对的事实</label><input id="wa-focus" name="focus" maxlength="120" value="${esc(item.focus||'')}" placeholder="例如核对下一期现金流"><label for="wa-status">研究阶段 · 当前账号记录</label><select id="wa-status" name="status">${stages.map(stage=>`<option value="${stage}" ${stage===selected?'selected':''}>${stage}</option>`).join('')}</select><button type="submit" class="wa-button" ${busy?'disabled':''}>保存研究跟踪</button></form>
   <section class="wa-tasks"><h3>复核任务</h3><ul>${tasks||'<li class="wa-empty">暂无复核任务</li>'}</ul><form data-wa-form="task"><label for="wa-task">任务内容</label><input id="wa-task" name="text" maxlength="200" required placeholder="写下需要核验的事实"><label for="wa-due">复核日期（可选）</label><input id="wa-due" name="dueDate" type="date"><button type="submit" class="wa-button" ${busy?'disabled':''}>添加复核任务</button></form></section><div class="wa-actions">${close}</div>`;
 }
 return `<div class="wa-scrim" data-watchlist-actions><section class="wa-dialog" role="dialog" aria-modal="true" aria-labelledby="wa-title" tabindex="-1">${content}${status}</section></div>`;
}

export function createWatchlistActionController({account,idFactory=()=>crypto.randomUUID(),onChange=()=>{}}={}){
 if(!account?.pool||!account?.updateWatch||!account?.removeWatch||!account?.restoreWatch)throw Error('观察池账号接口不完整');
 let removed=null;
 const current=item=>account.pool().find(row=>row.kind===identity(item).kind&&row.code===identity(item).code);
 const change=async result=>{await onChange(result);return result;};
 return {
  current,
  lastRemoved:()=>removed,
  async saveReason(item,value){
   if(typeof value!=='string'||value.length>600)throw Error('关注原因不能超过 600 字');
   return change(await account.updateWatch(item.code,{reason:value.trim()},identity(item).kind));
  },
  async saveResearchState(item,focus,status){
   const value=String(focus??'').trim(),stage=String(status??'').trim();
   if(value.length>120)throw Error('关键关注点不能超过 120 字');
   if(!['未标注研究阶段','待研究','研究中','待复核'].includes(stage))throw Error('研究阶段无效');
   return change(await account.updateWatch(item.code,{focus:value,status:stage},identity(item).kind));
  },
  async addTask(item,value,dueDate=''){
   const text=String(value??'').trim(),date=String(dueDate||'').trim();
   if(!text||text.length>200)throw Error('任务内容应为 1～200 字');
   if(date&&!validDate(date))throw Error('复核日期无效');
   const row=current(item);
   if(!row)throw Error('该对象不在观察池');
   const tasks=asList(row.tasks);
   if(tasks.length>=8)throw Error('每个关注对象最多 8 条复核任务');
   const task={id:String(idFactory()),text,done:false,...(date?{dueDate:date}:{})};
   return change(await account.updateWatch(item.code,{tasks:[...tasks,task]},identity(item).kind));
  },
  async setTaskDone(item,id,done){
   const row=current(item);
   if(!row)throw Error('该对象不在观察池');
   if(!asList(row.tasks).some(task=>task.id===id))throw Error('复核任务不存在');
   const tasks=row.tasks.map(task=>task.id===id?{...task,done:!!done}:task);
   return change(await account.updateWatch(item.code,{tasks},identity(item).kind));
  },
  async remove(item){
   const result=await account.removeWatch(item.code,identity(item).kind);
   removed=result;
   await change(result);
   return result;
  },
  async undo(item=removed){
   if(!item)throw Error('没有可撤销的移除');
   const result=await account.restoreWatch(item);
   removed=null;
   return change(result);
  },
 };
}

export function mountWatchlistActions({account,onChange=()=>{}}={}){
 const controller=createWatchlistActionController({account,onChange});
 const host=document.createElement('div');host.className='wa-host';document.body.append(host);
 let mode='',item=null,busy=false,error='';
 const render=()=>{host.innerHTML=mode?watchlistActionsMarkup({mode,item,error,busy}):'';host.querySelector('[role="dialog"]')?.focus();};
 const close=()=>{mode='';item=null;error='';render();};
 const run=async work=>{if(busy)return;busy=true;error='';render();try{const result=await work();if(mode==='remove'){item=result;mode='removed';}else if(mode==='removed'){item=result;mode='manage';}else item=controller.current(item)||item;return result;}catch(e){error=e?.message||'操作失败';}finally{busy=false;render();}};
 const click=event=>{
  const button=event.target.closest('[data-wa-action]');if(!button||!host.contains(button))return;
  const action=button.dataset.waAction;
  if(action==='close'){close();return;}
  if(action==='confirm-remove'){run(()=>controller.remove(item));return;}
  if(action==='undo'){run(()=>controller.undo(item));return;}
  if(action==='toggle-task'){
   const task=asList(item?.tasks).find(x=>x.id===button.dataset.taskId);
   if(task)run(()=>controller.setTaskDone(item,task.id,!task.done));
  }
 };
 const submit=event=>{
  const form=event.target.closest('[data-wa-form]');if(!form||!host.contains(form))return;
  event.preventDefault();const data=new FormData(form);
  if(form.dataset.waForm==='reason')run(()=>controller.saveReason(item,String(data.get('reason')||'')));
  else if(form.dataset.waForm==='research')run(()=>controller.saveResearchState(item,data.get('focus'),data.get('status')));
  else if(form.dataset.waForm==='task')run(()=>controller.addTask(item,String(data.get('text')||''),String(data.get('dueDate')||'')));
 };
 const keydown=event=>{if(event.key==='Escape'&&mode)close();};
 host.addEventListener('click',click);host.addEventListener('submit',submit);document.addEventListener('keydown',keydown);
 return {open(nextMode,nextItem){if(!['manage','remove'].includes(nextMode))throw Error('未知观察池操作');mode=nextMode;item=nextItem;error='';render();},close,destroy(){document.removeEventListener('keydown',keydown);host.remove();},controller};
}
