# Sin's Blog

这是一个基于 Astro 构建的个人技术博客，主要记录全栈开发、AI Agent、RAG、前端工程化以及日常技术实践。

- 线上博客：[https://www.sin518.cfd/](https://www.sin518.cfd/)
- English 首页：[https://www.sin518.cfd/en/](https://www.sin518.cfd/en/)
- 职位雷达：[https://jobs.sin518.cfd/](https://jobs.sin518.cfd/)
- GitHub 仓库：[https://github.com/sin518/newblog](https://github.com/sin518/newblog)

## 项目定位

这是一个以内容为中心的静态博客。文章以 Markdown/MDX 文件保存在 Git 仓库中，Astro 在构建阶段生成 HTML、RSS、Sitemap、OG 图片和 Pagefind 搜索索引。

主要特点：

- 文章像代码一样进行版本管理、审查和回滚；
- 生产环境不需要运行 Node 服务或数据库；
- 页面默认是静态 HTML，加载快、部署简单；
- 主题切换、搜索、语言切换、评论等交互只在需要的位置加载客户端脚本。

首页上的“职位雷达”是博客到独立求职工具的入口。博客只负责展示入口，招聘数据和职位筛选逻辑运行在独立的 [jobs.sin518.cfd](https://jobs.sin518.cfd/) 服务中。

## 技术栈

### 核心框架

| 技术                                          | 当前版本/来源   | 用途                             |
| --------------------------------------------- | --------------- | -------------------------------- |
| [Astro](https://astro.build)                  | `^6.3.1`        | 静态站点生成、文件路由、页面布局 |
| [TypeScript](https://www.typescriptlang.org/) | `^6.0.3`        | 类型检查和配置类型约束           |
| [Bun](https://bun.sh/)                        | `1.3.0`（推荐） | 包管理、脚本运行和本地开发       |
| [Vite](https://vite.dev/)                     | Astro 内置      | 开发服务器和构建流水线           |

### 样式、组件与交互

| 技术                                              | 用途                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| [Tailwind CSS](https://tailwindcss.com/) v4       | 原子化 CSS、响应式布局和设计令牌                                  |
| [daisyUI](https://daisyui.com/) v5                | 基于 Tailwind 的主题和基础组件样式                                |
| Astro Islands                                     | 只为主题切换、搜索、目录、语言切换等交互组件发送必要的 JavaScript |
| [Iconify](https://iconify.design/) / `astro-icon` | Lucide、Simple Icons 等图标                                       |
| `@fontsource/*`                                   | Inter、Lato、Source Sans 3、JetBrains Mono 字体                   |

### 内容处理与搜索

| 技术                                        | 用途                                                   |
| ------------------------------------------- | ------------------------------------------------------ |
| Markdown / [MDX](https://mdxjs.com/)        | 编写博客文章和静态页面                                 |
| Astro Content Collections                   | 内容加载、Frontmatter 校验和类型安全                   |
| [Zod](https://zod.dev/)                     | 文章元数据 schema 校验                                 |
| `remark-gfm`                                | 表格、任务列表、删除线等 GitHub Flavored Markdown 语法 |
| `remark-math` + [KaTeX](https://katex.org/) | 数学公式解析和构建时渲染                               |
| `remark-alert` / `remark-ashtml`            | 提示块和 HTML 内容扩展                                 |
| `rehype-slug` / `rehype-autolink-headings`  | 标题锚点和可分享的段落链接                             |
| `rehype-external-links`                     | 外部链接自动添加新窗口和安全属性                       |
| [Pagefind](https://pagefind.app/)           | 构建阶段生成静态全文搜索索引                           |

### SEO、图片与评论

| 技术                                            | 用途                                        |
| ----------------------------------------------- | ------------------------------------------- |
| `@astrojs/sitemap`                              | 生成 Sitemap 和多语言 hreflang 信息         |
| `@astrojs/rss`                                  | 生成中文和英文 RSS Feed                     |
| `satori` + `@resvg/resvg-js`                    | 自动生成文章 Open Graph 图片                |
| Astro Assets / Sharp                            | 本地图片优化、响应式尺寸和 WebP/AVIF 输出   |
| [Giscus](https://giscus.app/)                   | 使用 GitHub Discussions 提供文章评论        |
| Expressive Code + [Shiki](https://shiki.style/) | 代码高亮、复制按钮、行号、diff 和代码块增强 |

## 功能清单

- 中文、英文双语路由：中文使用根路径，英文使用 `/en/` 前缀；
- 首页文章列表、分页、归档、分类和标签页；
- 明亮/深色主题切换；
- Pagefind 静态全文搜索；
- Giscus GitHub Discussions 评论；
- RSS、Sitemap、Canonical URL、Open Graph 和多语言 SEO；
- Markdown/MDX、代码高亮、提示块、数学公式和标题锚点；
- 本地图片优化和文章 OG 图片自动生成；
- 响应式布局，覆盖手机、平板和桌面尺寸；
- 首页“职位雷达”入口，跳转到独立招聘工具。

## 环境要求

建议使用以下版本：

- macOS、Linux 或 Windows；
- [Bun](https://bun.sh/) `>= 1.1.0`，项目锁定的包管理器版本为 `1.3.0`；
- Git；
- 一个可访问 GitHub 仓库的账号（如果要使用 Giscus 评论）。

检查本机环境：

```bash
bun --version
git --version
```

成功标志：两个命令都能输出版本号。

## 本地运行

### 1. 获取代码

```bash
git clone https://github.com/sin518/newblog.git
cd newblog
```

如果代码已经在本地，只需要进入项目目录：

```bash
cd /path/to/newblog
```

### 2. 安装依赖

```bash
bun install
```

成功标志：终端完成依赖安装，且没有安装错误。

### 3. 创建本地环境变量

项目使用根目录的 `.env` 文件读取站点 URL、社交账号和 Giscus 配置。`.env` 已被 Git 忽略，不要提交真实配置、Token 或私密信息。

最小本地配置：

```dotenv
# 本地开发可以使用 localhost；生产环境应填写正式域名
SITE_URL=http://localhost:4321

# 根域名部署保持为空
BASE_PATH=

# 侧边栏社交链接，不需要的项目留空
PUBLIC_GITHUB_HANDLE=sin518
PUBLIC_GITHUB_REPO=newblog
PUBLIC_TWITTER_HANDLE=
PUBLIC_CONTACT_EMAIL=

# 不配置 Giscus 时保持关闭
PUBLIC_GISCUS_ENABLED=false
PUBLIC_GISCUS_REPO=
PUBLIC_GISCUS_REPO_ID=
PUBLIC_GISCUS_CATEGORY=Announcements
PUBLIC_GISCUS_CATEGORY_ID=

# 首页职位雷达入口默认显示；只有明确设为 false 才隐藏
PUBLIC_JOB_RADAR_ENABLED=true
```

配置说明：

- `SITE_URL`：用于 Canonical、OG、RSS、Sitemap 和 hreflang，生产环境应设置为 `https://www.sin518.cfd`；
- `BASE_PATH`：只有部署到子路径（例如 GitHub Pages 的 `/newblog`）时才设置，根域名部署保持为空；
- `PUBLIC_GITHUB_HANDLE`、`PUBLIC_GITHUB_REPO`：作者 GitHub 链接和仓库地址；
- `PUBLIC_TWITTER_HANDLE`、`PUBLIC_CONTACT_EMAIL`：可选的侧边栏社交链接；
- `PUBLIC_GISCUS_*`：从 [giscus.app](https://giscus.app/) 获取，配置完整且 `PUBLIC_GISCUS_ENABLED=true` 后评论组件才会启用；
- `PUBLIC_JOB_RADAR_ENABLED`：首页入口开关。默认显示，设为 `false` 后隐藏入口。

### 4. 启动开发服务器

```bash
bun dev
```

访问 [http://localhost:4321/](http://localhost:4321/)。开发服务器支持热更新，修改 Astro、Markdown 或样式后浏览器会自动刷新。

也可以使用：

```bash
bun start
```

成功标志：终端显示 Astro 开发服务器地址，首页可以看到文章列表和“职位雷达”入口。

## 常用命令

| 命令                   | 作用                                           |
| ---------------------- | ---------------------------------------------- |
| `bun dev`              | 启动开发服务器                                 |
| `bun start`            | `bun dev` 的别名                               |
| `bun run typecheck`    | 运行 `astro check`，检查 Astro/TypeScript 类型 |
| `bun run lint`         | ESLint 检查，禁止 warning                      |
| `bun run lint:fix`     | 自动修复 ESLint 可以修复的问题                 |
| `bun run format`       | 使用 Prettier 格式化源码和内容                 |
| `bun run format:check` | 检查格式但不修改文件                           |
| `bun run build`        | 构建 Astro 静态页面并生成 Pagefind 索引        |
| `bun preview`          | 预览已经生成的 `dist/`                         |
| `bun run serve`        | 先构建，再启动 Astro 预览服务器                |
| `bun run pagefind`     | 只重新生成 `dist/_pagefind/` 搜索索引          |

提交代码前建议依次运行：

```bash
bun run typecheck
bun run lint
bun run build
```

成功标志：三个命令都返回退出码 `0`。`bun run build` 完成后，静态产物位于 `dist/`。

## 编写博客文章

### 文件位置

文章放在以下目录：

```text
src/content/posts/zh/   # 中文文章
src/content/posts/en/   # 英文文章
```

静态页面（关于、隐私政策等）放在：

```text
src/content/pages/zh/
src/content/pages/en/
```

### Frontmatter

最小文章示例：

```markdown
---
title: "文章标题"
description: "用于列表、SEO 和社交分享的简短描述"
pubDate: 2026-08-06
tags: [Astro, TypeScript]
categories: [开发]
---

文章正文...
```

支持的主要字段：

| 字段                  | 类型         | 说明                                                         |
| --------------------- | ------------ | ------------------------------------------------------------ |
| `title`               | string       | 文章标题，必填，最长 140 个字符                              |
| `description`         | string       | 摘要和 SEO 描述，必填，最长 280 个字符                       |
| `pubDate`             | date         | 发布日期，必填                                               |
| `updatedDate`         | date         | 最后更新时间，可选                                           |
| `tags`                | string[]     | 标签，默认空数组                                             |
| `categories`          | string[]     | 分类，默认空数组                                             |
| `heroImage`           | image/string | 本地图片、`public/` 路径或允许的远程图片 URL                 |
| `heroImageAlt`        | string       | 特色图的无障碍替代文本                                       |
| `draft`               | boolean      | 草稿，不参与公开列表                                         |
| `pinned`              | boolean      | 是否置顶                                                     |
| `comments`            | boolean      | 是否显示该文章的 Giscus 评论                                 |
| `toc`                 | boolean      | 是否显示目录，默认开启                                       |
| `math`                | boolean      | 是否加载 KaTeX 数学公式样式                                  |
| `translationKey`      | string       | 中英文文章配对时使用相同的 key                               |
| `unlisted`            | boolean      | 不出现在首页、归档、标签、RSS 和 Sitemap，但仍可通过直链访问 |
| `unlistedHideFromSeo` | boolean      | 为页面输出 `noindex, nofollow`                               |

### 图片

推荐把文章图片放在 `src/assets/` 并通过 Frontmatter 引用，这样 Astro 可以自动生成响应式尺寸和现代图片格式。放在 `public/` 的图片会原样复制，不会经过 Astro 图片优化。

远程图片只有在 `astro.config.mjs` 的 `image.remotePatterns` 中允许的域名才能使用。目前允许的常见来源包括 Unsplash、`*.githubusercontent.com`、jsDelivr、Cloudinary 和 Image Delivery。

## 国际化规则

项目当前支持 `zh` 和 `en` 两种语言：

- 中文是默认语言，首页为 `/`，文章为 `/posts/<slug>/`；
- 英文使用 `/en/` 前缀，文章为 `/en/posts/<slug>/`；
- UI 文案在 `src/i18n/ui.ts`；
- 路由和语言辅助函数在 `src/i18n/`；
- 中英文文章如果使用相同的 `translationKey`，语言切换器会跳到对应译文。

新增语言时，需要同时更新 `src/config.ts`、`src/i18n/ui.ts`、`src/i18n/utils.ts`、内容目录和页面路由，属于跨文件变更，建议先单独设计再实施。

## 首页职位雷达入口

入口组件位于 `src/components/JobRadarSpotlight.astro`，由 `src/pages/[...locale]/index.astro` 引入。它只负责展示入口，不读取招聘数据。

默认行为：

```text
PUBLIC_JOB_RADAR_ENABLED 未设置     → 显示
PUBLIC_JOB_RADAR_ENABLED=true       → 显示
PUBLIC_JOB_RADAR_ENABLED=false      → 隐藏
```

如果职位雷达域名、接口或部署地址发生变化，只需要修改组件中的链接并重新构建博客，不需要改变文章数据结构。

## JobRadar 使用说明（小白版）

JobRadar 是一个“帮你定期找职位”的私人工具。你先告诉它想找什么工作，它再从多个招聘来源收集职位，去掉重复项，按匹配程度打分，最后把结果放到职位列表里。

- 直接打开：[https://jobs.sin518.cfd/](https://jobs.sin518.cfd/)
- 从博客进入：打开首页 → 找到“职位雷达”卡片 → 点击“打开职位雷达”
- 登录方式：GitHub OAuth（不需要把 LinkedIn 密码交给 JobRadar）
- 正式环境的数据位置：Oracle 服务器上的 PostgreSQL `job_radar` 数据库，不保存在你的 Mac 本地
- 招聘来源：LinkedIn、Indeed、Google Jobs（是否能返回结果还取决于来源网站当时是否可访问）

### 第一次使用：登录

1. 打开 [https://jobs.sin518.cfd/](https://jobs.sin518.cfd/)。
2. 在登录页点击“使用 GitHub 登录”。
3. 如果 GitHub 出现授权页面，检查登录账号无误后点击授权。
4. 授权完成后，页面会自动回到 JobRadar 首页。

成功标志：页面右上角出现“已登录：你的 GitHub 用户名”，并且能看到职位列表或“尚无监测任务”。

如果看到“访问不允许”，通常表示当前 GitHub 账号不在这个私人工具的允许名单中；这不是你的浏览器坏了，需要让管理员把账号加入允许名单。

### 第二次开始：先创建一个监测任务

“监测任务”可以理解为一张职位搜索卡片。不同方向最好建不同任务，例如“前端工程师”“AI Agent”“美国远程 Python”。

1. 登录后点击右上角“管理任务”。
2. 点击“新建任务”。
3. 填写任务名称，例如：`前端工程师 - 美国远程`。
4. 填写“搜索词”。每行写一个词，也可以用逗号分隔，例如：

   ```text
   Frontend Engineer
   React
   TypeScript
   ```

5. 在“采集来源”中至少勾选一个来源。第一次建议先勾选 `linkedin`，确认流程正常后再增加 Indeed 或 Google Jobs。
6. 填写“最大职位年龄（天）”。例如填 `7`，表示只关心最近 7 天内发布的职位。可填范围是 1 到 365；新手建议从 `7` 或 `14` 开始。
7. 点击“保存任务”。

成功标志：任务列表出现刚刚创建的任务，并显示“已启用”。回到首页后，左侧“监测任务与筛选”区域也能看到它。

#### 高级设置怎么填

第一次可以全部留空，先让基本搜索跑通。需要更精确时，再点击“显示高级设置”：

| 设置项           | 白话解释                                             | 示例                        |
| ---------------- | ---------------------------------------------------- | --------------------------- |
| 别名             | 同一个职位方向的其他叫法                             | `前端开发`、`Web Developer` |
| 必备技能         | 没有这些技能就不算重点匹配                           | `React`、`TypeScript`       |
| 偏好技能         | 有这些技能会加分，但没有也不一定排除                 | `Next.js`、`GraphQL`        |
| 排除词           | 标题或内容出现这些词时降低/排除关注                  | `实习`、`Senior`            |
| 地点             | 限定城市、国家或地区                                 | `United States`、`New York` |
| 远程偏好         | 说明你想找远程、混合或现场工作                       | `remote`                    |
| 工作类型         | 全职、兼职、合同等                                   | `full-time`                 |
| 运行间隔（小时） | 任务希望多久检查一次；默认是 4 小时                  | 新手保持 `4`                |
| 通知阈值         | 只对达到指定分数的职位尝试发通知；`0` 表示不设最低分 | `70`                        |
| 评分权重         | 调整标题、技能、地点、新鲜度等因素的重要程度         | 第一次不改，使用默认评分    |

注意：公网调度器以约 4 小时为基础周期检查任务，任务不会精确到某一分钟执行；手动运行也有冷却时间。第一版使用时建议把“运行间隔”保持为 `4`，先观察结果数量和质量。

### 手动运行一次采集

创建任务后，回到首页：

1. 在左侧任务列表点击要运行的任务。
2. 找到页面下方的“手动运行”面板。
3. 确认“将运行：”后面是正确的任务名称。
4. 点击“立即运行”。
5. 等待“本次运行”面板显示各来源状态。

成功标志：运行状态变为“成功”，或显示某些来源成功、某些来源失败；成功来源的职位仍会保存，不会因为一个来源失败而全部丢失。

常见状态的意思：

- `运行中`：正在请求招聘来源；请不要连续重复点击。
- `成功`：该来源完成并写入结果。
- `来源暂时限制请求`：来源返回了限流或验证码，稍后再试，不要短时间连续重跑。
- `来源暂时不可用`：来源网站暂时没有正常响应。
- `来源返回的数据无法处理`：来源返回格式异常，通常需要稍后重试或修复采集器。

手动运行默认有约 10 分钟冷却时间。如果按钮提示“请稍后再次运行”，等待倒计时结束即可。

### 自动运行和运行历史

服务器会定期检查已启用的任务，默认基线是每 4 小时一次。只有状态为“已启用”的任务会被自动运行；状态为“已暂停”的任务不会抓取。

在首页底部的“最近运行”区域可以查看：

- 哪个任务运行了；
- 开始和结束时间；
- LinkedIn、Indeed、Google Jobs 各自的结果；
- 抓取数量、去重后新增数量、合并数量和忽略数量；
- 是否触发限流、超时或来源退避。

如果刚创建任务还没有历史记录，先手动点击一次“立即运行”。

### 查看、筛选和打开职位

首页中间是职位列表，左侧是筛选条件，右侧是详情。推荐按下面顺序使用：

1. 先在左侧选择一个监测任务。
2. 在“来源”中选择 LinkedIn、Indeed 或 Google Jobs，或选择“全部来源”。
3. 在“职位状态”中筛选“未读”“感兴趣”“已申请”“已忽略”。
4. 需要更精准时填写“最低分数”和“最大职位年龄（天）”。
5. 输入地点，或在“远程状态”中选择“仅远程/非远程”。
6. 点击某一职位，右侧会显示职位摘要、公司、地点、匹配分数、匹配理由和来源链接。
7. 点击“来源链接”会在新窗口打开原招聘网站；真正投递仍要在原网站完成。

成功标志：右侧“职位详情”中能看到职位标题、公司、匹配得分和至少一个来源链接。

### 处理职位：状态、笔记和申请日期

打开职位详情后，可以把职位当作一个简单的求职清单来管理：

- `未读`：刚发现，还没有处理；
- `感兴趣`：准备进一步了解或准备投递；
- `已申请`：已经在原招聘网站完成投递；
- `已忽略`：明确不考虑。

还可以：

- 在“笔记”里写纯文本，例如面试要求、联系人、薪资或下一步计划；
- 把状态改成“已申请”后，填写申请日期；
- 用“专注队列”一次只处理一份职位，减少来回切换；
- 如果系统把两个来源误判为同一个职位，在详情中的来源列表使用“拆分此来源”。

注意：笔记只保存纯文本，不会把 Markdown 或 HTML 渲染成网页。申请日期不能填写未来日期。

### 导出职位表格

1. 先按任务和筛选条件筛出想要的职位。
2. 点击页面右上角“导出 CSV”。
3. 在浏览器弹出的保存窗口中选择位置。

成功标志：本地出现类似 `job-radar-jobs-2026-08-06.csv` 的文件，可以用 Numbers、Excel 或 Google Sheets 打开。

导出的内容只对应当前筛选条件；如果想导出全部职位，先点击“清除筛选”，再导出。

### 暂停、恢复和删除任务

打开“管理任务”页面后：

- 点击“暂停”：保留任务和历史数据，但停止自动运行；
- 点击“恢复”：重新允许自动运行；
- 点击“编辑”：修改搜索词、来源、地点、年龄范围等设置；
- 点击“删除”：删除监测任务。删除前请确认，因为之后不能依靠页面恢复这个任务。

成功标志：任务徽标从“已启用”变成“已暂停”，或从“已暂停”变回“已启用”。

### 数据保存在哪里，是否会保存到本机

正式公网环境中：

- 职位、任务、运行历史、状态、笔记和申请日期保存到 Oracle 服务器上的 PostgreSQL `job_radar` 数据库；
- 浏览器只保存登录会话 Cookie 和当前页面状态；
- 不需要在 Mac 上安装 PostgreSQL 才能使用公网服务；
- GitHub OAuth 只用于登录和识别允许的 GitHub 账号，不会把 GitHub 密码交给 JobRadar；
- JobRadar 不要求你提供 LinkedIn、Indeed 或 Google 的登录密码。

如果某个来源出现验证码、403、429 或访问限制，说明对方网站正在限制请求。请降低运行频率、等待一段时间，或暂时取消该来源；不要尝试用多个账号绕过限制。

### 小白排错表

| 看到的现象                 | 先做什么                                | 正常结果               |
| -------------------------- | --------------------------------------- | ---------------------- |
| 一直显示“正在检查登录状态” | 刷新页面，确认网络正常                  | 回到登录页或职位列表   |
| “登录服务暂不可用”         | 等几分钟后点击“重试”                    | 能重新显示登录状态     |
| “尚无监测任务”             | 进入“管理任务”创建任务                  | 左侧出现任务名称       |
| “职位列表暂时无法加载”     | 刷新页面，检查任务是否被暂停            | 列表恢复或显示明确错误 |
| 手动运行按钮不可点         | 先选择任务，或等待当前运行结束/冷却结束 | 按钮显示“立即运行”     |
| 某个来源失败但其他来源成功 | 查看“最近运行”的来源状态                | 成功来源的职位仍保留   |
| 导出 CSV 失败              | 换用最新版 Chrome/Edge，并重新点击导出  | 浏览器弹出保存文件窗口 |

### 给第一次使用者的最短流程

如果你只想先验证系统能不能工作，照着这 7 步做：

1. 打开 [https://jobs.sin518.cfd/](https://jobs.sin518.cfd/)；
2. 使用 GitHub 登录；
3. 点击“管理任务” → “新建任务”；
4. 名称填“我的第一份任务”；
5. 搜索词填 `Frontend Engineer`，来源只勾选 `linkedin`，职位年龄填 `7`；
6. 保存后回到首页，选择这个任务并点击“立即运行”；
7. 等待运行结束，点击任意职位查看详情。

如果第 6 步提示来源被限制，不代表你的任务配置错了；先查看“最近运行”的错误分类，等待后再试其他来源。

## 项目结构

```text
.
├── src/
│   ├── assets/                 # Astro 管理和优化的图片、字体资源
│   ├── components/             # 可复用 Astro 组件
│   │   └── islands/            # 需要浏览器交互的组件
│   ├── content/
│   │   ├── posts/zh/           # 中文文章
│   │   ├── posts/en/           # 英文文章
│   │   └── pages/              # 关于、隐私等静态页面
│   ├── i18n/                   # 国际化词典和路径处理
│   ├── layouts/                # 基础、文章和页面布局
│   ├── pages/                  # Astro 文件路由
│   ├── plugins/                # Remark 扩展
│   ├── styles/                 # 全局样式和主题
│   ├── utils/                  # SEO、文章列表、阅读时间等工具
│   ├── config.ts               # 站点、导航、社交和 Giscus 配置
│   ├── content.config.ts       # Content Collections schema
│   └── env.d.ts                # 环境变量类型声明
├── public/                     # 原样复制到网站根目录的静态文件
├── astro.config.mjs            # Astro、Markdown、图片和构建配置
├── package.json                # 脚本和依赖
├── bun.lock                    # Bun 锁文件
└── dist/                       # 构建输出，不应手动编辑
```

## 生产部署（Vercel）

当前博客使用 Vercel 部署，GitHub 仓库为 `sin518/newblog`，生产分支为 `main`。仓库没有额外的 GitHub Actions 部署工作流；如果 Vercel 项目已经连接该仓库，推送 `main` 后会自动触发构建。

在 Vercel 创建或检查项目时使用以下设置：

| 设置              | 值                                      |
| ----------------- | --------------------------------------- |
| Framework Preset  | Astro                                   |
| Install Command   | `bun install`（或使用 Vercel 默认检测） |
| Build Command     | `bun run build`                         |
| Output Directory  | `dist`                                  |
| Production Branch | `main`                                  |

生产环境建议配置：

```dotenv
SITE_URL=https://www.sin518.cfd
BASE_PATH=
PUBLIC_GITHUB_HANDLE=sin518
PUBLIC_GITHUB_REPO=newblog
PUBLIC_JOB_RADAR_ENABLED=true
```

配置 Giscus 时，再补齐 `PUBLIC_GISCUS_ENABLED`、`PUBLIC_GISCUS_REPO`、`PUBLIC_GISCUS_REPO_ID`、`PUBLIC_GISCUS_CATEGORY` 和 `PUBLIC_GISCUS_CATEGORY_ID`。

部署检查步骤：

1. 在 Vercel 的项目设置中确认 GitHub 仓库和 `main` 分支正确；
2. 确认 Production Environment 的环境变量已保存；
3. 推送代码后查看 Vercel Deployment 日志；
4. 部署成功后检查 `/`、`/en/`、`/rss.xml`、`/sitemap-index.xml` 和 `/search/`；
5. 检查首页“打开职位雷达”链接能跳转到 `https://jobs.sin518.cfd/`。

如果博客改为部署到 GitHub Pages 等子路径，需要在构建环境设置 `BASE_PATH`，并同步修改 `SITE_URL`。根域名部署时不要设置 `BASE_PATH`。

## 质量检查与排错

### 常见问题

**页面样式没有更新**

先停止旧的开发服务器，再重新运行 `bun dev`。生产环境则检查 Vercel 是否使用了最新提交，并清除浏览器缓存后重试。

**搜索没有结果**

确认使用的是 `bun run build`，因为 Pagefind 索引是在构建阶段写入 `dist/_pagefind/` 的。只执行 `astro build` 不会生成完整搜索索引。

**Giscus 不显示**

确认 GitHub Discussions 已开启，仓库已安装 Giscus App，并且 `PUBLIC_GISCUS_*` 变量完整。单篇文章还可以通过 `comments: false` 关闭评论。

**图片构建失败**

检查远程图片域名是否在 `astro.config.mjs` 的 `image.remotePatterns` 中；或者把图片下载到 `src/assets/`，使用本地资源引用。

**文章没有出现在列表中**

检查 Frontmatter 是否通过 Content Collections schema，确认 `draft: true` 或 `unlisted: true` 没有误设，并确认文件扩展名是 `.md` 或 `.mdx`。

### 提交前检查

```bash
git diff --check
bun run typecheck
bun run lint
bun run build
```

不要提交 `.env`、私钥、密码、API Token 或本地缓存。提交前先查看：

```bash
git status --short
git diff --stat
```

## 许可

项目代码使用 [MIT License](./LICENSE)。文章、图片和个人内容请遵循文件中标注的版权或来源说明。
