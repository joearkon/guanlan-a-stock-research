(function(){
  'use strict';
  const clean=(value,max)=>String(value||'').replace(/[<>\r\n]/g,' ').trim().slice(0,max);
  const stock=(value)=>value&&/^\d{6}$/.test(String(value.code||''))
    ?{code:String(value.code),name:clean(value.name,40)}:null;

  function context(value={}){
    const result={page:clean(value.page,40)||'研究台'};
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(value.asof||'')))result.asof=String(value.asof);
    const focus=stock(value.stock);
    if(focus)result.stock=focus;
    const section=clean(value.section,40);
    if(section)result.section=section;
    const fixed=value.fixedReport;
    if(fixed&&fixed.version===1&&['market-commentary','funds-radar','dragon-score','company-four'].includes(fixed.type))result.fixedReport={type:fixed.type,version:1,snapshotId:typeof fixed.snapshotId==='string'?clean(fixed.snapshotId,120):null};
    else if(section==='公司基本面四问')result.fixedReport={type:'company-four',version:1,snapshotId:null};
    else if(section==='funds-radar-v1')result.fixedReport={type:'funds-radar',version:1,snapshotId:null};
    else if(section==='market-commentary-v1')result.fixedReport={type:'market-commentary',version:1,snapshotId:null};
    if(section==='funds-radar-v1'&&value.funds&&typeof value.funds==='object'){
      const f=value.funds;
      if(['report','board','compare'].includes(f.mode)&&['industry','concept'].includes(f.kind)&&['today','d3','d5'].includes(f.period)&&Array.isArray(f.boards)&&f.boards.length<=5&&f.boards.every(x=>typeof x==='string'&&x.length>0&&x.length<=80))result.funds={mode:f.mode,kind:f.kind,period:f.period,boards:[...new Set(f.boards.map(x=>clean(x,80)))]};
    }
    return result;
  }

  function stop(turn={}){
    return {status:'stopped',question:clean(turn.question,500),conversationId:turn.conversationId||null,
      context:context(turn.context),deepThinking:turn.deepThinking===true,
      userMessageId:String(turn.userMessageId||''),turnId:String(turn.turnId||'')};
  }

  function resume(stopped){
    if(stopped?.status!=='stopped'||!stopped.question)throw new Error('没有可继续的提问');
    return {status:'running',question:stopped.question,conversationId:stopped.conversationId,
      context:context(stopped.context),deepThinking:stopped.deepThinking===true,
      userMessageId:stopped.userMessageId,turnId:stopped.turnId,replayUserMessage:false};
  }

  const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function stoppedCard(stopped){
    if(stopped?.status!=='stopped')return '';
    return `<div class="agent-stopped" role="status"><span>本轮已停止；未生成有效结论。继续会从已保存的对话和当前证据重新执行本轮，不会续接模型已中断的思考。</span><button class="btn ghost" data-a="agentResume" aria-label="重新执行本轮">重新执行本轮：${escape(stopped.question.slice(0,32))}</button></div>`;
  }

  globalThis.GLAgentSession={context,stop,resume,stoppedCard};
})();

export default globalThis.GLAgentSession;
