export type BusinessSource={title:string;url:string;date?:string;period?:string};
export type BusinessCompany={code:string;name:string;role:string;money:string;category:string;fact:string;boundary:string;stage:string;sources:BusinessSource[]};
export const industryBusinessDirectoryVersion='BIZ-DIR-20261110.1';
function disclosure(code:string,name:string,category:string,role:string,money:string,fact:string,boundary:string,stage:string,url:string,date:string,period='2025年度'):BusinessCompany{return {code,name,category,role,money,fact,boundary,stage,sources:[{title:name+' · '+period.replace('年度','年年度报告'),url,date,period}]};}
// Business coverage is separate from complete financial research. Each inclusion has its own disclosure.
// No current market-cap labels: those require a timestamped quote, not permanent hand-written buckets.
export const industryBusinessNodeCodes:Record<string,Record<string,string[]>>={
 'liquid-cooling':{'cold-plate':['603912','300249','300602','002272'],cdu:['603912','300249','300602','002272','002536','603757'],connectors:['300547','002179','300249'],'heat-rejection':['603912','300249'],immersion:['603912','300249','002272']},
 media:{ip:['601595','000681','002343'],production:['300133','600977','001330','002343','300528'],distribution:['300133','600977','601595','001330','300528'],cinema:['601595','001330','603103','300528'],video:[], 'ai-content':['300133','001330','002343','300528']}
};
export const industryBusinessCompanies:Record<string,BusinessCompany[]>={
 'liquid-cooling':[
 disclosure('603912','佳力图','系统与温控','冷板式、浸没式及外部冷源','销售机房温控、液冷方案及配套设备，工程和服务收入需分别核对。','年报说明两种液冷路线、预制冷站和蒸发散热单元，覆盖末端与外部冷源。','产品能力不等于液冷成为主要收入，不能把传统风冷收入全部改记为液冷。','产品与方案披露','https://static.cninfo.com.cn/finalpage/2026-03-24/1225026036.PDF','2026-03-24'),
 disclosure('300249','依米康','系统与温控','CDU、环网、机柜与室外冷源','通过精密温控设备、基础设施集成及服务承接数据中心需求。','年报列明冷板和浸没方案，产品覆盖CDU、预制环网、机柜及外部冷源，并披露批量发货。','风墙、风液同源与液冷不是同一收入分类，批量发货仍需核验验收和回款。','产品及批量交付披露','https://static.cninfo.com.cn/finalpage/2026-04-17/1225110800.PDF','2026-04-17'),
 disclosure('300602','飞荣达','冷板与换热','冷板模组、流量阀与CDU','通过散热器件及模组配套赚取产品收入，其他电子与新能源业务分别判断。','年度摘要列出单相和两相冷板模组、流量控制阀及CDU，部分服务器散热产品已批量交付。','不同项目既有交付也有打样验证，不能把全部产品线视为已批量实现收入。','验证与部分批量并存','https://static.cninfo.com.cn/finalpage/2026-04-28/1225207278.PDF','2026-04-28'),
 disclosure('002272','川润股份','系统与温控','冷板、浸没系统与流体控制','销售流体系统、液冷产品与方案；能源业务与算力液冷分别核验。','年报说明数据中心液冷产线、冷板和浸没方案，并列示液冷系统及产品销售的经营进展。','战略协议不等于确定订单；液冷销售增长不能代替集团持续盈利和回款判断。','产线与销售进展披露','https://static.cninfo.com.cn/finalpage/2026-04-15/1225104790.PDF','2026-04-15'),
 disclosure('002179','中航光电','管路与连接','液冷互连与系统配套','通过连接器、集成互连及液冷等产品销售赚钱，防务与民用需求分别跟踪。','年报将液冷解决方案及其他产品列为独立合并产品分类，存在真实产品业务。','该分类含“其他产品”，不能当成纯AI液冷收入；连接器集团规模不是液冷市场份额。','已披露产品收入分类','https://static.cninfo.com.cn/finalpage/2026-03-28/1225044952.PDF','2026-03-28'),
 disclosure('300547','川环科技','管路与连接','液冷软管与管路材料','以橡塑软管及总成销售为主，向数据中心等新应用拓展。','年度研发项目列有大数据中心液冷管路、服务器冷却管路与液冷管路材料。','研发项目不能直接当量产收入；汽车、储能与服务器管路不可混为同一客户或同一认证。','研发及应用拓展披露','https://static.cninfo.com.cn/finalpage/2026-04-29/1225234831.PDF','2026-04-29'),
 disclosure('002536','飞龙股份','循环泵','商用液冷循环泵','销售泵类、热管理及汽车部件，液冷循环泵是其中一条产品路线。','年报研发项目列明大型液冷循环泵，披露项目完成及面向数据中心场景的拓展方向。','研发完成不等于大规模订单，不能把汽车泵销量直接当算力液冷销量。','研发完成及市场拓展','https://static.cninfo.com.cn/finalpage/2026-03-20/1225017484.PDF','2026-03-20'),
 disclosure('603757','大元泵业','循环泵','屏蔽式液冷泵','以屏蔽泵等产品为冷却介质提供循环动力，产品应用含多个温控场景。','公司年报单列液冷温控业务，说明屏蔽液冷泵及算力领域测试、送样和认证。','液冷温控还包括汽车和储能，不能把整个分部认定为AI数据中心收入。','分业务披露，验证分阶段','https://vip.stock.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?id=12159268&stockid=603757','')
 ],
 media:[
 disclosure('300133','华策影视','制作与发行','剧集、电影、版权与微短剧','通过影视制作发行、版权经营及相关内容服务赚钱。','年报拆分电视剧制作、版权发行、电影销售等收入，并说明微短剧及AI内容业务。','AI内容、算力与传统影视分别核验；播放量、项目储备不等于当期利润。','主营业务与产品披露','https://static.cninfo.com.cn/finalpage/2026-04-23/1225153343.PDF','2026-04-23'),
 disclosure('600977','中国电影','制作与发行','出品、发行服务与电影科技','通过电影创作投资、发行服务及放映技术等业务获得收入。','年报记录电影出品、发行服务、传输网络和放映系统业务。','参与影片总票房不是公司收入，集团背景也不保证单部电影盈利。','内容与发行服务披露','https://static.cninfo.com.cn/finalpage/2026-04-18/1225121079.PDF','2026-04-18'),
 disclosure('601595','上海电影','版权与IP','电影发行、院线与IP授权','经营发行放映与IP商业化，授权和衍生业务需按权益确认。','公司年度报告说明宣发、院线及IP运营，多种业务共同构成收入来源。','IP授权的终端GMV不等于公司收入，影片热度也不直接等于权益利润。','IP与院线业务披露','https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?id=12149694&stockid=601595','2026-04-23'),
 disclosure('001330','博纳影业','制作与发行','电影投资发行、影院及AI项目','通过影片投资发行、影院运营及内容制作赚钱。','年报列明电影、影院、剧集业务，并逐项区分AI电影立项和开发阶段。','AI项目计划不构成业绩承诺；影片审查、权益比例、成本和回收影响收益。','经营业务与项目阶段披露','https://static.cninfo.com.cn/finalpage/2026-04-27/1225188249.PDF','2026-04-27'),
 disclosure('603103','横店影视','院线与放映','电影放映、卖品及内容投资','通过直营影院、院线业务与相关衍生消费获得收入，同时开展内容投资。','年报说明影院运营与票房、衍生消费，以及电影和短剧投资布局。','不能混用横店影视上市公司与横店集团其他资产，票房与营业收入也不是同一口径。','院线与内容投资披露','https://static.cninfo.com.cn/finalpage/2026-02-28/1224988730.PDF','2026-02-28'),
 disclosure('000681','视觉中国','版权与IP','视觉内容版权交易与服务','围绕图片、视频等视觉内容进行版权许可与内容服务。','年报列明视觉内容与服务经营，业务位置在版权交易和内容服务而非影院票房。','版权资产、AI工具与用户增长需要实际付费验证，不据AI标签推导独立利润。','版权内容服务披露','https://static.cninfo.com.cn/finalpage/2026-03-31/1225063093.PDF','2026-03-31'),
 disclosure('002343','慈文传媒','制作与发行','影视IP、剧集、短剧与互动内容','通过制作发行、版权运营及内容分成等方式赚钱。','年度摘要列明剧集、电影、微短剧、互动剧等产品及版权经营方式。','创新业务布局不等于已形成稳定收入；需看项目确认、内容成本与减值回收。','内容与版权业务披露','https://static.cninfo.com.cn/finalpage/2026-04-17/1225113506.PDF','2026-04-17'),
 disclosure('300528','幸福蓝海','院线与放映','剧集制作、电影投资与院线','通过剧集制作发行、电影投资及影院放映经营赚钱。','年度摘要说明电视剧、电影全产业链、影院及新增动画业务。','加盟院线与自营影院不可合并当自有资产，AI剧集推进不等于已有独立利润。','内容与影院经营披露','https://static.cninfo.com.cn/finalpage/2026-04-11/1225095042.PDF','2026-04-11')
 ]
};
