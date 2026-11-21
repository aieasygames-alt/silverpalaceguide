# Pages 自动部署验收

日期：2026-11-21（Asia/Shanghai）。

## 基础设施

- GitHub：<https://github.com/aieasygames-alt/silverpalaceguide>，公开仓库，默认分支 `main`。
- Pages：`silverpalaceguide`，原生 GitHub 集成，`main` 自动生产发布，其他分支自动预览。
- 生产：<https://silverpalaceguide.pages.dev/en/>；日语：<https://silverpalaceguide.pages.dev/ja/>。
- 分支预览：<https://e80fccb9.silverpalaceguide.pages.dev/en/>，已禁止搜索引擎索引。

## 部署证据

已验收的代码提交：`ae43b9903805aeb2e56326190380eb0b72edd0c4`。

| 环境 | 部署 ID | 触发方式 | 发布状态 |
| --- | --- | --- | --- |
| production | `78d79621-61b3-4da3-a5e2-e78a9203073e` | `github:push` / `main` | success |
| preview | `e80fccb9-5f84-4af9-9cb3-d6162f9d0fd5` | `github:push` / `deployment-preview-check` | success |

每次 Pages 构建都运行类型检查、6 项工具测试和静态构建检查。此次无需手工上传构建产物。

## 实际验证

生产与预览各通过 8 项 HTTP 检查：根路径 302、英日首页 200、搜索与角色页 noindex、robots、sitemap、缺失路径 404。并核对了正式域名 canonical、双语 hreflang、CSP 与 `nosniff`。

生产英日首页可索引；预览英日首页带 noindex，robots 禁止抓取。

浏览器中确认：

- 搜索 `launch` 返回 5 个英语结果，未观察到浏览器脚本错误或警告。
- 材料工具需求 120、已有 35，缺口 85；切换日语后同一记录和缺口正常恢复。
- 首页与搜索验收截图位于 `artifacts/screenshots/live-home-en.jpg` 和 `live-search-en.jpg`。

线上首次验收发现小型脚本内联被 CSP 拦截。现已关闭内联，并在构建检查中加入可执行内联脚本检测；旧产物能被检出，修复构建通过，线上搜索恢复。

## 仍需处理

`silverpalaceguide.com` 和 `www.silverpalaceguide.com` 已关联 Pages，DNS 尚未切换。旧 A 记录和待应用 CNAME 见 [部署说明](deployment.md)。控制台表单已准备，用户确认前未保存；自定义域名 HTTPS 和 `www` 重定向尚未验收。

完整性能测量、辅助技术审查和真实游戏数据采集是后续内容与质量工作。
