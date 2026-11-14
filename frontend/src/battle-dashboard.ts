export const panelCatalog=[
 {kind:'market',name:'市场概览',group:'市场',timing:'盘中',description:'涨跌广度、成交额与可切换指数K线；保留快照日期。',width:12},
 {kind:'index-chart',name:'指数K线',group:'市场',timing:'盘后',description:'独立观察上证、深证或创业板的真实K线、均线与成交量。',width:6}, {kind:'indices',name:'A股指数',group:'市场',timing:'盘中',description:'上证、深证与创业板的已取得报价。',width:6},
 {kind:'watch',name:'我的观察池',group:'个人',timing:'盘中',description:'当前账号的关注对象，每页5项，沿用已取得报价。',width:6},
 {kind:'holdings',name:'我的持仓',group:'个人',timing:'盘中',description:'实际记录的股数、成本和已取得报价。',width:6},
 {kind:'security',name:'个股 / ETF报价',group:'资产',timing:'盘中',description:'选择已核验证券，独立配置不同观察对象。',width:6},
 {kind:'themes',name:'题材梯队支撑',group:'板块',timing:'盘中',description:'复用盯盘细分方向与同批成员证据。',width:6},
 {kind:'funds',name:'板块资金观察',group:'板块',timing:'混合',description:'行业、概念分别配置，查看同源资金窗口与逐日归档，最多20个关注。',width:12},
 {kind:'events',name:'与我相关的事件',group:'动态',timing:'混合',description:'自选、持仓关联的披露记录与研究待办。',width:6},
 {kind:'research',name:'我的研究',group:'研究',timing:'盘后',description:'当前账号已保存的研究，不自动生成新报告。',width:6}
] as const;
export type PanelKind=typeof panelCatalog[number]['kind'];
export type DashboardPanel={id:string;kind:PanelKind;title:string;width:number;height:number;hidden:boolean;x?:number;y?:number;indexCode?:string;chartPeriod?:'day'|'week'|'month';chartAdjust?:'qfq'|'hfq'|'none';security?:{code:string;name:string;kind:'stock'|'etf'}};
export type BattleLayout={schemaVersion:1;revision:number;name:string;panels:DashboardPanel[]};
export const dashboardKey=(account:string)=>'guanlan.battle-dashboard.v1.'+encodeURIComponent(account||'guest');
// Frame-rate independent page scrolling; a paused tab never produces a large jump.
export function battleScrollStep(y:number,top:number,bottom:number,elapsed:number){
 const zone=Math.min(88,(bottom-top)/4),edge=y<top+zone?-Math.min(1,(top+zone-y)/zone):y>bottom-zone?Math.min(1,(y-bottom+zone)/zone):0;
 return edge*.9*Math.max(0,Math.min(50,elapsed));
}
export function quoteChange(q:any):number|null{return typeof q?.price==='number'&&Number.isFinite(q.price)&&typeof q.prev==='number'&&q.prev>0?(q.price/q.prev-1)*100:typeof q?.pct==='number'&&Number.isFinite(q.pct)?q.pct:null;}
export function battleQuoteInterval(calendar:any,now=new Date(),hidden=false,online=true):number|false{
 if(hidden||!online)return false;const cn=new Date(now.getTime()+8*3600000).toISOString(),day=cn.slice(0,10),hm=cn.slice(11,16);
 if(!calendar||day<calendar.from||day>calendar.through||!calendar.open_days?.includes(day))return false;
 return (hm>='09:20'&&hm<='11:30'||hm>='13:00'&&hm<='15:10')?60000:false;
}
const clean=(value:any,max=40)=>String(value||'').replace(/[<>\u0000-\u001f]/g,' ').trim().slice(0,max);
const def=(kind:string)=>panelCatalog.find(p=>p.kind===kind);
export const blankDashboard=():BattleLayout=>({schemaVersion:1,revision:0,name:'我的作战看板',panels:[]});
// Coordinates use 12 columns and pixel heights. Never compact a user's empty space.
const overlaps=(a:DashboardPanel,b:DashboardPanel)=>a.x!<b.x!+b.width&&a.x!+a.width>b.x!&&a.y!<b.y!+b.height+16&&a.y!+a.height+16>b.y!;
function vacancy(panel:DashboardPanel,placed:DashboardPanel[]){
 const rows=[0,...placed.filter(p=>!p.hidden).map(p=>p.y!+p.height+16)].sort((a,b)=>a-b);
 for(const y of rows)for(let x=0;x<=12-panel.width;x++){const p={...panel,x,y};if(!placed.some(q=>!q.hidden&&overlaps(p,q)))return p;}
 return {...panel,x:0,y:Math.max(0,...rows)};
}
export function arrangeDashboard(layout:BattleLayout):BattleLayout{
 const placed:DashboardPanel[]=[];
 for(const panel of layout.panels){let p={...panel};if(p.x===undefined||p.y===undefined)p=vacancy(p,placed);else{p.x=Math.min(p.x,12-p.width);while(!p.hidden&&placed.some(q=>!q.hidden&&overlaps(p,q)))p.y=Math.max(...placed.filter(q=>!q.hidden&&overlaps(p,q)).map(q=>q.y!+q.height+16));}placed.push(p);}
 return {...layout,panels:placed};
}
function settle(layout:BattleLayout,id:string):BattleLayout{
 const target=layout.panels.find(p=>p.id===id)!;const placed=[target];
 const others=layout.panels.filter(p=>p.id!==id).sort((a,b)=>a.y!-b.y!);
 for(const original of others){const p={...original};while(!p.hidden&&placed.some(q=>!q.hidden&&overlaps(p,q)))p.y=Math.max(...placed.filter(q=>!q.hidden&&overlaps(p,q)).map(q=>q.y!+q.height+16));placed.push(p);}
 return {...layout,panels:layout.panels.map(p=>placed.find(q=>q.id===p.id)!)};
}
export function placePanel(layout:BattleLayout,id:string,x:number,y:number):BattleLayout{
 const ready=arrangeDashboard(layout),p=ready.panels.find(p=>p.id===id);if(!p)throw Error('组件已变化，请重新读取');
 const next=settle({...ready,panels:ready.panels.map(p=>p.id===id?{...p,x:Math.max(0,Math.min(12-p.width,Math.round(x))),y:Math.max(0,Math.min(50000,Math.round(y/20)*20))}:p)},id);
 return {...next,panels:[...next.panels].sort((a,b)=>a.y!-b.y!||a.x!-b.x!)};
}
export function addPanels(layout:BattleLayout,kinds:PanelKind[]):BattleLayout{
 if(layout.panels.length+kinds.length>20)throw Error('单个看板最多20个组件，请减少选择');
 const panels=[...layout.panels];
 for(const kind of kinds){const d=def(kind);if(!d)throw Error('该组件尚未开放');if(panels.filter(p=>p.kind===kind).length>=3)throw Error('同类组件最多3个，可分别配置不同对象');panels.push({id:crypto.randomUUID(),kind,title:d.name,width:d.width,height:kind==='market'?290:320,hidden:false});}
 return arrangeDashboard({...layout,panels});
}
export function defaultDashboard(){return addPanels(blankDashboard(),['market','watch','holdings','themes','research']);}
export function dashboardPreset(id:string):BattleLayout{
 const kinds:Record<string,PanelKind[]>={blank:[],personal:['market','watch','holdings','events','research'],market:['market','indices','themes'],funds:['funds','themes','indices'],research:['research','security','events']};
 if(!kinds[id])throw Error('未开放该预设');return addPanels(blankDashboard(),kinds[id]);
}
export function updatePanel(layout:BattleLayout,id:string,patch:Partial<Omit<DashboardPanel,'id'|'kind'>>):BattleLayout{
 if(!layout.panels.some(p=>p.id===id))throw Error('组件已变化，请重新读取');
 if(patch.x!==undefined&&(!Number.isInteger(patch.x)||patch.x<0||patch.x>11)||patch.y!==undefined&&(!Number.isInteger(patch.y)||patch.y<0||patch.y>50000))throw Error('组件位置无效');
 if(patch.width!==undefined&&(!Number.isInteger(patch.width)||patch.width<3||patch.width>12)||patch.height!==undefined&&(!Number.isInteger(patch.height)||patch.height<180||patch.height>700))throw Error('组件尺寸需为3–12栏、180–700像素');
 if(patch.chartPeriod!==undefined&&!['day','week','month'].includes(patch.chartPeriod)||patch.chartAdjust!==undefined&&!['qfq','hfq','none'].includes(patch.chartAdjust))throw Error('K线周期或复权口径无效');
 if(patch.indexCode!==undefined&&!['000001','399001','399006'].includes(patch.indexCode))throw Error('请选择已开放指数'); if(patch.security&&(!/^\d{6}$/.test(patch.security.code)||!clean(patch.security.name)||!['stock','etf'].includes(patch.security.kind)))throw Error('请先核验证券身份');
 const ready=arrangeDashboard(layout),next={...ready,panels:ready.panels.map(p=>p.id===id?{...p,...patch,x:Math.min(patch.x??p.x!,12-(patch.width??p.width)),...(patch.title!==undefined?{title:clean(patch.title)||def(p.kind)!.name}:{}),...(patch.security?{security:{code:patch.security.code,name:clean(patch.security.name),kind:patch.security.kind}}:{})}:p)};
 return settle(next,id);
}
export function movePanel(layout:BattleLayout,from:string,to:string,preservePositions=false):BattleLayout{
 const panels=[...layout.panels],a=panels.findIndex(p=>p.id===from),b=panels.findIndex(p=>p.id===to);if(a<0||b<0)throw Error('组件顺序已变化，请重新读取');const [panel]=panels.splice(a,1);panels.splice(b,0,panel);return preservePositions?{...layout,panels}:arrangeDashboard({...layout,panels:panels.map(({x,y,...p})=>p)});
}
function validate(value:any):BattleLayout{
 if(value?.schemaVersion!==1||!Number.isInteger(value.revision)||value.revision<0||!Array.isArray(value.panels)||value.panels.length>20)throw Error('布局格式不兼容');
 const ids=new Set(),counts=new Map();let layout:BattleLayout={schemaVersion:1,revision:value.revision,name:clean(value.name)||'我的作战看板',panels:[]};
 for(const p of value.panels){if(!def(p.kind)||typeof p.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(p.id)||ids.has(p.id))throw Error('组件格式不兼容');ids.add(p.id);counts.set(p.kind,(counts.get(p.kind)||0)+1);if(counts.get(p.kind)>3)throw Error('同类组件过多');layout.panels.push({id:p.id,kind:p.kind,title:def(p.kind)!.name,width:6,height:320,hidden:false});layout=updatePanel(layout,p.id,{title:p.title,width:p.width,height:p.height,hidden:p.hidden===true,...(p.x!==undefined?{x:p.x}:{}),...(p.y!==undefined?{y:p.y}:{}),...(p.chartPeriod!==undefined?{chartPeriod:p.chartPeriod}:{}),...(p.chartAdjust!==undefined?{chartAdjust:p.chartAdjust}:{}),...(p.indexCode?{indexCode:p.indexCode}:{}),...(p.security?{security:p.security}:{})});}
 return layout;
}
export function readDashboard(account:string):{layout:BattleLayout;warning:string}{
 try{const raw=localStorage.getItem(dashboardKey(account));return {layout:raw?validate(JSON.parse(raw)):defaultDashboard(),warning:''};}catch{return {layout:defaultDashboard(),warning:'未能读取已保存的看板，当前显示默认布局；没有覆盖原记录。'};}
}
export function saveDashboard(account:string,next:BattleLayout,expectedRevision:number):BattleLayout{
 const key=dashboardKey(account),raw=localStorage.getItem(key);let current=0;
 if(raw){try{current=validate(JSON.parse(raw)).revision;}catch{throw Error('原布局无法读取，请先重置或恢复备份，未覆盖原记录');}}
 if(current!==expectedRevision)throw Error('看板已在其他窗口更新，请重新读取后再修改');
 const saved=validate({...next,schemaVersion:1,revision:current+1,name:clean(next.name)||'我的作战看板'});localStorage.setItem(key,JSON.stringify(saved));return saved;
}
export function recoverDashboard(account:string,expectedRaw:string){
 const key=dashboardKey(account),raw=localStorage.getItem(key);if(raw!==expectedRaw)throw Error('原记录已变化，请重新检查，未覆盖当前记录');
 let damaged=false;try{validate(JSON.parse(raw||'null'));}catch{damaged=true;}if(!damaged)throw Error('原布局仍可读取，请使用预设管理，未执行损坏恢复');
 const backupKey=key+'.backup.'+Date.now()+'.'+crypto.randomUUID(),layout={...defaultDashboard(),revision:1};localStorage.setItem(backupKey,raw||'');localStorage.setItem(key,JSON.stringify(layout));return {layout,backupKey};
}
