# Pages 自动部署验收

更新日期：2026-11-22（Asia/Shanghai）。

## 基础设施

- GitHub：<https://github.com/aieasygames-alt/silverpalaceguide>，公开仓库，默认分支 `main`。
- Pages：`silverpalaceguide`，原生 GitHub 集成，`main` 自动生产发布，其他分支自动预览。
- 正式生产：<https://silverpalaceguide.com/en/>；日语：<https://silverpalaceguide.com/ja/>。
- Pages 默认域名：<https://silverpalaceguide.pages.dev/en/>。
- 分支预览：<https://e80fccb9.silverpalaceguide.pages.dev/en/>，已禁止搜索引擎索引。

## 部署证据

已验收的代码提交：`ae43b9903805aeb2e56326190380eb0b72edd0c4`。

| 环境 | 部署 ID | 触发方式 | 发布状态 |
| --- | --- | --- | --- |
| production | `78d79621-61b3-4da3-a5e2-e78a9203073e` | `github:push` / `main` | success |
| preview | `e80fccb9-5f84-4af9-9cb3-d6162f9d0fd5` | `github:push` / `deployment-preview-check` | success |

每次 Pages 构建都运行类型检查、工具/内容测试和静态构建检查；当前测试共 16 项。发布无需手工上传构建产物。

## 实际验证

生产与预览各通过 8 项 HTTP 检查：根路径 302、英日首页 200、搜索与角色页 noindex、robots、sitemap、缺失路径 404。并核对了正式域名 canonical、双语 hreflang、CSP 与 `nosniff`。

生产英日首页可索引；预览英日首页带 noindex，robots 禁止抓取。

浏览器中确认：

- 搜索 `launch` 返回 5 个英语结果，未观察到浏览器脚本错误或警告。
- 材料工具需求 120、已有 35，缺口 85；切换日语后同一记录和缺口正常恢复。
- 首页与搜索验收截图位于 `artifacts/screenshots/live-home-en.jpg` 和 `live-search-en.jpg`。

线上首次验收发现小型脚本内联被 CSP 拦截。现已关闭内联，并在构建检查中加入可执行内联脚本检测；旧产物能被检出，修复构建通过，线上搜索恢复。

## 第二阶段与正式域名验收（2026-11-22）

第二阶段代码提交 `f33403fe058acdb4251e3a9b146e36727c592cad` 对应原生 GitHub 生产部署 `db7fd90f-f31b-400c-8be0-0eb871d42171`，GitHub Pages 检查和发布成功。此版本已完成 48 文件类型检查、16 项测试和 30 页构建，Pagefind 收录 24 页。

用户确认后，两条旧 A 记录已替换为根域和 www 的 CNAME，均指向 `silverpalaceguide.pages.dev`。两个自定义域名均为 **Active / SSL enabled**。

实测 www 原先返回 200；Pages 文档确认不支持域名级 `_redirects` 源地址，因此移除该无效声明并启用 Cloudflare 区级 Single Redirect。规则、原 DNS 值和截图位置见 [域名验收记录](domain-dns-change.md)。

`npm run verify:deployment -- https://silverpalaceguide.com` 共通过 20 项检查：

- 14 项主域检查：根路径 302、英日首页 200、搜索与角色页 noindex、robots、sitemap 索引和完整 sitemap、真正 404、两张 JPEG 分享图、草稿/私有 QA 路由 404。
- 首页 canonical、双语 hreflang、OG/Twitter 分享图片地址和安全响应头正确。
- 6 项 www 检查：HTTP/HTTPS × 根路径、英语工具和日语探索路径均 301 到 HTTPS 主域；路径和查询参数原样保留。

浏览器已确认正式英语首页加载正常；域名激活与线上首页截图保存于 `artifacts/private/`，不提交公开仓库。分享素材已可公开抓取，未声称逐一完成第三方社交平台预览调试。

完整性能测量、辅助技术审查和真实游戏数据采集仍是后续内容与质量工作。
