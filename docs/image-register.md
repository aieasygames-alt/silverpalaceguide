# 图片台账

更新日期：2026-11-22。

2026-11-21 从站点所有者提供的 12 张图片中选用 5 张游戏配图，保存在 `src/assets/game/`。2026-11-22 加入用户新提供的英文 logo，原文件保存在 `public/images/`。图片不依赖下载目录或远程图床。游戏场景、宣传素材和游戏字标不作为攻略验证、角色数值或地图数据的证据，也不声明为网站原创。原始发布 URL 和授权条款未随文件提供，台账如实记录为用户提供，不编造官方素材来源链接。

| 代码 ID / 仓库文件 | 提供的原文件 | 尺寸 | 使用位置 |
| --- | --- | --- | --- |
| `detective` / `detective-scene.jpg` | `3ae4043903b25b0ac443b70209ce4c06.jpg` | 1920 × 1080 | 英日首页主视觉 |
| `parlour` / `parlour-scene.jpg` | `images (7).jpeg` | 690 × 445 | 首页案件入口、案件页侧栏 |
| `city` / `city-detective.jpg` | `images (2).jpeg` | 596 × 335 | 首页探索入口、探索页侧栏 |
| `collage` / `detective-collage.jpg` | `images (6).jpeg` | 554 × 554 | 首页素材规划入口、指南索引侧栏 |
| `launch` / `global-launch.jpg` | `images (4).jpeg` | 596 × 335 | 英日上线准备文章 |
| `public/images/silver-palace-wordmark-en.webp` | `logo en.webp` | 480 × 480 | 英日所有页面的页头、页脚；另附 INDEPENDENT GUIDE 副标识 |

## 呈现规则

- 使用 `src/components/GameImage.astro` 和 Astro 图片管线，生成 AVIF、WebP 与 JPEG 回退版本。构建时压缩、生成多个宽度，所有请求同源。
- 不放大生成超过原图宽度的资源；首页高清横图最大输出宽度为 1440px。小图保持原有清晰度，不添加锐化或虚构细节。
- 设置固有宽高与 `sizes` / `srcset`；主视觉优先加载，其余图片延迟加载。卡片和主视觉使用 CSS 裁切，原文件保留完整。
- 信息性图片提供英日替代文字。功能卡片已有完整标题与说明，配图使用空替代文字，避免重复朗读。
- 发售海报完整呈现，不裁掉日期；具体时间与平台信息仍以文章引用的文字来源为准。
- 英日两版共用图像资源，替代文字和配图说明分别本地化。英文站名、独立站标与非官方声明保留。
- 英文字标原文件约 5.4 KB，主体约 440 × 68px，适合当前最大 228px 的展示宽度。`SiteBrand.astro` 用 SVG 视口排除大幅空白，原文件字节不变；正片叠底使白底与纸色背景融合。页头、页脚共用组件，链接提供英日可访问名称。浏览器小图标继续使用本站原创图标。

## 未采用

中文 `logo.jpeg` 不替换英语主品牌。重复裁切、低分辨率竖版人物图暂不使用。`2.png` 与已选素材的风格、角色关联不够明确，不标注或推断其角色身份。

图片没有经过生成式重绘。此轮未变更域名 DNS，发布沿用 GitHub → Cloudflare Pages。

## 验收记录

- `npm run check`：34 个文件，0 错误、0 警告。
- `npm test`：既有 6 项工具与数据测试通过。
- `npm run build`：30 个页面、24 个英日搜索页面，现有链接、CSP、语言和 sitemap 检查通过。
- 额外核对 40 个图片候选资源（39 个栅格版本及站标）：文件均存在，所有图片具有宽高与替代文字属性。
- 桌面首页、发售指南与英日窄屏已浏览器复核；390px iframe 的实际内容宽度为 375px，滚动宽度也是 375px；功能卡片配图宽度与卡片内宽一致。
- 主视觉的 `sizes` 按封面裁切后的实际分辨率需求计算，避免窄屏高度撑满时误选过小图片。移除首页淡入动画，首屏图文直接显示。
- 截图：`artifacts/screenshots/images-home-en.jpg`、`images-mobile-en-ja.jpg`、`images-mobile-cards.jpg`。

## 后续图片缺口

首页与通用内页配图已足够。下一批优先补充 EN/JA 社交分享封面、首个真实案件的线索与界面截图、探索任务的定位及步骤图、材料图标。具体要求与开发顺序见 [下一阶段任务](next-phase-plan.md)。

## 2026-11-22 英文字标验收

- `npm run check`：35 个文件，0 错误、0 警告；既有 6 项测试通过；生产构建 30 页通过资源、CSP、语言与 sitemap 检查。
- 桌面页头、页脚显示新字标，副标识为 INDEPENDENT GUIDE；原始白边由展示视口处理，不重绘 logo。
- 320px 英语与日语、390px 日语 iframe 复核通过，实际 305px / 375px 内容宽度与滚动宽度一致；最窄日语页头的字标与操作区仍有约 12px 间隔。
- 本次截图：`artifacts/screenshots/logo-home-en.jpg`、`artifacts/screenshots/logo-mobile-en-ja.jpg`。临时响应式测试文件不进入源码或部署。
