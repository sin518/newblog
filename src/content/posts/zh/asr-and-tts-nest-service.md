---
title: "ASR & TTS 语音交互 AI 助手服务"
description: "语音交互"
pubDate: 2026-05-27
tags: [langchain, NestJS]
categories: [开发]
translationKey: getting-started
pinned: true
toc: true
---
# 

## 项目简介

基于 NestJS 构建的全链路语音交互 AI 助手后端服务，集成语音识别 (ASR)、大模型对话 (LLM)、语音合成 (TTS) 三大能力，实现「用户语音输入 → 智能回复 → 语音输出」的端到端语音交互体验。

## 技术栈

| 类别 | 技术 |
|------|------|
| **后端框架** | NestJS 11、TypeScript 5.7、Node.js |
| **AI / LLM** | LangChain (Chain 组合模式)、OpenAI Compatible API |
| **语音服务** | 腾讯云 ASR (语音识别)、腾讯云 TTS (语音合成) |
| **实时通信** | WebSocket (ws)、SSE (Server-Sent Events) |
| **架构模式** | 事件驱动 (EventEmitter2)、依赖注入 (DI)、模块化设计 |
| **前端** | 原生 HTML5 (MediaRecorder API、MediaSource API、EventSource) |
| **工具链** | pnpm、ESLint、Prettier、Jest |

## 项目结构

```
src/
├── app.module.ts            # 根模块，导入所有功能模块
├── main.ts                  # 入口，启动 HTTP 服务 + WebSocket
├── ai/                      # AI/LLM 模块
│   ├── ai.controller.ts     # SSE 端点，流式对话接口
│   ├── ai.service.ts        # LangChain Chain 编排
│   └── ai.module.ts         # 依赖注入配置
├── speech/                  # 语音处理模块
│   ├── speech.controller.ts # REST API，语音识别接口
│   ├── speech.service.ts    # 腾讯云 ASR 集成
│   ├── tts-relay.service.ts # WebSocket 中继，TTS 流式合成
│   └── speech.module.ts     # 依赖注入配置
├── commom/                  # 公共工具
│   └── stream-events.ts     # 事件类型定义
└── public/                  # 前端 Demo 页面
    ├── asr-ai-stream.html   # 完整语音交互 Demo
    └── asr.html             # 语音识别测试页
```

## 核心功能

### 1. 语音识别 (ASR)

- 端点：`POST /speech/asr`
- 通过 REST API 接收音频文件 (OGG-Opus 格式)，转 Base64 后调用腾讯云 ASR 接口完成语音转文本

### 2. AI 流式对话

- 端点：`GET /ai/chat/stream?query=...&ttsSessionId=...`
- 协议：SSE (Server-Sent Events)
- 基于 LangChain 的 `PromptTemplate → ChatOpenAI → StringOutputParser` Chain 组合模式
- 实现 Token 级别的流式响应，降低用户等待感知
- 传入 `ttsSessionId` 时自动触发 TTS 语音合成管线

### 3. 语音合成 (TTS) 流式传输

- 端点：WebSocket `/speech/tts/ws`
- 设计 WebSocket Relay 中继架构：服务端作为中间层，桥接客户端与腾讯云 TTS WebSocket
- 实现会话管理、待发送队列缓冲、HMAC-SHA1 签名鉴权、断线重连等机制
- 将腾讯云返回的二进制音频流实时转发给客户端播放

### 4. 端到端语音管线

```
用户录音 → POST /speech/asr → 腾讯云 ASR → 返回文本
    ↓
GET /ai/chat/stream (SSE) → LangChain 流式生成回复
    ↓
EventEmitter2 发布 AI_TTS_STREAM_EVENT
    ↓
TTS Relay Service → 腾讯云 TTS WebSocket → 二进制音频流
    ↓
WebSocket 转发至客户端 → MediaSource 实时播放
```

## 技术亮点

- **事件驱动架构**：通过 `EventEmitter2` 发布 `AI_TTS_STREAM_EVENT` 事件，将 AI 流式输出与 TTS 合成解耦，各模块独立演进
- **WebSocket Relay 模式**：设计中继服务模式管理客户端与腾讯云的双向 WebSocket 连接，处理连接生命周期、消息缓冲与转发
- **流式处理全链路**：AI 响应以 SSE 流式下发 → 触发 TTS 事件 → WebSocket 流式返回音频 → 客户端 MediaSource 实时播放，端到端延迟低
- **HMAC 签名鉴权**：手动实现腾讯云 WebSocket API 的 HMAC-SHA1 签名认证流程
- **NestJS 模块化设计**：遵循 DI 注入、Factory Provider、模块隔离等 NestJS 最佳实践

## 环境变量

| 变量名 | 说明 |
|--------|------|
| `SECRET_ID` | 腾讯云 SecretId |
| `SECRET_KEY` | 腾讯云 SecretKey |
| `APP_ID` | 腾讯云应用 ID |
| `TTS_VOICE_TYPE` | TTS 音色类型 |
| `OPENAI_API_KEY` | OpenAI API Key |
| `OPENAI_BASE_URL` | OpenAI API Base URL (兼容接口) |
| `MODEL_NAME` | 使用的模型名称 |

## 启动方式

```bash
# 安装依赖
pnpm install

# 启动开发服务
pnpm run start:dev

# 访问 Demo 页面
# http://localhost:3000/asr-ai-stream.html
# http://localhost:3000/asr.html
```
