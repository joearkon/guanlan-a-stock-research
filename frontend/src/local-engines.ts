export const engineNames:Record<string,string>={codex:'Codex',codebuddy:'WorkBuddy / CodeBuddy',claude:'Claude Code',deepseek:'DeepSeek'};
export const shortEngineName=(engine?:string)=>engine==='codebuddy'?'WorkBuddy':engine==='claude'?'Claude':engineNames[engine||'']||'本地 AI Agent';
export const engineName=(engine?:string)=>engineNames[engine||'']||'尚未配置';
