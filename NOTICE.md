# 第三方与发布边界

用户于2026-11-14授权公开本地Harness仓库，自有且有权许可的部分采用[观澜个人使用与商业授权许可证](LICENSE)：个人自用（含自己的投资研究）、学习和修改免费；机构业务、售卖与商业服务须另行授权。这是source-available源码开放许可，不是OSI标准开源许可，也不是对线上SaaS后端或运营配置的授权发布。

## Vibe-Research

`vendor/vibe-research/local_agent_runtime.ts` 和 `research_process.ts` 来源于用户提供的本机 `D:/AI/Project/Vibe-Research` 代码副本，保留其 MIT 许可证及 `Copyright (c) 2026 simonlin1212`，完整文本见 `vendor/vibe-research/LICENSE`。原始拷贝的文件摘要与来源路径记录在 `baseline/ui-source.json`，没有把未经核验的仓库 URL 或 Git 提交当成来源。

本地修改：新增自主只读联网研究模式、Codex web 直接入口、WorkBuddy 原生检索工具与有界回合数、原生文本与 JSONL 结果解析、仅工具名称的调用事件留证。仍保留原有登录检查、订阅环境隔离与进程树停止机制。未修改用户的 Vibe-Research 仓库。

本机补丁增加回答解析后、工作区清理前的回执持久化回调；临时目录按绝对范围校验后异步清理，失败仍提示待核对，不自动重跑。

## 前端依赖

React、Vite、Radix、TanStack、图表、图标、OCR 与其他依赖保持原包各自许可证。Tesseract 的许可证随本地 OCR 资源一起准备在 `frontend/public/ocr/`，其他已有声明在 `frontend/public/licenses/`。完整依赖以锁文件为准，本次源码公开的锁定许可清单见[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)及其机器可读附件；这不是发布已编译二进制或依赖包的许可审计证明。

本机原生答案使用 `react-markdown` 10.1.0 与 `remark-gfm` 4.0.1（两者均 MIT）展示 Markdown 表格、链接、列表与代码块。默认不执行模型 HTML，外部图片改为显式链接，不自动加载。依赖包各自 LICENSE 随 npm 安装保留；将来若另行发布编译包或捆绑依赖，应重新核对其完整许可与再分发义务。

## 禁止进入公开发行包

`.local`、用户资料、会话 Cookie、真实私人问题/报告、CLI 登录目录、密钥、生产 Wrangler 配置、临时 QA 服务/会话、开发机器依赖 Junction、原始测试截图与日志不得打包公开。`web/dist` 为本机生成产物，不作为已完成发行审计的证明。

`docs/images/`仅包含用户要求制作并检查的文档介绍图：隔离演示或已完成的公开官方文档研究验收，不含真实持仓、邮箱、密钥、会话或私人研究，不是实时市场或全部功能已验收的证明。OCR生成资源由构建准备，不进入Git。
