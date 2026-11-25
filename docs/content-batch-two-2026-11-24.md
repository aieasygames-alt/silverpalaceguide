# 第二批内容落地记录

发布补充（2026-11-25）：本批已随 `57afe79` 发布并完成线上验收，详见[正式发布记录](production-release-2026-11-25.md)。下文保留开发当时的验收状态。

日期：2026-11-24（Asia/Shanghai）。本批承接[内容扩展规划](content-expansion-plan-2026-11-24.md)的 C-06 地区/势力与 C-07 官方更新入口，并补强已有战斗和推理文章。第一批游戏总览与 Lorin 详情继续保留，详见[第一批记录](content-batch-one-2026-11-24.md)。

## 已完成内容

| 交付 | 内容与用途 |
| --- | --- |
| 开发反馈解读，1 个新主题、英日 2 个 URL | `/en/guides/development-updates/` 与 `/ja/guides/development-updates/`：梳理 8 月 22 日二分法测试反馈，介绍会话回看、战斗信息、痕迹灯、城市探索、飞马操作及性能方面的开发计划；说明它们与 7 月系统介绍、10 月发行公告的关系。 |
| Morgue Street 原文扩展，英日同步 | 在原 URL 增加 Silvernia → High Peers → Morgue Street 层级、Cynthia II 与侦探事务所关系、Stonefall Syndicate 的官方英日名及松散帮派联盟背景；保留原有标题锚点，不由背景推导弱点、刷新点或路线。 |
| 战斗与推理原文补充，英日同步 | 战斗指南加入 Catalysts / 触媒在反馈中的上下文；推理指南区分计划中的 Dialogue History 与已介绍的 Evidence Board、Restart Deduction。文章互相提供相应阅读入口。 |
| 6 组官方英日术语 | Dialogue History / バックログ機能、Catalysts / 触媒、Revealer Light / 痕跡ライト、Silverium Pegasus / シルバーリキッド・ペガサス、Silvernia / シルバニア、Stonefall Syndicate / ロアリングストーンズ。术语与人物合计 57 张参考卡。 |
| 指南目录更新入口 | 英日指南目录增加 4 张最近编辑卡片，并给文章列表补充日期。编辑日期和来源核验日期分开显示；同一文章的来源检查日不同则显示范围。按编辑日、最近来源核验日、稳定 slug 排序，不改变原阅读顺序。 |

新增页面继续使用原有目录、语言切换、来源、修订、canonical、hreflang、sitemap 和 Pagefind 流程。日期及重复卡片不额外写入站内搜索正文。

## 来源核验

本轮成功重新获取 4 篇官方完整正文：

- [英语测试反馈，id=107](https://silverpalace.elementagames.com/en-us/newsDetail?id=107)。
- [日语测试反馈，id=108](https://silverpalace.elementagames.com/ja-jp/newsDetail?id=108)。
- [英语地区介绍，id=71](https://silverpalace.elementagames.com/en-us/newsDetail?id=71)。
- [日语地区介绍，id=72](https://silverpalace.elementagames.com/ja-jp/newsDetail?id=72)。

以上来源的台账核验日更新为 2026-11-24。英语反馈和英日地区介绍与 11 月 22 日留存正文对照，所核对标题和正文没有变化；日语反馈为本轮新增来源。其余来源保留实际历史核验日，未统一改成当天。

同时重新取得英日新闻列表第一页，只用于本批来源定位，不代表全站新闻审计。8 月反馈不称为最新公告。Fandom 的正文仍未取得，不新增关于竞品栏目、流量或排名的断言。

Stonefall Syndicate 的英语名称实际出现在地区文章的[帮派插图](https://s.elementagames.com/official/image/20260709/bd7b8c91e0afaaf1316a23569c7fb263.jpg)标题中，已打开图片目视核对；对应日语正文使用「ロアリングストーンズ」，未将日语名字直接翻译成另一组英文名。网站提供原始来源链接，没有复制该图作为站内资产。

原始正文与名称核对图片保存在被 Git 忽略的 `artifacts/private/content-batch-two-20261124/`，不作为公开文章或构建资产发布。

## 适用范围

8 月反馈描述当时的开发意图，未据此宣称正式版已实现所有改动。文章没有虚构会话回看菜单、Catalyst 装备规则、飞马解锁任务、收集物总数、移动端性能或新的技能数值。10 月平台公告也未被用作每个计划均已完成的证据。

本批没有取得可复现游戏记录，因此 G-01 真实案件 → G-02 探索路线 → G-03 完整成本区间继续等待合格资料。Alf、Argos 没有拆成薄内容详情页，现有角色目录继续承载短介绍。

## 验证结果

- `npm run check`：75 个文件，0 错误、0 警告、0 提示。
- `npm test`：42 项通过；新增 2 项验证混合来源日期、缺失来源处理、更新排序与不修改输入。
- `npm run build`：52 个 HTML 页面，Pagefind 收录英日共 48 页；站内链接、静态资源、语言、canonical、草稿隔离、sitemap、来源及新增目录日期检查通过。该数量是本地构建与站内索引，不代表 Google 收录。
- 英日指南目录、新开发反馈、Morgue Street 的 320/390px 视口共 12 组检查无横向溢出；实际内容宽/滚动宽分别为 305/305 与 375/375。目视检查新卡片、地区层级和反馈表格；临时视口检查后恢复默认尺寸。
- 近期文章卡片可进入新文章，英日切换保留对应 URL；地区与推理目录及标题锚点正常。搜索检查发现并清理了原文误留的 `+` 编辑标记，重新构建后复查标题与摘要。
- Stonefall、ロアリングストーンズ、Catalysts、触媒均能检索到唯一对应术语；分类筛选与清空恢复 57 张参考卡正常。
- 站内英文 `Dialogue History`、日文 `バックログ` 检索包含新开发反馈文章，结果链接保留当前语言。抽查页面未记录浏览器控制台 error。

本批仅完成本地开发与验收，没有提交、推送或生产发布，因此未执行生产部署验收，也未声称线上内容或 Google 搜索结果已变化。发布后仍需运行部署检查，并在获得 Search Console 权限后观察索引与查询表现。
