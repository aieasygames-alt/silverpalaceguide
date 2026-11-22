# 正式域名 DNS 切换验收

完成日期：2026-11-22（Asia/Shanghai）。用户针对下列两条替换回复“确认”后，已在 Cloudflare 控制台保存并完成线上验收。

## 已应用记录

| 原记录（保留用于回溯） | 新类型 | 新名称 | 新目标 | 代理 / TTL |
| --- | --- | --- | --- | --- |
| 根域 A → `34.216.117.25` | CNAME | `www` | `silverpalaceguide.pages.dev` | Proxied / Auto |
| 根域 A → `54.149.79.189` | CNAME | `@`（根域） | `silverpalaceguide.pages.dev` | Proxied / Auto |

先保存 www 替换，再保存根域替换，避免同一主机名下 A 与 CNAME 冲突。控制台已显示这两条 CNAME，旧 A 记录已被替换。现有 OAuth 缺少 DNS 权限，因此使用已授权的控制台操作完成，没有增加令牌。

## www 规则修复

初次验证发现 www 返回 200。Cloudflare Pages 的 `_redirects` 不支持按域名匹配源地址，原有绝对 URL 规则没有生效。已删除该无效声明，并在域名的 Single Redirects 中启用：

| 设置 | 值 |
| --- | --- |
| 名称 | `WWW to canonical HTTPS` |
| 规则 ID | `d9a2a568492048ce84f3f220acbe4073` |
| 匹配条件 | `(http.host eq "www.silverpalaceguide.com")` |
| 目标表达式 | `concat("https://silverpalaceguide.com", http.request.uri.path)` |
| 状态码 | `301` |
| Preserve query string | 开启 |

该区级规则先于 Pages 执行，覆盖 HTTP 和 HTTPS；站点继续采用静态 Pages 与原生 GitHub 自动部署。`public/_redirects` 仅负责 `/` → `/en/` 的 302。

官方配置依据：<https://developers.cloudflare.com/pages/configuration/redirects/>、<https://developers.cloudflare.com/rules/url-forwarding/single-redirects/settings/>。

## 验收结果

- Pages 控制台两个域名均为 **Active / SSL enabled**。
- 正式主域英日首页 HTTPS 200；根路径 302 到 `/en/`，请求使用正常 TLS 校验。
- HTTP/HTTPS 的 www 根路径、英语工具路径和日语探索路径全部 301 到 HTTPS 主域；路径及查询参数保持，包括编码空格。
- canonical、双语 hreflang、robots 与 sitemap 均指向正式主域；英日 JPEG 分享封面均为 200 且 MIME 正确。
- 搜索与角色研究页保持 noindex；不存在的页面、开发样例及 QA 页面返回真正 404。
- `npm run verify:deployment -- https://silverpalaceguide.com`：14 项主域检查与 6 项 www 检查全部通过。

正式入口：<https://silverpalaceguide.com/en/>、<https://silverpalaceguide.com/ja/>。分享图片及 OG/Twitter 元数据已可公开抓取；第三方社交平台最终展示仍可能受其缓存影响，未声称已完成各平台调试器验收。

私有截图凭据（不提交公开仓库）：`artifacts/private/domain-dns-applied.jpg`、`domain-pages-active.jpg`、`domain-redirect-enabled.jpg`、`domain-live-home-en.jpg`。
