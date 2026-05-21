---
title: "Ai赛博算命"
description: "这是一个命理排盘的软件"
pubDate: 2026-05-03
tags: [nextjs, react, python, typescript]
categories: [开发]
translationKey: getting-started
pinned: true
toc: true
---

SM 是一款以移动端体验为优先的命理排盘应用。当前仓库采用前后端分离架构：

- 前端负责八字、紫微、奇门、六爻等排盘入口与结果展示。
- 后端负责认证、用户资料、排盘记录等服务端能力。

> 项目核心原则：排盘计算与 AI 解读解耦。排盘结果由本地计算引擎生成，AI 只基于结构化结果进行解释、归纳和建议表达。

## 项目概览

Monorepo 根目录提供前后端统一启动脚本，前端位于 `frontend/`，后端位于 `backend/`。

目前已经完成的能力包括：

- 前端已实现首页、八字、紫微、奇门、六爻、记录、设置与登录相关页面。
- 八字排盘已拆分为前端纯函数模块，支持本地记录，也支持登录后保存到服务端。
- 后端已从原 Next.js API Route 迁移到 FastAPI，并保留 `backend/legacy-next/` 作为迁移参考。
- 数据库使用 PostgreSQL / Neon，`backend/prisma/schema.prisma` 保留为数据模型参考。
- 后端运行时通过 `asyncpg` 访问数据库。
- Redis 作为可选缓存接入，用于登录会话和用户资料读取缓存；未配置或连接失败时，会自动退回数据库读取。

## 技术栈

| 模块       | 技术选型                                              |
| ---------- | ----------------------------------------------------- |
| 前端       | Next.js App Router、React 19、TypeScript、TailwindCSS |
| 表单与校验 | React Hook Form、Zod                                  |
| 命理计算   | TypeScript 纯函数模块、部分逻辑使用 lunar-typescript  |
| 后端       | FastAPI、Pydantic、asyncpg                            |
| 数据库     | PostgreSQL / Neon，Prisma schema 作为模型参考         |
| 缓存       | Redis，可选启用，用于 Session 和资料列表缓存          |
| 认证       | 后端 Session、验证码、密码登录接口，OAuth 接入预留    |

## 目录结构

```
├── frontend/                  # Next.js 前端应用
│   ├── src/app/               # App Router 页面
│   │   ├── page.tsx           # 首页
│   │   ├── bazi/              # 八字排盘与演示分析
│   │   ├── ziwei/             # 紫微斗数
│   │   ├── qimen/             # 奇门遁甲
│   │   ├── liuyao/            # 六爻
│   │   ├── records/           # 记录页
│   │   └── settings/          # 设置与登录
│   ├── src/components/        # 页面组件与业务组件
│   ├── src/lib/               # 排盘、AI 指令、主题、工具函数
│   │   ├── bazi/              # 八字计算模块
│   │   ├── ziwei/             # 紫微计算模块
│   │   ├── qimen/             # 奇门计算模块
│   │   ├── liuyao/            # 六爻起卦与排盘模块
│   │   └── ai/                # AI 指令与演示报告
│   └── src/prompts/           # 独立 Prompt 文件
├── backend/                   # FastAPI 后端
│   ├── app/api/routes/        # API 路由
│   ├── app/core/              # 配置与 OAuth 基础设施
│   ├── app/schemas/           # Pydantic 数据结构
│   ├── app/services/          # 业务服务
│   ├── prisma/schema.prisma   # 数据模型参考
│   └── legacy-next/           # 原 Next.js API Route 迁移参考
├── image/                     # UI 参考图与历史素材
├── 主页/                      # 首页、用户页、设置页等参考素材
└── 六爻/                      # 六爻页面与分类素材
```

github:

```
https://github.com/sin518/smbz.git
```

网址：

```
https://www.bzsm.lat/
```
