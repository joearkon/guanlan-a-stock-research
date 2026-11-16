# 观澜更新日志

记录本仓库 Local Harness 的功能、修复与文档更新，日期采用北京时间。源码更新不等于线上 SaaS 发布；两者独立维护。GitHub 版本摘要见 [Releases](https://github.com/joearkon/guanlan-a-stock-research/releases)，维护方式见[发布约定](docs/RELEASING.md)。

## 未发布

暂无待发布的更新记录。

## 2026-11-16

### 数据来源与 MCP 能力说明

- README 新增数据来源分工，补充腾讯、Tushare、东财、新浪、同花顺、申万、官方披露、新闻及研报等用途；详细来源、资金口径和费用见 [DATA-SOURCES.md](docs/DATA-SOURCES.md)。明确本地版通过观澜账号读取共享资料，不要求用户填写上游行情 Token。
- 区分主力资金读数、龙虎榜机构披露净额、近5／10日单日榜汇总、累计榜和两融余额；注明来源、单位、资料日、缺项和版权边界，不宣传未接入来源或全覆盖。
- 新增 [MCP 能力与路线图](docs/MCP-ROADMAP.md)，列明线上已开放10个只读工具、本地本轮证据3个工具的区别，以及时效、个股证据、板块资金、公告财务、产业横向检索等后续优先级。规划不代表新增接口已上线。

验证：核对本地共享读取白名单、现有共享服务来源实现与 Tushare 官方字段说明，检查文档引用、Markdown 渲染和公开差异。本批仅文档，不修改本地 AI、SaaS 或 MCP 运行逻辑，不发起真实模型调用或行情采集；不冒称完成新接口或新的全应用验收。

## 2026-11-15

### 品牌与项目介绍

- README 加入观澜现有橙色波浪 Logo 和 8 秒静音品牌动效，突出“看盘 → 复盘 → 研究”与自己的 AI Agent。GIF 约 460 KB，并为偏好减少动态效果的读者提供静态封面。
- 保留独立的 [Remotion 制作源码与重渲染说明](docs/brand-motion/README.md)，不向观澜产品运行依赖中加入视频制作工具。
- 增加本更新日志、README 更新入口与 GitHub 开发预览 Release；后续交付按[发布约定](docs/RELEASING.md)同步记录。

验证：品牌制作 TypeScript 检查、封面和 GIF 渲染、关键帧及缩小画面检查、图片引用和 GitHub Markdown 渲染检查通过；制作依赖本次 npm audit 未报告漏洞。本批未修改应用功能、调用研究模型或部署 SaaS。

相关提交：[品牌动效](https://github.com/joearkon/guanlan-a-stock-research/commit/e5b5c52b7934a5d2e87de95641b9364dba358219)。

## 2026-11-14

### Local Harness 首次公开开发预览

- 提供独立本地版，连接自己的观澜账号读取共享市场资料；本地 AI Agent 使用自己的供方账号或 API 额度，失败不自动重跑或切换平台扣费。
- 接入 Codex、WorkBuddy / CodeBuddy、Claude Code 与 DeepSeek，保留原生研究和回答。提供选择、检测、测试连接、已配置摘要，以及顶部和侧栏状态入口。
- 保留盯盘与异动、连板接力、复盘、条件观测、资金足迹、产业研究、作战看板、自选与持仓等工作台入口；问观澜、盘面点评和个人研究适配自己的 AI Agent。
- 新手引导与帮助更新：本地版首次 17 步，旧版用户更新摘要 7 步；补充交易状态、前10题材上榜、资金单日与累计、手机操作及 Agent 配置说明。
- README 补充两版定位、启动步骤、功能说明和 17 张对应截图；线上版注明试运营。个人知识、打法与战法辅助研究列入后续计划，不作为已完成功能。
- 公开本地版源码及许可说明：个人自用、学习和修改免费，机构及对外商用需授权；SaaS 后端、生产配置和个人资料不在公开范围内。

验证与边界：新手引导批次本地前端 94 项、后端 54 项及 TypeScript、构建通过；隔离浏览器覆盖桌面、小屏与明暗主题。Codex、WorkBuddy 的既有真实执行记录见 [QA.md](QA.md)；Claude Code 与 DeepSeek 已有适配和隔离回归，但当时因未安装或未配置，未完成真实供方连接验收。不是全新机器安装、其他操作系统或真实手机跨设备的完整验收。

相关提交：[首次本地版](https://github.com/joearkon/guanlan-a-stock-research/commit/8d4e2cc)、[许可与公开范围](https://github.com/joearkon/guanlan-a-stock-research/commit/248f97f)、[新手引导](https://github.com/joearkon/guanlan-a-stock-research/commit/2f0064f)、[版本边界说明](https://github.com/joearkon/guanlan-a-stock-research/commit/ee5a2eb)。
