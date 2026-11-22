# 正式域名 DNS 切换待办

只读核验：2026-11-22。此文件是可审阅的变更方案，不表示变更已保存。

## 当前状态

- Cloudflare DNS 控制台仍有两条根域 A 记录：`54.149.79.189`、`34.216.117.25`，均为 Proxied / Auto。
- `www` 没有生效记录。把第二条 A 改成 www CNAME 的表单已准备，但尚未保存。
- Pages API 返回根域和 www 都是 `pending`，原因为 `CNAME record not set`。
- 现有 OAuth 可以访问 Pages，但 DNS 请求返回 403（缺少 DNS 权限）。
- 主域 HTTPS 请求超时，www 连接失败；默认 Pages 域名可用。

## 拟保存的两条记录

| 现记录 | 新类型 | 新名称 | 新目标 | 代理 / TTL |
| --- | --- | --- | --- | --- |
| 根域 A → `34.216.117.25` | CNAME | `www` | `silverpalaceguide.pages.dev` | Proxied / Auto |
| 根域 A → `54.149.79.189` | CNAME | `@`（根域） | `silverpalaceguide.pages.dev` | Proxied / Auto |

先保存 www 替换，再保存根域替换，可以避免同一主机名下 A 与 CNAME 冲突。控制台提示改变记录类型会删除并重建该记录；执行前需针对这两条替换取得浏览器操作的即时确认。

## 保存后验收

1. Pages 两个自定义域名由 pending 变为 active，并完成证书签发。
2. 主域英日页面 HTTPS 200；根路径 302 到 `/en/`。
3. www 通过仓库已有 `public/_redirects` 规则 301 到主域，保留路径和查询参数。
4. canonical、hreflang、sitemap、robots 和分享图片均可通过正式域名访问。
5. 运行 `npm run verify:deployment -- https://silverpalaceguide.com`，单独核验 www 重定向。

保存前继续使用 https://silverpalaceguide.pages.dev/en/。分享图片元数据已经接入正式域 URL，平台实际抓取验收依赖这次 DNS 切换。
