# 第三阶段质量检查与资料接入记录

日期：2026-11-22，Asia/Shanghai。本次交付覆盖 P3-01 的移动端、键盘、表单和本地存档检查，以及 P3-02 的发行信息复核和采集工具。真实案件、路线和完整成本尚无实测包，不作为已发布内容。

## 修复与功能验证

| 问题 | 修复 | 验证 |
| --- | --- | --- |
| 英语首页冷加载出现字体切换，主图被上方文字重排推动，单次 CLS 0.218 / 性能 89 | 预加载正文常规字重和英语标题字体；四个同源字体使用 `font-display: optional`，慢连接保持首次渲染使用的字体 | PSI 明确将两次偏移归因于 DM Sans 和 Cormorant Garamond；修复后按下节重新测量 |
| 铜色小字与深色纸底上的灰字对比度不足，首页自动无障碍 95 | 铜色改为 `#875b35`，灰字改为 `#56645a` | 在最深的常用纸底 `#eae5d9` 上，对比度分别约 4.67:1、4.96:1；PSI 自动无障碍检查复测 |
| Cloudflare 自动注入的 beacon 被本站 CSP 拦截，最佳实践 92 | HTML 路径增加 `Cache-Control: public, max-age=0, must-revalidate, no-transform`；保留已有 CSP | 正式域名检查确认 no-transform 且无 beacon；浏览器无相应控制台错误，PSI 最佳实践复测 |
| 移动材料表过于拥挤、错误只有总体提示 | 素材名单行，所需/已有分列，缺口独立显示；每个字段有可见标签、`aria-invalid` 和关联错误；按钮/结果名称随素材名更新 | 负数和空值定位正确；无效修改不写入存档，导出禁用；120−35=85；非法备份不覆盖有效计划 |
| 手机菜单 Escape 关闭后焦点可能留在被隐藏的导航中 | 从导航关闭时返回菜单按钮；弹窗中不响应 `/` 搜索快捷键 | 320px 英语页面用 Enter 打开菜单，从导航按 Escape 后焦点回到 Menu，`aria-expanded=false` |
| 练习与真实案件的完整解答使用不同确认方式 | 两者共用页面内确认框及焦点返回逻辑 | 默认聚焦取消；Escape 保持答案关闭；确认后展开；关闭返回对应 summary；切换问题后所有提示收起 |
| 日语共享导航及两篇发行指南的官网地址为英文 | 统一指向 `/ja-jp/`，增加日语官网来源，提升日语文章修订号 | 浏览器检查实际链接；术语与来源引用构建检查通过 |

`no-transform` 的行为依据 [Cloudflare Web Analytics 官方文档](https://developers.cloudflare.com/web-analytics/get-started/#sites-proxied-through-cloudflare)。该头阻止代理修改原始 HTML，符合当前不启用客户端统计的隐私说明。散列静态资源继续长期缓存。

## 窄屏与工具检查

- 英日首页、案件练习、探索清单、材料表、搜索、角色页、提示说明，共 14 页，分别在 320/390px 的 iframe 中检查，28 组均无横向溢出。含滚动条的可用内容宽分别为 305/375px，`scrollWidth` 与 `clientWidth` 相同。浏览器 viewport 设置未实际改变本环境窗口，因此使用明确尺寸的 iframe，不把桌面窗口称作手机实机。
- 旧 v1 材料备份恢复 stable ID、120 个需求、35 个库存，缺口 85；英日切换保留。缺少 required 字段的文件被拒绝，当前计划保持不变。
- 旧 v1 清单备份恢复 `legacy-note` 和已完成状态；刷新和切换日语仍为 1/1；键盘 Space 可改变勾选，重绘后焦点保持在同一项。
- 英语 `launch` 和日语 `リリース` 的搜索结果在本地与生产检查；构建继续验证草稿与解答片段不进入索引。
- 自动无障碍分数与 AX 树检查之外，实际操作验证了菜单、提示、确认框和清单的键盘路径；本轮没有进行 VoiceOver 朗读或完整 WCAG 合规认证。
- 原始报告、窄屏尺寸记录、合成备份、截图与临时检查页面源文件保存在被忽略的 `artifacts/private/`。最终构建不含响应式测试页面。

## 移动性能

正式站代码版本：`4a8d735`。使用 Google PageSpeed Insights 移动端 Moto G Power / Slow 4G 预设，Lighthouse 13.6.0、HeadlessChromium 157.0.8103.38，2026-11-22（Asia/Shanghai），初始页面加载、单页会话。每个 URL 重新点击分析三次，得到 30 个不同的报告 ID；以下为中位数。CPU 限速由服务预设管理，UI 未展示具体倍数，不能把此结果称为手工固定 CPU 倍数的本地基准。

| URL | Performance | LCP | CLS | Accessibility | Best practices | Reports |
| --- | --- | --- | --- | --- | --- | --- |
| `/en/` | 100 | 1.502s | 0 | 100 | 100 | [1](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en/u1gkfogt2r?form_factor=mobile) / [2](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en/w6opqmxjtu?form_factor=mobile) / [3](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en/raz0mpmx7s?form_factor=mobile) |
| `/ja/` | 100 | 1.502s | 0 | 100 | 100 | [1](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja/cwfpus5lie?form_factor=mobile) / [2](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja/t4jg0gydfu?form_factor=mobile) / [3](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja/1el8jflkt7?form_factor=mobile) |
| `/en/guides/reading-case-hints/` | 100 | 0.902s | 0 | 100 | 100 | [1](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en-guides-reading-case-hints/t850ihfbo0?form_factor=mobile) / [2](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en-guides-reading-case-hints/qmpg7977w8?form_factor=mobile) / [3](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en-guides-reading-case-hints/5tuln8kloh?form_factor=mobile) |
| `/ja/guides/reading-case-hints/` | 100 | 0.901s | 0 | 100 | 100 | [1](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja-guides-reading-case-hints/2fhk0sjrdv?form_factor=mobile) / [2](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja-guides-reading-case-hints/ldnxf7wjc7?form_factor=mobile) / [3](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja-guides-reading-case-hints/ayqxg8or0e?form_factor=mobile) |
| `/en/characters/` | 100 | 0.902s | 0 | 100 | 100 | [1](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en-characters/1px8gaqcpa?form_factor=mobile) / [2](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en-characters/4dg1gtnd5r?form_factor=mobile) / [3](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en-characters/sjhyt110x3?form_factor=mobile) |
| `/ja/characters/` | 100 | 0.901s | 0 | 100 | 100 | [1](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja-characters/n3085osqcr?form_factor=mobile) / [2](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja-characters/c7izwtgmm5?form_factor=mobile) / [3](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja-characters/77kys7uqo7?form_factor=mobile) |
| `/en/search/` | 100 | 0.901s | 0.006 | 100 | 100 | [1](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en-search/dgk2v5vran?form_factor=mobile) / [2](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en-search/q67g7nrmig?form_factor=mobile) / [3](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en-search/kyz2mx20nf?form_factor=mobile) |
| `/ja/search/` | 100 | 0.901s | 0.003 | 100 | 100 | [1](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja-search/qxy1qx7hf2?form_factor=mobile) / [2](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja-search/maea0r1nnu?form_factor=mobile) / [3](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja-search/nl5mlfmbbf?form_factor=mobile) |
| `/en/tools/material-planner/` | 100 | 0.901s | 0 | 100 | 100 | [1](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en-tools-material-planner/v286qs4ekh?form_factor=mobile) / [2](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en-tools-material-planner/m5il0vt8wu?form_factor=mobile) / [3](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-en-tools-material-planner/c7z0ma3z9i?form_factor=mobile) |
| `/ja/tools/material-planner/` | 100 | 0.901s | 0 | 100 | 100 | [1](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja-tools-material-planner/esd3l9qlxm?form_factor=mobile) / [2](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja-tools-material-planner/31hijpu8fj?form_factor=mobile) / [3](https://pagespeed.web.dev/analysis/https-silverpalaceguide-com-ja-tools-material-planner/6ie4sf2zq4?form_factor=mobile) |

30 次测量均达到计划中的性能 ≥90、LCP≤2.5s、CLS≤0.1；TBT 均为 0ms。首页修复后的 6 次测量 CLS 均为 0；搜索初始化有微小位移（EN 0.006 / JA 0.003），远低于本轮门槛。日语材料表第二次 LCP 为 1.201s，其余两次约为 0.901s，全部纳入统计。

当前无真实用户数据，因此 INP 未测、现场 Core Web Vitals 未判定；不能用 TBT 代替 INP。自动无障碍分数不代表全部辅助技术体验。角色研究页及搜索页仍按产品策略 noindex，Lighthouse 的相应 SEO 扣分是预期结果，不以移除 noindex 来提高评分。

字体修复前出现 CLS 0.218 / 性能 89 的旧版报告未混入上表。完整数值与 30 个报告链接见 [测量数据](audits/2026-11-22-mobile.json)，原始页面快照留在本地私有目录。没有取得独立 Chrome DevTools trace 文件。

## 发行信息与采集交付

- 2026-11-22 重新打开并核对 [Elementa 经 Games Press 发布的原始公告](https://www.gamespress.com/Silver-Palace-Sets-Global-Launch-Date-for-December-14-2026)：2026-12-14（UTC+8）、PC / PS5 / iOS / Android、12 种文本语言、四个商店的公告链接与现有内容一致；公告没有具体开服小时。
- 英文官网动态标题为 `Silver Palace - 12/14 GLOBAL LAUNCH`；日语官网标题为 `『白銀の城』——2026年12月14日、全世界同時リリース決定`，并可见日语导航。两者动态内容加载不完整，不将此检查写为客户端可下载、所有地区商店可用或游戏已开服。
- 日语官方名称 `白銀の城` 的词条出处更新为日语官网；网站自定义的三层提示名称仍标记为本站界面用语，没有冒充官方术语。未采集到真实角色、材料、任务名称，因此不新增这些术语。
- 新增 `npm run capture:new -- <case|route|interval> <stable-id>`。创建私有 manifest、原图目录、截图台账及对应采集表；未知值为 null，同名目录拒绝覆盖，路径穿越参数被拒绝。已创建三份 `intake-01` 空资料包，它们不是游戏条目，不进入公开路由或脚本。
- 模板要求：案件的前置/阶段/线索/三层提示和独立复现；路线的可辨认起点/有序步骤/完成条件和清单复测；材料的逐步费用/全部成本类别/独立手算以及未知≠零。见 [内容流程](content-workflow.md) 和 `docs/capture-kit/`。
- 当前提供的图片均是展示图、插画或发行海报，官方公告只描述功能；这些资料不能支持完整解法、可复现路线或培养成本。因此 P3-03–05 保持待实测资料，没有把开发 fixture 或采集模板改成真实攻略。

## 发布与收录

代码提交：`f69e691`（移动工具、确认、来源及采集包），`4a8d735`（字体偏移修复）。两次均通过 GitHub 原生集成触发 Cloudflare Pages，不使用手工上传部署。

本地最终代码检查：51 文件、0 错误/警告/提示；17 项测试通过；构建 30 页，Pagefind 收录 24 页。正式域名 20 项部署检查通过，包含 HTTPS、英日规范地址、sitemap、私有路由 404、www 301，以及新增的 HTML 防统计注入断言。

已通过现有浏览器登录检查域名型 Search Console 资源，返回 “you don't have access to this property”。未进行所有权授予、DNS 验证或 sitemap 提交，也没有获得查询和收录基线；P3-06 仍待站点所有权验证。
