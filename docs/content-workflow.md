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

先运行 `npm run capture:new -- case <稳定ID>`、`route <稳定ID>` 或 `interval <稳定ID>` 创建独立采集包。输出在已忽略的 `artifacts/private/captures/`，包含记录表、未知值为 `null` 的 manifest、图片台账 CSV 和原图目录。已有同名采集包会被拒绝覆盖。原始账号信息、个人笔记和未脱敏录像不进入 GitHub。模板位于 [案件](capture-kit/case.md)、[路线](capture-kit/route.md)、[完整材料区间](capture-kit/interval.md)。这些记录表不是待发布数据，不能直接并入 `src/data/`。

1. 从开发草稿复制结构，保持 `status: draft`，换成真实条目的稳定 ID。不要把开发样例直接改成已发布。
2. 在来源台账中记录可复查的实测记录，`kind` 设为 `gameplay-record`，明确服务器、版本、采集日期和能够证明的事实。官方发行公告不能代替案件步骤或成本记录。
3. 原始截图留在采集档案中；网站用图放进 `public/images/evidence/`。在图片台账填写文件、真实尺寸、英日替代文字、来源、服务器、版本、日期和 `spoiler`：`safe` / `hint` / `answer`。
4. 案件填入阶段、线索 ID 和三层提示。安全预览只能使用 `safe` 图；前两层不允许引用 `answer` 图。所有提示正文与图片均排除 Pagefind 搜索，完整答案通过页面内确认框打开。
5. 路线填写可复现的起点、前置条件、有序步骤和完成条件。每步 `checklistText` 不超过 200 字。公开路线页面可以把步骤加入个人清单；重复加入保留原文字和完成状态，英日页面显示对应语言的步骤标签。
6. 材料成本按完整区间记录。`amount: null` 表示未知，显式 `0` 表示确认不消耗。只有 `costsComplete: true` 且没有未知值的区间可选；标为完整却含未知值会使验证失败。缺少某一类成本时保持 `costsComplete: false`，不能用已知的部分成本冒充完整需求。
7. 完成英语和日语对应条目后再改为 `published` / `gameplay-verified`。发布检查要求已登记的实测来源、对应语言、稳定 ID 对齐、图片引用和版本一致、材料引用存在及英日成本一致。
8. 运行 `npm run check && npm test && npm run build`，检查实际详情页、语言切换、剧透边界与搜索，再通过 GitHub 触发 Pages 部署。

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
