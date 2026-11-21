# Cloudflare Pages 部署说明

目标域名：`https://silverpalaceguide.com`，用户已完成注册。

## 构建方式

项目是 Astro 静态站点，无 SSR 适配器、Functions 或数据库依赖。依赖版本由 `package-lock.json` 固定。

| Pages 设置 | 值 |
| --- | --- |
| Git 仓库 | 部署时连接项目所在的 GitHub 仓库 |
| Production branch | `main` |
| Build command | `npm run check && npm test && npm run build` |
| Build output directory | `dist` |
| Node.js | `24`，与 `.node-version` 一致 |
| 生产环境机密 | 无 |

连接 Git 仓库、创建 Pages 项目以及绑定域名在实际部署阶段执行。当前目录可在不连接任何账户的情况下完成本地构建与预览。

## 预览环境

- Cloudflare Pages 分支构建环境中，非 `main` 分支自动输出 `noindex, follow`，`robots.txt` 禁止抓取。
- 也可以在预览环境中设置 `PREVIEW_NOINDEX=1`。生产环境不要设置此变量。
- Cloudflare 提供的预览 URL 不用作 canonical；规范地址始终指向正式域名。
- 连接 Git 后，确认生产分支确为 `main`；如改名，要同步修改预览判定逻辑。

## 域名与静态规则

1. 在 Pages 项目的 Custom domains 中添加 `silverpalaceguide.com`，按 Cloudflare 提示完成 DNS 验证与绑定。
2. 如使用 `www`，同时添加并验证 `www.silverpalaceguide.com`；只创建 DNS 记录不足以完成 Pages 域名绑定。
3. `public/_redirects` 将根路径定向到 `/en/`，将 `www` 定向到主域。
4. `public/_headers` 配置安全头和带内容哈希资源的长缓存；允许搜索使用 WebAssembly，但不开放任意脚本求值。
5. 如以后增加统计或外部资源，需同时审阅 CSP 与隐私说明。

## 发布前验证

```sh
npm ci
npm run check
npm test
npm run build
npm run preview
```

- 检查英日首页、文章语言切换、案件提示、清单保存、材料计算和搜索。
- 确认字符研究中的未完成页面为 `noindex`，且不在 sitemap 或搜索索引中。
- 确认生产环境没有 `noindex` 或全站 `Disallow`。
- 验证主域 HTTPS、`www` 重定向、根路径和实际不存在路径的 404 响应。
- 验证响应 CSP 生效时，Pagefind 搜索仍能运行。
- 远程 Pages 平台规则需要部署后再次验证，本地 Astro 预览不模拟 `_headers` 和 `_redirects` 的全部行为。

## 内容发布与数据范围

- 文章在 `src/content/guides/{en,ja}/`。`status: draft` 不生成页面。
- 文章出典必须对应 `src/data/sources.json` 中的已登记 ID。
- 英日文章使用相同 `translationId` 与 `slug`，不同的集合 ID；现阶段发布条目要求英日成对。
- 游戏案件、角色攻略和自动材料预设仍需可靠资料；不得以展示样例替代真实游戏数据。
- 清单与素材表只保存在浏览器；没有跨设备服务，导出文件是当前的备份方式。
