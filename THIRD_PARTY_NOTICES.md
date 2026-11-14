# 第三方许可声明

本项目的[自有代码许可](LICENSE)不替代第三方原有许可，不限制那些许可原本允许的商业使用。下列清单针对本次公开的**源码仓库**；不包含第三方账号凭据、node_modules、生成OCR资源或web/dist编译产物。

## 已随源码保留的第三方部分

| 部分 | 许可与声明 |
| --- | --- |
| Vibe-Research运行适配的两个文件 | [MIT许可全文](vendor/vibe-research/LICENSE)，Copyright (c) 2026 simonlin1212；修改范围见[NOTICE](NOTICE.md) |
| TradingView Lightweight Charts | [Apache-2.0全文](frontend/public/licenses/lightweight-charts-LICENSE.txt)与[NOTICE](frontend/public/licenses/lightweight-charts-NOTICE.txt)，版权与页面归属声明保留 |
| OCR构建资源 | 构建脚本从已安装依赖准备，不进Git；Tesseract.js和核心许可证随生成资源保留 |

## 前端直接运行依赖

| 包 | 锁定版本 | 许可声明 |
| --- | --- | --- |
| `@radix-ui/react-dialog` | 1.3.1 | MIT |
| `@tanstack/react-query` | 5.105.0 | MIT |
| `@tanstack/react-virtual` | 3.14.23 | MIT |
| `@tesseract.js-data/chi_sim` | 1.0.0 | MIT |
| `@tesseract.js-data/eng` | 1.0.0 | MIT |
| `@xyflow/react` | 12.12.0 | MIT |
| `echarts` | 6.1.0 | Apache-2.0 |
| `lightweight-charts` | 5.2.1 | Apache-2.0 |
| `lucide-react` | 1.63.0 | ISC |
| `motion` | 14.7.1 | MIT |
| `pinyin-pro` | 3.29.5 | MIT |
| `react` | 19.3.1 | MIT |
| `react-dom` | 19.3.1 | MIT |
| `react-router-dom` | 7.18.5 | MIT |
| `tesseract.js` | 7.0.0 | Apache-2.0 |
| `react-markdown` | 10.1.0 | MIT |
| `remark-gfm` | 4.0.1 | MIT |

## 完整锁定依赖

机器可读附件：[dependencies.json](docs/third-party/dependencies.json)。

- 共359项锁定依赖记录，包含传递依赖、开发依赖与可选平台包；同名不同版本单独记录。
- 覆盖MIT、MIT-0、0BSD、Apache-2.0、ISC、BSD-2-Clause、BSD-3-Clause、MPL-2.0、BlueOak-1.0.0和CC0-1.0，本轮未识别到缺失的许可字段。
- 24项MPL-2.0记录为Lightning CSS及其可选平台构建依赖，均标记为开发依赖。本次不发布这些依赖的源码修改或二进制；它们的原许可不被项目的个人使用许可替换。
- 许可名称来自锁文件及已安装包元数据核对；完整条款以各上游包附带的LICENSE/NOTICE为准。附件含锁文件SHA256，依赖更新后应重新生成和核对，不是持续有效的安全或法律认证。

通过npm安装的包须保留各自原始许可。将来发布编译包、捆绑依赖、容器或安装器时，应另行整理实际分发内容的完整声明，不能仅以本次源码清单代替。

## 市场资料、品牌与演示图

市场数据、公告、研报和第三方服务的访问与再分发权不随代码许可一并转让。页面保留来源及日期，使用者应自行遵守来源条款；本项目不授予绕过观澜认证、配额或第三方限制的权利。

项目品牌的所有权与禁止冒充官方服务的要求见[LICENSE](LICENSE)。文档配图为已核验的公开历史快照、隔离演示或已完成的官方文档问答，不含真实私人持仓、凭据或研究。它们不代表当前行情、收益承诺或全部功能验收完成。
