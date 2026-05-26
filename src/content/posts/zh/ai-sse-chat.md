---
title: "智能定时任务助手"
description: "agent定时任务"
pubDate: 2026-05-21
tags: [langchain, NestJS]
categories: [开发]
translationKey: getting-started
pinned: true
toc: true
---

## 项目简介

基于 **NestJS + LangChain** 构建的 AI Agent 自动化平台。用户通过自然语言与 AI 对话，AI 自动理解意图并调用工具完成任务，支持定时/周期任务调度、邮件发送、联网搜索、数据库 CRUD 等操作。

> 例如用户说"1分钟后提醒我喝水"，AI 自动拆解时间与任务，创建一次性定时任务，到期后由后台 Agent 自主执行并发送邮件。
> ![](https://cdn.jsdelivr.net/gh/sin518/newblog@main/img/823fbab0-ca1e-4f11-ada4-49ac2217d8ce.png)
> ![](https://cdn.jsdelivr.net/gh/sin518/newblog@main/img/4c1128fd-0467-41c0-b62a-5a52ae88ce60.png)

## 技术栈

| 类别     | 技术                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| 后端框架 | NestJS 11、TypeScript 5.7                                                     |
| AI / LLM | LangChain（@langchain/core + @langchain/openai）、GLM-5.1（通义千问兼容接口） |
| 数据库   | MySQL + TypeORM                                                               |
| 定时调度 | @nestjs/schedule + cron（支持运行时动态管理）                                 |
| 工具集成 | Nodemailer（邮件）、Bocha Web Search API（联网搜索）                          |
| 数据校验 | Zod（工具入参）、class-validator（REST DTO）                                  |
| 通信协议 | REST API + SSE 流式响应                                                       |

## 核心功能

### 1. AI Agent 多轮对话引擎

- 基于 LangChain 的 **Tool Calling** 机制，实现 AI 自主决策 → 调用工具 → 获取结果 → 继续推理的多轮循环
- 支持**批量**和 **SSE 流式**两种响应模式，流式模式下实时推送文本块，检测到工具调用时自动切换为阻塞执行
- 维护完整 Message 历史上下文，保证多轮对话的连贯性

### 2. 三种定时任务类型

| 类型    | 触发方式                     | 典型场景              |
| ------- | ---------------------------- | --------------------- |
| `at`    | 指定时间点执行一次，自动停用 | "1分钟后提醒我喝水"   |
| `every` | 固定毫秒间隔循环执行         | "每5分钟检查数据库"   |
| `cron`  | Cron 表达式循环执行          | "每天早上9点发送报告" |

- 任务持久化到 MySQL，应用重启后自动恢复所有已启用的任务（`onApplicationBootstrap`）
- 运行时通过 `SchedulerRegistry` 动态增删改查定时器实例

### 3. 双 Agent 架构

| Agent         | 职责                       | 可用工具                                       |
| ------------- | -------------------------- | ---------------------------------------------- |
| **主 Agent**  | 处理用户对话，决策任务拆解 | 全部 6 个工具                                  |
| **Job Agent** | 后台静默执行定时任务指令   | send_mail、web_search、db_users_crud、time_now |

Job Agent 不含 `cron_job` 和 `query_user` 工具，从设计上避免递归调用。

### 4. 工具系统（6 个 LangChain Tool）

| 工具            | 功能                                          |
| --------------- | --------------------------------------------- |
| `query_user`    | 按 ID 查询用户信息                            |
| `send_mail`     | 发送文本/HTML 邮件（QQ 邮箱 SMTP）            |
| `web_search`    | 联网搜索（Bocha API），返回标题、摘要、URL 等 |
| `db_users_crud` | MySQL users 表 CRUD 操作                      |
| `time_now`      | 获取服务器当前时间（北京时间 UTC+8）          |
| `cron_job`      | 定时任务管理（list / add / toggle）           |

每个工具通过 Zod Schema 校验入参，通过 NestJS DI 工厂模式注入到 AI Service。

## 系统架构

```
┌─────────────────────────────────────────────────┐
│                   用户请求                        │
│            GET /ai/chat[?stream]                  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              AiController                        │
│         (REST + SSE 流式输出)                     │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              AiService                           │
│  ┌───────────────────────────────────────────┐   │
│  │  while(true) {                            │   │
│  │    model.invoke(messages) → tool_calls?   │   │
│  │    if tool_calls → 执行工具 → ToolMessage  │   │
│  │    else → return 最终回答                  │   │
│  │  }                                        │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ChatOpenAI (glm-5.1) + 6 个绑定工具             │
└───┬──────┬──────┬──────┬──────┬──────┬──────────┘
    │      │      │      │      │      │
    ▼      ▼      ▼      ▼      ▼      ▼
  用户   邮件   搜索   数据库  时间   定时任务
  查询  SMTP   Bocha  MySQL  now   SchedulerRegistry
                                    ↓
                               JobAgentService
                               (后台自主执行)
```

## 关键设计

**Tool-as-Service 模式** — 每个工具封装为 NestJS Injectable Service，通过 `readonly tool` 暴露 LangChain Tool 实例，再由 Module 工厂 Provider 注入到 AI Service。

**运行时调度管理** — 任务创建/删除/启停均在运行时动态操作 `SchedulerRegistry`，不依赖编译期装饰器。

**流式工具检测** — 流式响应中持续 `concat` 消息块，一旦检测到 `tool_call_chunks` 立即停止推流，转为同步执行工具，兼顾用户体验和执行准确性。

**优雅降级** — 工具执行失败时返回错误文本而非抛异常，AI 自然语言向用户解释原因。

## API 接口

| 方法 | 路径                        | 说明                  |
| ---- | --------------------------- | --------------------- |
| GET  | `/ai/chat?query=xxx`        | 批量对话（返回 JSON） |
| GET  | `/ai/chat/stream?query=xxx` | 流式对话（SSE）       |
| CRUD | `/users`                    | 用户管理 RESTful 接口 |
