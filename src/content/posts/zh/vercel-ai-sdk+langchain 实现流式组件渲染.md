---
title: "AGUI 协议"
description: "Vercel AI SDK + LangChain 实现流式组件渲染"
pubDate: 2026-06-10
tags: [langchain, NestJS, AGUI, SSE, Vite, Vercel AI SDK, Streamdown]
categories: [开发]
translationKey: getting-started
pinned: true
toc: true
---

##项目由来

基于 AGUI 协议与 Vercel AI SDK Data Stream Protocol，我们构建了一套端到端的 AI Agent 实时交互系统，实现了从模型推理到前端渲染的全链路流式架构。

后端架构层面，采用 langchain Agent 作为推理引擎，通过 createAgent API 构建具备自主工具调用能力的 ReAct Agent，注册 Web Search、邮件发送等外部工具，由模型根据上下文动态决策工具调用时机与参数。借助 @ai-sdk/langchain 适配层，将 LangChain 原生 Stream 无缝转换为符合 Data Stream Protocol 规范的 SSE 事件流，实现推理过程的实时逐 Token 下发。

前端渲染层面，基于 @ai-sdk/react / @ai-sdk/vue 的 useChat Hook 对 SSE 流进行协议级解析，构建结构化消息队列。针对不同消息类型采用差异化渲染策略：文本内容通过 StreamDown 组件实现逐字流式渲染，内置 Markdown 语法解析引擎，支持表格、Mermaid 流程图、代码高亮等富文本元素的实时渲染；Tool Call 消息则通过自定义组件独立渲染，以可视化方式呈现 Agent 的工具调用意图、执行状态与返回结果。

核心价值在于：通过 AGUI 协议标准化了 AI Agent 与前端的通信契约，将传统的"请求-等待-响应"模式升级为"推理即渲染"的实时交互范式，显著提升了用户对 AI Agent 行为的可观测性与交互体验。

![](https://cdn.jsdelivr.net/gh/sin518/newblog@main/img/c7abe65c6aff3ef32d65e8bdaf25b0f4.png)

通过前端页面，根据用户输入的信息调用大模型和博查搜索到用户要求的信息

![](https://cdn.jsdelivr.net/gh/sin518/newblog@main/img/50d64cb9d50a938751800561b3c00430.png)

基于 @ai-sdk/react 对 SSE 流进行协议级解析，针对markdown类型采用表格渲染

![](https://cdn.jsdelivr.net/gh/sin518/newblog@main/img/4631b71447208cf70cf2539a6e09708b.png)

增加一个 tool 来实现让大模型发送邮件

![](https://cdn.jsdelivr.net/gh/sin518/newblog@main/img/dfe75c54470bb8dff3cd31047584f202.png)

![](https://cdn.jsdelivr.net/gh/sin518/newblog@main/img/50576e2b96d616eaea2c59f6df10ac28.png)

##后端介绍

项目简介：
基于 NestJS 框架构建的 AI Agent 后端服务，集成 LangChain Agent 与多种工具调用能力（联网搜索、邮件发送），通过 Server-Sent Events 实现流式响应，前端可实时渲染 AI 对话内容。

技术栈：
| 类别 | 技术 |
|------|------|
| **后端框架** | NestJS 11、TypeScript 5.7、Node.js |
| **AI / LLM** | LangChain + LangGraph Agent (createAgent)、ChatOpenAI (OpenAI Compatible API) |
| **流式通信** | Vercel AI SDK (ai + @ai-sdk/langchain)、SSE (pipeUIMessageStreamToResponse)|
| **Agent工具** | Zod 4 (Schema 定义)、Bocha Web Search API (联网搜索)、@nestjs-modules/mailer (邮件发送) |
| **架构模式** | 依赖注入 (DI)、模块化设计、useFactory 动态工厂 |
| **配置管理** | @nestjs/config + .env 环境变量 |
| **工具链** | pnpm、ESLint 9 (Flat Config)、Prettier、Jest 30 + Supertest |

核心亮点：

1. AI Agent 工具调用架构 — 基于 LangChain createAgent 构建 ReAct Agent，注册 web_search 和 send_mail 两个自定义 Tool，实现 LLM 自主决策调用外部能力
2. 流式响应链路 — LangChain Stream → @ai-sdk/langchain 适配层 → Vercel AI SDK UIMessageStream → SSE 推送至前端，全链路异步流式处理
3. NestJS 依赖注入 — 通过 useFactory + ConfigService 动态创建 AI 模型实例和 Tool 实例，实现配置与逻辑解耦
4. Schema 驱动的 Tool 定义 — 使用 Zod 定义 Tool 输入参数的类型约束和描述，LLM 根据 Schema 自动生成结构化调用参数

##前端介绍

项目简介

基于 Vercel AI SDK 构建的 AI 智能对话前端应用，支持流式对话、工具调用可视化、Markdown 实时渲染等核心能力。

技术栈
| 类别 | 技术 |
|------|------|
| **前端框架** | React 19、TypeScript 6 |
| **构建工具** | Vite 8（Oxc 编译）、ESM Module |
| **AI 通信** | Vercel AI SDK |
| **流式渲染** | Streamdown（流式 Markdown）、Shiki（代码高亮）、Mermaid（图表） |
| **样式方案** | Tailwind CSS v4（CSS-first 配置）、CSS Custom Properties 设计系统、Dark Mode |
| **工程化** | ESLint 10、TypeScript Strict 模式 |

1. 流式 AI 对话系统

- 基于 Vercel AI SDK 的 useChat Hook 实现流式对话，通过 HTTP Streaming 协议与后端实时通信
- 对接后端 LLM 服务，支持多轮对话上下文管理与流式状态追踪（ready → submitted → streaming → error）

2. 流式 Markdown 实时渲染

- 集成 Streamdown 实现流式 Markdown 边生成边渲染，支持未完成 Markdown 的增量解析
- 通过 Shiki 实现代码块语法高亮（支持 Light/Dark 双主题），集成 Mermaid 插件支持流程图、时序图等图表实时渲染

3. AI Tool Calling 可视化

- 设计并实现工具调用的前端渲染层，支持多种工具的差异化展示：
  - web_search：结构化搜索结果卡片（标题、摘要、来源、发布时间）
  - send_mail：邮件预览面板，支持流式参数生成与动画过渡
  - 通用工具：JSON 格式化兜底展示
- 基于 TypeScript 类型守卫（Type Guard）实现工具输入的运行时类型校验与解析

4. 主题系统与设计工程化

- 基于 CSS Custom Properties 构建完整设计 Token 体系，实现 Light/Dark 双主题自适应
- 结合 Tailwind CSS v4 的 @theme 指令，将 CSS 变量映射为工具类语义化颜色，统一手写 CSS 与 Tailwind 的主题一致性
