---
title: "Nest+tool实现 Openclaw 同款定时任务"
description: "agent定时任务"
pubDate: 2026-05-21
tags: [langchain, RAG]
categories: [开发]
translationKey: getting-started
pinned: true
toc: true
---

## 项目概览

本项目是一个基于 NestJS + LangChain 构建的 AI 助手后端服务，主要用于通过大模型完成对话、工具调用、联网搜索和邮件发送等自动化任务。

项目当前提供普通 HTTP 对话接口和 SSE 流式对话接口，并内置一个前端测试页面用于验证 AI 对话效果。

## 核心能力

- **AI 对话服务**：通过 `ChatOpenAI` 接入兼容 OpenAI 协议的大模型服务。
- **工具调用能力**：模型可根据用户意图自动调用后端工具。
- **用户信息查询**：内置模拟用户数据，可通过用户 ID 查询姓名、邮箱、角色等信息。
- **联网搜索**：集成 Tavily Search API，用于实时检索网页信息，并返回标题、链接、摘要和相关度。
- **邮件发送**：集成 `@nestjs-modules/mailer` 和 SMTP 配置，可由 AI 工具发送邮件。
- **流式响应**：通过 SSE 接口实现 AI 回复的流式输出，适合前端实时展示。
- **静态页面测试**：`public/ai-sse-test.html` 提供浏览器端 SSE 对话测试入口。

## 实现思路

整体实现围绕 `service`、`provider` 和 `tool` 做了拆分：

1. 在 `service` 中加入 Agent Loop，并通过 `stream` 方法实现流式响应，对外提供 SSE 接口。
2. 将工具能力封装到 `provider`，让 `tool` 可以调用内部业务服务。
3. 分别封装邮件发送工具和网络搜索工具。
4. 通过自然语言综合测试工具调用链路，验证模型可以自动选择并调用对应工具。

## 测试效果

通过前端测试页面输入自然语言后，模型可以完成工具调用并返回结果。

![SSE 对话工具调用测试](https://cdn.jsdelivr.net/gh/sin518/newblog@main/img/ScreenShot_2026-05-21_124913_828.png)

邮件发送工具调用成功后，可以正常收到邮件。

![邮件发送测试结果](https://cdn.jsdelivr.net/gh/sin518/newblog@main/img/de5a6852-f242-41d3-8534-01a3545fe408.png)
