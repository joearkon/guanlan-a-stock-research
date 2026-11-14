# README 品牌动效

这是独立的 Remotion 制作目录，不参与观澜前后端运行，也不调用 AI 或市场数据服务。使用现有橙色波浪 Logo，表达“看盘 → 复盘 → 研究”；装饰动画不代表行情或连接状态。

## 重新制作

在本目录执行（Node.js 24+）：

```powershell
npm ci
npm run check
npm run poster
npm run render
```

首次渲染时 Remotion 可能下载浏览器。也可以在渲染命令后加 `-- --browser-executable="C:/Program Files/Google/Chrome/Application/chrome.exe"` 使用本机 Chrome。

`npm run studio` 可预览和修改。输出到 `../images/`：1200 × 420 静态封面与 8 秒、15 fps 的静音循环 GIF。README 为偏好减少动态效果的读者提供静态封面；图片无法加载时仍有正文介绍。

字体使用本机系统字体栈（Windows 优先 Microsoft YaHei），不随仓库分发字体文件；其他系统渲染后的字形可能不同。Logo 原样复制自产品现有资源。

## 工具许可

这里的固定版本开发依赖与产品运行依赖隔离。Remotion 使用其自有许可，不是 MIT；使用制作工具前请查看 [Remotion 官方许可](https://www.remotion.dev/license)。React、React DOM、TypeScript 与相应类型包遵循各自上游许可。安装的传递依赖以本目录锁文件及上游包内声明为准，不受本项目商用授权条款替换。仓库不分发 `node_modules`、浏览器或 Remotion 二进制。
