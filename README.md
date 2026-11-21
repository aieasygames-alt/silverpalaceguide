# Silver Palace Guide

以英语为主、同步建设日语核心内容的《Silver Palace》国际服非官方攻略站。

第一版围绕三个特色建设：案件分级提示、探索攻略、养成工具。部署采用 Astro 静态生成与 Cloudflare Pages。

- 公开仓库：[aieasygames-alt/silverpalaceguide](https://github.com/aieasygames-alt/silverpalaceguide)
- Pages 项目：`silverpalaceguide`，默认地址 `https://silverpalaceguide.pages.dev`
- 发布方式：Pages 原生 GitHub 集成，推送 `main` 自动检查、构建并发布；其他分支生成预览。

## 筹备文档

- [第一版筹备与上线方案](docs/launch-plan.md)：定位、功能边界、信息架构、内容与数据规范、技术方案、里程碑和验收标准。
- [内容与开发待办](docs/launch-backlog.md)：页面清单、优先级、英日覆盖、依赖和交付要求。

## 当前约定

| 项目 | 决策 |
| --- | --- |
| 品牌 | Silver Palace Guide |
| 用户 | 国际服玩家 |
| 默认语言 | 英语 `en` |
| 首批扩展 | 日语 `ja` 核心内容 |
| 后续语言 | 优先评估韩语；中文可作为补充 |
| 已注册域名 | `silverpalaceguide.com`；站点规范地址已配置，待绑定 Pages |
| 技术方向 | Astro、TypeScript、Markdown/MDX、结构化 JSON、Pagefind |
| 部署 | Cloudflare Pages，GitHub 集成 |
| 首版账户与进度 | 无账户；收藏、提示展开及清单进度保存在浏览器 |

方案制定日期：2026-11-21（Asia/Shanghai）。

## 本地开发

建议使用 Node.js 24 LTS（见 `.node-version`），最低版本要求见 `package.json`。

```sh
npm ci
npm run dev
```

生产构建与检查：

```sh
npm run check
npm test
npm run build
npm run preview
```

`build` 会生成静态 HTML、英日 Pagefind 索引，并检查内部链接、规范地址、语言、草稿排除和来源引用。构建结果在 `dist/`。搜索需在完成构建后通过 `preview` 验证。

## 已实现的开发基线

- 英日双语首页、导航、资料页面和全文搜索。
- 分层提示交互，使用明确标记的原创练习；游戏事件攻略等待核验后发布。
- 本地探索清单，支持进度、备份导入导出及格式校验。
- 手输入素材规划器，计算缺口并保存；角色自动预设等待可靠数据。
- 官方来源台账 `src/data/sources.json`、英日术语表 `src/data/glossary.json`、有发布门槛的内容集合。
- 本地托管的游戏配图、原创 SVG 图案和本地字体，无远程图片、字体或解析服务依赖。游戏图经 Astro 生成响应式 AVIF/WebP/JPEG，来源与用途见 [图片台账](docs/image-register.md)。
- 英日编辑方针页提供 GitHub 公开纠错入口，仓库包含双语纠错模板。

参见 [部署说明](docs/deployment.md) 和 [实施记录](docs/implementation-status.md)。

GitHub 自动部署的生产与预览验收见 [部署验收记录](docs/deployment-verification.md)。自定义域名的 DNS 切换尚待应用，当前可使用 Pages 默认域名访问。
