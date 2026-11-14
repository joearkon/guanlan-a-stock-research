export const routes={
 home:{file:'index.html',publicName:'',module:'./home.js',label:'今日研究台',group:0},
 live:{file:'monitor.html',publicName:'monitor',module:'./watch.js',label:'实时动态',group:1},
 relay:{file:'relay.html',publicName:'relay',module:'./watch.js',label:'异动接力',group:1},
 auction:{file:'auction.html',publicName:'auction',module:'./watch.js',label:'竞价盘中',group:1},
 marketObservation:{file:'market-observation.html',publicName:'market-observation',module:'./market-observation.js',label:'全市场观测',group:2},
 radarObservation:{file:'radar-observation.html',publicName:'radar-observation',module:'./radar-observation.js',label:'雷达观测',group:2},
 review:{file:'review.html',publicName:'review',module:'./review.js',label:'每日观测',group:2},
 emotion:{file:'emotion.html',publicName:'emotion',module:'./emotion.js',label:'情绪观测',group:2},
 agent:{file:'agent.html',publicName:'agent',module:'./agent-page.mjs',label:'研究工作台',group:6},
 holdings:{file:'research.html',publicName:'holdings',module:'./research-page.mjs',label:'自选与持仓 · 持仓',group:5},
 watchlist:{file:'research.html',publicName:'watchlist',module:'./research-page.mjs',label:'自选与持仓',group:5},
 stock:{file:'research.html',publicName:'stock',module:'./research-page.mjs',label:'个股深挖',group:5},
 portfolioReview:{file:'research.html',publicName:'portfolio-review',module:'./portfolio-review-page.mjs',label:'我的复盘',group:5}
};
export const pending={
 focus:{label:'今日关注',group:0},
 sectors:{label:'板块强弱',group:0},
 research:{label:'板块研究',group:3},
 funds:{label:'资金面',group:3},
 news:{label:'资讯与财报',group:4},
 announcements:{label:'公告详情',group:4},
 stocks:{label:'我的股票',group:5}
};
export const shellGroups=[
 ['首页',[['home','今日研究台']]],
 ['盯盘',[['live','实时动态'],['relay','异动接力'],['auction','竞价盘中']]],
 ['复盘',[['marketObservation','全市场观测'],['review','每日观测'],['emotion','情绪观测'],['radarObservation','雷达观测']]],
 ['产业研究',[['research','产业研究'],['funds','资金面']]],
 ['资讯与财报',[['news','资讯与财报'],['announcements','公告详情']]],
 ['我的股票',[['watchlist','自选与持仓'],['stock','个股深挖'],['portfolioReview','我的复盘']]],
 ['问观澜',[]]
];
export function navigationGroups(){return shellGroups.map(([name,items],index)=>({name,index,items:items.filter(([key])=>key!=='portfolioReview')})).filter(x=>x.index!==4);}
const nameToKey={'radar-observation':'radarObservation','market-observation':'marketObservation',monitor:'live',relay:'relay',auction:'auction',review:'review',emotion:'emotion',agent:'agent',holdings:'holdings',watchlist:'watchlist',stock:'stock','portfolio-review':'portfolioReview',index:'home','':'home'};
export function assetFile(key){return routes[key]?.file??null;}
export function publicPath(key){
 if(key in routes){const name=routes[key].publicName;return name===''?'./':name;}
 return 'coming-soon?section='+key;
}
export function href(key,root){return new URL(publicPath(key),root).href;}
export function resolve(url,root){
 const u=new URL(url,root);let name=u.pathname.split('/').pop().replace(/\.html$/,'');if(name==='v2')name='';
 const key=nameToKey[name];
 if(key){
  const clean=new URL(publicPath(key),root);
  if(u.search&&key!=='home')clean.search=u.search;
  clean.hash=u.hash;
  return {key,...routes[key],url:clean};
 }
 const section=pending[u.searchParams.get('section')]?u.searchParams.get('section'):'research';
 const clean=new URL('coming-soon?section='+section,root);
 return {key:'pending',section,...pending[section],url:clean};
}
