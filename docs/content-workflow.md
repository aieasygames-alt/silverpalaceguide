# 游戏攻略内容接入流程

更新：2026-11-22。当前功能已实现；游戏内实测内容仍待采集。所有 `fixture-*` 条目是开发草稿，不是游戏事实，不生成公开路由，也不能出现在浏览器脚本或搜索索引中。

## 数据文件

| 文件 | 用途 |
| --- | --- |
| `src/data/cases.json` | 英日案件、前置条件、阶段/线索稳定 ID、三层提示、各层图片引用 |
| `src/data/routes.json` | 英日探索路线、区域、起点、完成条件、有序步骤与清单文字 |
| `src/data/characters.json` | 英日角色条目、完整育成区间及各材料成本 |
| `src/data/materials.json` | 与角色分离的材料稳定 ID、英日名称 |
| `src/data/evidence-images.json` | 攻略截图的文件路径、尺寸、英日说明、剧透级别、来源和版本 |
| `src/data/sources.json` | 出处、可核验 URL、发布者、日期、事实范围及局限 |

所有游戏条目都有 `translationId`、`locale`、`slug`、`status`、`revision`、`sourceRevision`、`checkedRevision`、`updatedAt`、`checkedAt`、`server`、`build`、`verification`、`sourceIds` 和 `prerequisites`。条目 `id` 必须为 `locale/translationId`，英日 `slug` 相同。

稳定 ID 只使用小写字母、数字和连字符，长度不超过 24。已经发布的路线与步骤 ID 不要改名：浏览器清单通过 `route_<translationId>_<stepId>` 识别同一项。阶段/线索和育成区间 ID 也应保持稳定。

## 接入第一组实测内容

运行以下命令创建独立采集包，每包只处理一组英日内容：

```sh
npm run capture:new -- case <稳定ID>
npm run capture:new -- route <稳定ID>
npm run capture:new -- interval <稳定ID>
```

输出在 Git 已忽略的 `artifacts/private/captures/<类型>-<稳定ID>/`。未知值保持 `null`，不能用占位玩法或猜测数值填齐。命令拒绝覆盖同名目录，包括空目录。原始账号信息、个人笔记和未脱敏录像不进入 GitHub。

| 包内文件 | 填写与使用方式 |
| --- | --- |
| `manifest.json` | 服务器、版本、采集/复现日期、英日名称及官方名称出处、录像位置、英日/剧透审查日期、未解决项 |
| `content.json` | 复用现有模型的英日草稿，以及本包新增材料、截图和来源；只保留当前类型的一个英日对应组 |
| `record.md` | 详细操作、录像时间码、复现过程与编辑笔记；沿用 [案件](capture-kit/case.md)、[路线](capture-kit/route.md)、[材料区间](capture-kit/interval.md) 记录表 |
| `originals/` | 未改动的原图、本地录像和其他私人采集资料 |
| `assets/` | 已脱敏、移除 EXIF/XMP/IPTC 的网站候选截图；文件名使用小写字母、数字、连字符，扩展名为 `.png`、`.jpg` 或 `.webp` |
| `evidence.csv` | 候选截图 SHA-256、出处、适用范围、剧透级别及英日替代文字；每张图一行 |
| `cost-check.json` | 仅材料区间包：逐步成本、每步截图引用、独立手算总量与完整性依据 |

1. 在 manifest 中填写真实范围和名称。`nameSources` 为 `{ "locale": "en"或"ja", "url": "https://…" }` 的数组；URL 须在现有或本包来源中登记为官方网页/社交来源。录像可填 HTTPS URL，或 `originals/` 下的非空文件路径。采集包与截图目录不能通过软链接逃逸到项目或包外。
2. 在 `content.json` 填写真实条目，保持 `status: draft`，复核后填写 `verification: gameplay-verified`、当前 `checkedRevision` 与日期。条目 `translationId` 和 `slug` 与采集 ID 相同，`id` 为 `en/<ID>` / `ja/<ID>`；日语依据当前英语修订。既有内容 ID 和截图 ID/路径不能由首批接入包覆盖。
3. 在 `sources` 记录可复查实测来源，`kind: gameplay-record`，填写 `server`、`build`、`capturedAt`、事实范围和局限；英日条目和图片均引用与 manifest 一致的实测来源。来源 URL 使用 HTTPS 且不含凭证。官方发行公告不能代替案件步骤或成本记录。
4. 将脱敏截图放进 `assets/`，图片条目 `src` 对应 `/images/evidence/<同一文件名>`。填写真实尺寸、英日替代文字、出处、服务器、版本、核验日期和 `spoiler: safe | hint | answer`。CSV 的 `file` 使用 `assets/<文件名>`；`source_url_or_record` 对应 manifest 录像位置或图片实测来源 URL。通过 `shasum -a 256 <文件>` 取得哈希；含逗号、双引号或换行的 CSV 字段使用双引号包裹，内部双引号写为两个双引号。
5. 案件填入阶段、线索 ID 和三层提示。包含安全起始图，每个阶段至少关联一张证据图；安全预览只能用 `safe` 图，前两层不能引用 `answer` 图。所有提示正文与图片继续排除 Pagefind 搜索，完整答案通过页面内确认框打开。
6. 路线填写可复现起点、前置条件、有序步骤和完成条件，包含安全起点图与每步截图。每步 `checklistText` 不超过 200 字。发布后可将路线加入个人清单，重复添加应保留原文字与完成状态。
7. 材料包只处理一个完整区间，英日必须对应同一角色。`amount: null` 表示未知，显式 `0` 表示确认不消耗。`cost-check.json` 的各步须连续覆盖起止阶段，每步包含所有材料/货币（包括确认零值）和截图引用；逐步合计、独立手算、预设成本须三方一致。仍有未知项时保留 `costsComplete: false`，不可生成可用预设。
8. 复现后记录英日文字及剧透边界检查日期，清空已解决的 `unresolved`，再设置 manifest `status: ready-for-review`。这表示提交编辑审查，并不等于自动核验了游戏事实。

## 检查与生成审查包

```sh
npm run capture:status
npm run capture:check -- case-<稳定ID>
npm run capture:check -- case-<稳定ID> --json
npm run capture:prepare -- case-<稳定ID>
```

`capture:check` 只读，缺资料或不一致时退出码为 1，报告列出字段与原因。`capture:status -- --json` 可读取整个私有队列。旧版只有 manifest/CSV 的空采集包会报告缺少 `content.json` 等内容，工具不会自动补写或修改；新实测使用新 ID 创建完整包即可。

`capture:prepare` 先运行相同检查，只有零问题时才生成包内私有 `review/`，再次执行不会覆盖既有审查结果。输出包括 `data/` 的六类 JSON、`public/images/evidence/` 候选图、检查报告及说明。它不修改 `src/data/`、网站图片或发布标记，也不复制原始录像、manifest、私人笔记或 CSV。所有导出条目仍为 `draft`。

结构、哈希、适用范围及成本相等不能证明解法真实，也不能证明脱敏充分。编辑须查看原录像、逐步复现、核对本地化名称和三层提示的实际信息量，再按 ID 合并 `review/data/` 到现有数据文件，不能整文件覆盖已有内容。仅将复核过的图片复制到网站图片目录，确认来源 URL 可以公开。完成真实内容与英日审核后才设置 `published`；沿用现有发布门槛。

最后运行 `npm run check && npm test && npm run build`，检查生成的详情页、语言切换、剧透边界、工具与搜索，再提交 GitHub，由 Cloudflare Pages 原生集成部署。三个 v1 本地存档格式不因采集工具而改变。

## 修订和翻译

- 英语原文改动：增加 `revision` 并令 `sourceRevision` 等于自身的新 `revision`。
- 日语同步：其 `sourceRevision` 填本次依据的英语 `revision`，并增加日语自己的 `revision`。
- `checkedRevision` 只在完成游戏内复核后更新到当前修订。落后于 `revision` 时页面显示“再确认待办”。
- 日语 `sourceRevision` 落后于英语 `revision` 时显示旧译文提示。案件、路线与现有 Markdown 指南都支持此提示。不能填写高于英语当前版的修订号。
- 旧译文可以保留访问，但不能通过改修订号来假装已同步。涉及玩法、路线或成本的英日结构变化必须一起处理。

## 本地数据兼容

清单仍使用 `spg:field-notes:v1`，素材表仍使用 `spg:material-plan:v1`。旧版备份可继续导入。新素材行可带 `materialId`；它用于跨语言匹配库存，不能在同一张表中重复。用户修改材料名字后该行转为自定义行。预设替换需求但不消耗库存，重复应用不会再次扣减。

## 私有浏览器验收

`tests/fixtures/preview.astro.txt` 是仅供开发的页面模板。临时复制至 `src/pages/[locale]/qa-preview.astro`，运行 `npx astro build && npx pagefind --site dist` 后在本地检查。该页使用开发数据，包含明确的私有提示。

**完成后必须移除临时页面并重新运行 `npm run build`。** 正式构建检查会拒绝私有样例标记、样例路由或浏览器脚本中的样例数据，防止误发布。生产产物仍应只有当前实际公开的页面。

## Official character introductions

Descriptive official profiles live in `src/data/character-profiles.json`, separately from verified progression in `characters.json`. Keep both English and Japanese names, titles and editorial summaries. Reference registered official website sources, check identity/title/portrait counts, and use null for unavailable equipment or combat information. `npm run verify:content` validates source references and portrait files. Do not publish rarity, acquisition, element, launch availability or numerical costs inferred from icons, occupation, marketing prose or this directory's existence. Official descriptive profiles do not require a gameplay-record source; numerical presets continue to use the existing gameplay verification gate.
