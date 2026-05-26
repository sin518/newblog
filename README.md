# Sin's Blog

个人技术博客，记录全栈开发、AI Agent 和各种技术探索。

🔗 **在线访问：** [https://sin518.github.io/newblog](https://sin518.github.io/newblog)

## 技术栈

| 技术 | 说明 |
| --- | --- |
| [Astro](https://astro.build) v6 | 静态站点生成器 |
| [Tailwind CSS](https://tailwindcss.com) v4 | 原子化 CSS 框架 |
| [daisyUI](https://daisyui.com) v5 | Tailwind 组件库 |
| [MDX](https://mdxjs.com) | Markdown + JSX 写文章 |
| [Pagefind](https://pagefind.app) | 静态站内搜索 |
| [Giscus](https://giscus.app) | GitHub Discussions 评论系统 |
| [KaTeX](https://katex.org) | 数学公式渲染 |
| [Bun](https://bun.sh) | 包管理器 + 运行时 |

## 功能特性

- 中英双语支持（i18n）
- 明 / 暗主题切换
- 站内全文搜索
- 文章评论（基于 GitHub Discussions）
- RSS 订阅 & Sitemap
- 自动生成 OG 图片
- 代码高亮（Expressive Code）
- KaTeX 数学公式
- 响应式布局

## 本地开发

```bash
# 安装依赖
bun install

# 启动开发服务器
bun dev
# 访问 http://localhost:4321

# 构建生产版本
bun run build

# 预览构建结果
bun preview
```

## 项目结构

```
├── src/
│   ├── components/       # Astro 组件
│   │   └── islands/      # 交互式岛屿组件
│   ├── content/
│   │   ├── posts/zh/     # 中文博客文章
│   │   ├── posts/en/     # English blog posts
│   │   └── pages/        # 静态页面（关于、隐私）
│   ├── layouts/          # 页面布局
│   ├── pages/            # 路由页面
│   ├── i18n/             # 国际化配置
│   ├── plugins/          # Remark/Rehype 插件
│   ├── styles/           # 全局样式
│   ├── utils/            # 工具函数
│   └── config.ts         # 站点配置
├── public/               # 静态资源
├── astro.config.mjs      # Astro 配置
└── package.json
```

## 写文章

在 `src/content/posts/zh/` 下创建 `.md` 或 `.mdx` 文件：

```markdown
---
title: '文章标题'
description: '简短描述'
pubDate: 2026-01-01
tags: [标签1, 标签2]
categories: [分类]
---

文章正文...
```

## 部署

推送到 `main` 分支后自动通过 GitHub Actions 构建并部署到 GitHub Pages。

## 配置

站点配置集中在 `src/config.ts`，环境变量参考 `.env.example`。

## 许可

[MIT](./LICENSE)
