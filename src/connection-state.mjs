export function connectionState({selection,capability,probe,lastJob}={}){
 const engine=['codex','codebuddy','claude','deepseek'].includes(selection?.engine)?selection.engine:null;
 const state=(kind,label,tone='muted',detail='')=>({kind,label,tone,engine,version:capability?.version??null,billingSource:capability?.billingSource??selection?.providerConfig?.billingSource??null,verifiedAt:null,detail});
 if(!engine)return state('unconfigured','未配置','muted','选择引擎并完成一次实际连接测试；仅安装不代表连接成功。');
 if(!capability||capability.status==='probe_failed')return state('unknown','状态未确认','warning','本机检测未完成；没有自动测试模型。');
 if(engine==='deepseek'&&(capability.authenticated===false||capability.status==='not_authenticated'))return state('missing_key','未配置密钥','warning','请在本机 AI 配置填写本人 DeepSeek API Key，再主动测试；不是网页登录额度。');
 if(capability.installed===false||capability.status==='not_installed')return state('not_installed','未安装','warning','已保存配置仍保留，但当前未发现所选 CLI。');
 if(capability.status==='not_authenticated'||capability.authenticated===false)return state('signed_out','未登录','warning','请由本人登录所选 CLI，再主动测试。');
 if(capability.authenticated!==true||capability.installed!==true)return state('unknown','状态未确认','warning','缺少明确的安装或登录检测回执。');
 if(capability.available!==true)return state('unknown','状态未确认','warning','所选 CLI 尚未确认就绪。');
 if(!probe||probe.id!==selection.probeId||probe.engine!==engine||probe.status!=='complete'||!probe.receipt||!probe.result?.answer||probe.attempts<1||probe.request?.context?.connectionProbe!==true)return state('untested','未测试','muted','没有匹配且成功的实际连接测试回执，不显示已连接。');
 if(!selection.engineVersion||!capability.version||selection.engineVersion!==capability.version||probe.request.context.engineVersion!==capability.version)return state('retest','需重新测试','warning','CLI 版本已变化或旧配置未记录版本；上次验证不作为当前连接证明。');
 if(capability.authRevision&&(selection.providerConfig?.authRevision!==capability.authRevision||probe.request.providerConfig?.authRevision!==capability.authRevision||selection.providerConfig?.billingSource!==capability.billingSource))return state('retest','需重新测试','warning','认证、密钥或费用来源已变化；旧测试不作为当前证明，原配置保留。');
 if(lastJob?.engine===engine&&lastJob.updated_at>probe.updated_at&&['failed','needs_attention'].includes(lastJob.status))return state('attention',lastJob.status==='failed'?'未通过':'待核对','warning','最近任务未完成，原配置和回执保留；不会自动重跑或切换平台。');
 return {...state('verified','已连接','success','实际测试通过且当前认证就绪；验证时间见记录，并非持续联网探测，也不保证研究资料完整。'),verifiedAt:probe.updated_at};
}
