---
title: "SBSM 项目面试问题"
description: "AI 面试题目整理"
pubDate: 2026-05-28
tags: [langchain, NestJS]
categories: [面试题目]
translationKey: getting-started
pinned: true
toc: true
---

## 一、架构设计

### 1. 为什么选择 pnpm monorepo 而不是独立仓库？

**核心取舍**

选择 Monorepo（单仓多包）而不是 Multi-repo（多仓库），本质上是用轻微的工具链复杂度换取极高的协作与重构效率。

Monorepo 结构示例：

```
├── packages/
│   ├── shared-types/   (前后端共享的 TypeScript 类型)
│   ├── frontend/       (前端应用，依赖 shared-types)
│   └── backend/        (Python/FastAPI 后端)
```

- **最大痛点（为什么选它）：共享类型与协议同步。** 在前后端分离的独立仓库中，后端接口一改，前端很容易因为不知情而断流。在 pnpm monorepo 中，我们可以将 API 契约（如 Zod Schema、TS Interfaces）抽离到 `packages/shared-types`。后端修改接口后，前端在编译期或 IDE 中就能立刻收到类型报错，实现**"编译即防御"**。
- **统一 CI/CD，但保持独立部署：** 通过 `pnpm --filter` 机制，我们可以实现精准的增量构建。
- **独立部署：** 在 CI（如 GitHub Actions）中，通过检测代码变动路径（`paths: ['packages/frontend/**']`），只有当前端代码改变时才触发前端的部署（如 Vercel/Docker），后端同理。它们在逻辑上统一管理，在物理上独立运行、独立扩容。

### 2. 为什么通过 API Proxy 转发，而不直接调用后端地址？

直接在前端（如 `localhost:3000`）调用后端（如 `api.backend.com`）会带来一系列经典的 Web 安全与网络限制：

**原因一：解决 CORS（跨源资源共享）限制**

浏览器出于同源策略（Same-Origin Policy），默认阻止跨域请求。如果直连，后端必须配置 `Access-Control-Allow-Origin`。虽然可以配置，但在生产环境中频繁处理多域名跨域、预检请求（OPTIONS 额外开销），会增加安全风险和网络延迟。通过 Proxy，前端请求的是同源的 `/api/_`，由 Nginx、Next.js Rewrites 或 Node 代理层在服务器端转发给后端。服务器之间通信没有 CORS 限制。

**原因二：Cookie 跨域与安全传输**

如果前后端域名不一致（如 `app.com` 和 `api.com`），要共享登录态 Cookie，必须将 Cookie 设置为 `SameSite=None; Secure`。这会带来：

- 安全隐患：容易遭受 CSRF（跨站请求伪造）攻击。
- 三方 Cookie 限制：现代浏览器（如 Safari、Chrome）正在逐步完全禁用第三方 Cookie，直连架构未来可能导致用户频繁掉线。
- 同源 Proxy 的优势：前端和代理层同源，Cookie 可以设置标准的 `HttpOnly; SameSite=Strict`，安全性极高，浏览器天然支持。

**原因三：内网隔离与统一入口**

后端服务（如 FastAPI）通常部署在内网 VPC 中，不应该直接暴露公网 IP 或域名。API Proxy（如 Nginx 或 Gateway）作为唯一的流量入口，可以统一收敛限流（Rate Limiting）、日志审计、WAF 防火墙和 SSL 证书管理，保护后端安全。

### 3. 为什么从 Next.js API Routes 迁移到 FastAPI？

这是一个典型的**从"全栈框架内聚"向"微服务/独立后端分离"**的技术演进。

**为什么迁移？（独立后端的必要性）**

1. **计算密集型与长连接任务：** Next.js API Routes 通常运行在 Serverless 环境（如 Vercel）或 Node.js 环境中。如果项目包含复杂的计算逻辑（如排盘引擎）、大量的数据处理、或者需要稳定的 WebSocket 长连接，Node.js 的单线程事件循环和 Serverless 的冷启动/超时限制（通常 15-30 秒）会成为致命瓶颈。Python/FastAPI 天然适合高密度的数学计算。
2. **生态契合度（AI / 数据科学）：** 如果业务涉及大模型（LLM）对接、数据分析、或者需要使用 Python 独占的科学计算库（如 NumPy、Pandas），用 Python 写后端可以无缝集成，而不需要通过 Node.js 去远程调用 Python 脚本。
3. **开发与团队分工：** 随着业务变复杂，后端需要处理复杂的数据库事务、ORM 迁移、消息队列（Celery/Redis）。将后端剥离给专业的后端开发，能够让前端专注于 UI 和交互。

**什么时候 Next.js API Routes 就够用了？**

- **BFF（Backend For Frontend）层：** 主要工作是调用第三方 API、做简单的数据拼装、转发、或者处理静态页面的 SSR 数据获取。
- **轻量级 CRUD：** 增删改查逻辑简单，没有长时运行的任务。
- **全栈独狼/小团队初创项目：** 为了追求极速上线，减少运维两套系统的成本。

### 4. 跨语言（TS & Python）计算逻辑放在哪一边？怎么复用？

这个问题的核心冲突在于：前端想要良好的交互体验（不卡顿、离线可用），后端需要绝对的数据准确性和安全性（防止前端篡改数据）。

**方案一：核心引擎放后端（推荐，安全第一）**

由于涉及复杂的"排盘引擎"（通常包含密集的数学公式或天文历法计算），Python 拥有更成熟的科学计算和矩阵运算库。

- 如何复用/感知？逻辑不直接复用，但数据结构和协议必须复用。
- 利用 OpenAPI (Swagger) 规范。FastAPI 会根据 Python 的 Pydantic 模型自动生成 `openapi.json`。
- 前端利用 `openapi-typescript` 等工具，自动将后端的 Python 数据结构转换为 TypeScript 类型。
- 缺点：每次计算都需要请求后端，网络延迟可能影响前端交互（如拖动滑块时无法实时看排盘结果）。

**方案二：核心引擎放前端，后端只做校验**

如果为了极致的用户体验，要求排盘必须秒开、甚至离线可用，可以将排盘逻辑用 TypeScript 编写在前端。

后端怎么复用？

1. **WebAssembly (WASM)：** 如果想用 Python 统一逻辑，可以用 Pyodide 将 Python 的排盘引擎编译为 WASM，直接在前端浏览器里运行。
2. **Node.js 中转/双端同构：** 如果用 TS 写，后端在校验时，可以单独运行一个微型的 Node.js 服务专门负责跑这个排盘引擎进行结果校验。
3. **重写两份（最差方案，但常见）：** 前后端各写一套。必须编写极其严格的集成测试（用相同的输入矩阵测试两端输出），确保算法完全对齐。

**最佳折中架构取舍**

1. **UI 渲染逻辑（展现层）** 放在前端：前端根据后端给的核心参数，做矩阵变换和可视化渲染。
2. **核心算法引擎（资产层）** 放在后端（FastAPI）：后端作为 Single Source of Truth（单一事实来源）。
3. **优化体验：** 前端可以通过乐观更新（Optimistic UI）或在本地做一套轻量级的"近似计算"用来做动画过渡，但最终资产落地和准确数据必须以服务端异步返回的为准。

---

## 二、数据库 & 数据层

### 5. 为什么用 Prisma 定义 Schema，但运行时用 asyncpg 写 SQL？

**核心痛点：Prisma 的架构设计与 Python 生态的现实冲突。**

**为什么用 Prisma 定义 Schema？**

Prisma 的扩展名 `.prisma` 文件是极佳的**数据建模语言（IDL）**。它具备强大的可视化能力、极简的迁移工具（`prisma migrate`），并且在前端 Node.js 生态中，通过 Prisma Client 能享受完美的 TypeScript 类型提示。在一个 Monorepo 项目中，使用 Prisma 统一管理单源数据库结构（Single Source of Truth）是非常高效的。

**为什么 Python 运行时不能直接用 Prisma Client？**

- **非原生缺陷（关键原因）：** Prisma 的核心引擎（Query Engine）是用 Rust 编写的二进制文件。Node.js 生态对其支持最完美。而 Python 版的 `prisma-client-py` 并不是纯 Python 实现，它在运行时需要通过子进程去调用这个 Rust 引擎，并进行进程间通信（IPC）。这种架构在 Python 高并发环境（如 FastAPI + Uvicorn）下会带来严重的额外性能开销、内存占用以及潜在的死锁风险。
- **asyncpg 的压倒性优势：** asyncpg 是 Python 生态中针对 PostgreSQL 性能最极致的异步驱动（它自己实现了 PostgreSQL 的二进制协议，不依赖 `libpq`）。在需要高性能、榨干数据库吞吐量的 FastAPI 后端中，使用纯 SQL 配合 asyncpg，其执行速度和并发能力通常是 ORM 的数倍。

**总结取舍：** 我们是用 Prisma 做开发期的"数据库设计与迁移工具"，用 asyncpg 做运行期的"高性能数据访问引擎"。

### 6. 离线优先策略中，localStorage 与数据库同步时，冲突怎么处理？

**核心取舍：在"用户体验"与"数据绝对一致性"之间寻找平衡。**

当用户在多设备操作或离线编辑后联网，必然面临数据冲突。常见的处理策略有三种：

**1. 最后写入者胜（Last-Write-Wins, LWW）—— 最简单但有损**

- 机制：每条记录带一个精确到毫秒的时间戳（`updated_at`）。同步时，谁的时间戳最新就覆盖谁。
- 缺点：如果两台设备时钟不同步（Clock Skew），或者用户在 A 设备离线编辑了很久，连网瞬间可能会把 B 设备刚刚在线保存的最新内容覆盖掉，造成数据丢失。

**2. 多版本并发控制 / 乐观锁（MVCC / Versioning）—— 最严谨**

- 机制：每条数据带一个版本号 `version`。
- 流程：设备 A 拿到的是 v1。离线期间，设备 B 在线把数据改成了 v2。当设备 A 联网尝试提交 v1 时，后端发现数据库已经是 v2，拒绝写入，并向 A 返回冲突。
- 冲突解决：此时前端需要弹出提示，让用户选择"保留本地修改"、"覆盖服务器内容"或"合并两者"。

**3. 无冲突复制数据类型（CRDT）—— 体验最好（如 Notion、Figma）**

- 如果业务场景是文档编辑器或复杂的排盘、备忘录，可以采用 CRDT（如 Yjs 或 Automerge）。它把每一次修改拆解为"原子操作日志"（Op-log），联网时在两端按确定性算法合并，保证最终一致性，用户感知不到冲突。

> 对于普通应用，推荐"版本号控制 + 显式冲突解决"（针对核心资产数据）或"逻辑合并"（如：离线期间 A 改了标题，B 改了备注，联网时后端自动把两者的字段合并）。

### 7. Session 存在哪？Redis 降级到 PostgreSQL 时性能差异有多大？

**方案一：Redis（内存数据库，标准方案）**

- 优点：极高的读写性能（10W+ QPS），自带 TTL（自动过期机制），完美契合 Session 的生命周期。
- 缺点：增加了一层基础设施的运维成本，需要处理缓存击穿/雪崩问题。

**方案二：PostgreSQL（关系型数据库，降级/轻量方案）**

- 优点：不需要额外运维 Redis，利用一张 `session` 表配合 JSONB 字段即可搞定，数据持久化更可靠。
- 缺点：每次请求都要查库，对磁盘 I/O 压力大。

**性能差异有多大？（量化对比）**

- **延迟（Latency）：** Redis 读写在微秒级（< 1ms）；PostgreSQL 即便建立了索引，在正常的并发下也在毫秒级（2ms - 10ms）。
- **吞吐量（Throughput）：** Redis 的并发处理能力通常是关系型数据库的 10 倍以上。
- **数据库连接池瓶颈：** 这是最致命的。FastAPI 每次请求如果要从 PostgreSQL 连接池里取一个连接去校验 Session，会瞬间占满连接池，导致真正需要处理核心业务 SQL 的请求排队。

**架构折中建议：** 如果项目初期为了省钱/省事不想用 Redis，可以降级到 PostgreSQL，但必须做两件事：

1. 开启 PostgreSQL 的内存缓存（`shared_buffers`），确保热点 Session 都在内存中。
2. （更优解）改用 **JWT（Stateless Session）**：把 Session 数据加密后存给客户端（Cookie/Storage），后端使用 CPU 算力进行解密校验，完全释放数据库的压力。

### 8. 用户表和 OAuth 表怎么设计？一个邮箱既有密码又绑 Google 怎么处理？

这是一个经典的**多账户关联（Account Linking）**设计。为了支持"一个用户，多种登录方式"，必须将"身份凭证"与"用户主体"解耦。

**数据库设计（1 对 N 关系）**

```
[users 表 (主体)]
  - id (PK)
  - email (唯一，用于业务识别)
  - avatar, nickname...

[auth_accounts 表 (凭证)]
  - id (PK)
  - user_id (FK -> users.id)
  - provider (枚举: 'credentials', 'google', 'github')
  - provider_account_id (第三方唯一 ID，如 Google 的 sub 字段；若是密码登录，可存 null 或固定值)
  - password_hash (仅当 provider='credentials' 时有值)
```

**账户合并策略（以 Google 登录为例）**

当一个用户使用 `test@example.com` 通过 Google 登录时，后端流程如下：

1. **检查邮箱是否存在：** 查询 `users` 表，发现 `test@example.com` 已经存在（之前用密码注册过）。
2. **检查凭证关联：** 查询 `auth_accounts` 表，看看有没有 `user_id = 该用户` 且 `provider = 'google'` 的记录。
3. **核心逻辑分支处理：**

- **分支 A（用户已登录状态下绑定）：** 如果用户是在安全设置页面，主动点击"绑定 Google"，由于此时用户已通过密码登录，属于高信任环境，直接在 `auth_accounts` 插入一条 Google 凭证，完成绑定。
- **分支 B（未登录状态下直接点 Google 登录）：**
  - **安全优先策略（推荐）：** 由于 OAuth 登录只能证明用户当前控制了该 Google 邮箱，为了防止恶意攻击（例如有人在没有验证邮箱的情况下在其他平台抢注了同名邮箱），系统应当拒绝自动合并。系统提示："该邮箱已注册，请先使用密码登录，登录后在个人中心绑定 Google"。
  - **便利优先策略（需邮箱验证）：** 如果 Google 返回的 Profile 中明确标记了 `email_verified: true`（Google 已经帮你验证过该邮箱是该用户本人的），且你的系统完全信任 Google 的验证结果，则可以自动合并——直接在 `auth_accounts` 中插入 Google 记录，并让用户登录成功。

---

## 三、认证 & 安全

### 9. Session-based Auth 和 JWT 各自的优劣？为什么选 Session？

**核心对比**

| 特性 | Session-based Auth (有状态) | JWT (无状态) |
|------|---------------------------|-------------|
| 存储位置 | 服务端（内存/Redis/DB）存储，客户端仅存 SessionID | 客户端存储完整的 Token（Payload + 签名） |
| 状态管理 | 有状态。服务端完全掌控会话 | 无状态。服务端不保存任何会话状态 |
| 封禁/注销 | 极易实现。服务端删掉 Session 即可瞬间将其踢下线 | 极难实现。Token 在有效期内天然有效，除非引入黑名单（这会让 JWT 变回有状态） |
| 扩展性 | 多台服务器需要共享 Session 存储（如 Redis 压力增加） | 水平扩展极容易，服务器只需用密钥验签，无需查库 |
| 数据大小 | Cookie 里只存一个短字符串，网络开销小 | 携带大量 Payload 且经过 Base64 编码，每次请求的网络开销大 |

### 10. 短信验证码开发模式下怎么实现？生产环境防刷策略是什么？

**开发/测试模式下的实现**

在开发阶段，绝对不能每次测试都让云厂商（如阿里云、腾讯云）真实发送短信，这会导致高额的账单且测试极其低效。

- **Mock 机制：** 在代码中封装一个 `SmsService` 接口，生产环境走真实 SDK，开发环境（通过环境变量 `NODE_ENV=development` 判断）走 `MockSmsService`。
- **白名单/固定验证码：** 测试环境下，验证码直接固定为 `123456`，或者直接在后端控制台/日志中打印出来，开发人员看日志输入即可。同时，限制只能向配置好的特定测试手机号发送。

**生产环境防刷策略（纵深防御体系）**

防止恶意刷爆短信接口（导致公司破产或被短信轰炸机利用），需要建立层层拦截机制：

**第一层：人机校验（前置防御）**

- 必须在点击"发送验证码"前通过图形验证码、滑动拼图或 Google reCAPTCHA 校验，确认不是自动化脚本。

**第二层：单一手机号频次限制（防单点轰炸）**

- 1 分钟限制：同一个手机号 60 秒内只能发 1 次（利用 Redis 设一个 `sms:lock:手机号`，过期时间 60 秒）。
- 天级别限制：同一个手机号 24 小时内最多发送 5-10 次，达到上限直接锁定该手机号当天发送功能。

**第三层：单一 IP / 设备的频次限制（防批量肉鸡）**

- 如果攻击者使用脚本池轮换手机号，但 IP 没变：限制单个 IP 每分钟最多调用接口 N 次，每天最多调用 M 次。超过阈值，直接将该 IP 临时拉黑（封禁 2 小时）。

**第四层：验证码的安全生命周期**

- 存入 Redis：Key = `sms:code:手机号`，Value = 验证码，设置 TTL 为 5 分钟。
- 一次性验证：验证码一经校验（无论成功还是失败，防止暴力破解），立刻从 Redis 中销毁（Delete On Read）。
- 错误计数器：输入错误超过 3 次，该验证码直接失效，必须重新发送。

### 11. OAuth 回调用户信息如何与本地关联？多方式如何合并？

> 注：此问题与第 8 题基本一致，这里提炼出更直接的落地伪代码逻辑，供面试时快速输出。

OAuth 回调发生时，你拿到的是 Google 返回的 `google_user_id`（唯一标识）和 `email`。

**核心关联逻辑**

1. 先拿 `google_user_id` 去凭证表（`auth_accounts`）查，如果查到了，说明之前绑过，直接为关联的 `user_id` 签发 Session 登录成功。
2. 如果没查到 `google_user_id`，再拿 `email` 去用户主体表（`users`）查。

**账户合并冲突解决**

```
[ Google 回调拿到用户的 email ]
        │
  是否存在该 email 的记录？
      /           \
    是             否 ──> 直接创建全新用户
    │
  该邮箱是否已绑定过 Google 凭证？
      /           \
    是             否 ──> 触发合并策略
    │               │
  直接登录      ┌─────────┴─────────┐
              安全优先(推荐)      便利优先(需信任)
                │                     │
          拒绝自动合并            自动合并
          提示"请用密码登录"      在 auth_accounts 插入
          在后台安全中心绑定      Google 凭证，直接登录
```

> **推荐做法（安全优先）：** 如果用户是在未登录状态下第一次点"Google 快捷登录"，虽然邮箱撞车了，但系统不能私自自动合并。因为此时你无法百分百确认当前点 Google 的人和当初用密码注册的人是同一个。应当拦截并提示："该邮箱已存在，请先使用密码登录，登录后进入'个人中心 - 安全设置'手动绑定 Google 账号"。

### 12. Session Cookie 的 HttpOnly、Secure、SameSite 分别设什么值？为什么？

这三个属性是现代 Web 安全保护 Session 凭证不被窃取、不被冒用的核心防线：

**1. HttpOnly**

- **设置值：** `true`
- **原因：** 防止 XSS（跨站脚本攻击）。如果网页不幸被黑客注入了恶意脚本（比如通过留言板注入），默认情况下脚本可以通过 `document.cookie` 偷走用户的 SessionID。设置了 `HttpOnly` 后，任何 JavaScript 脚本都无法读取该 Cookie，它只能在发生 HTTP 请求时由浏览器自动带给服务器。

**2. Secure**

- **设置值：** `true`（开发环境在 localhost 下可设为 `false`）
- **原因：** 防止中间人攻击（MitM）和明文窃听。设置为 `true` 后，该 Cookie 只会在 HTTPS（加密信道）请求中被发送。如果用户偶然访问了你站点的 HTTP 版本，浏览器也绝对不会把 SessionID 带过去，避免了在公共 Wi-Fi 等不安全网络下凭证被嗅探。

**3. SameSite**

- **设置值：** 推荐 `Lax`（特定高安全性金融业务可设为 `Strict`）
- **原因：** 防御 CSRF（跨站请求伪造）攻击。
  - `Strict`：太严格。如果用户在百度搜索你的网站点击链接跳过来（第三方导流），浏览器不会带上 Cookie，导致用户开网页时显示未登录，体验很差。
  - `None`：太危险。任何第三方网站异步请求你的接口都会带上 Cookie，容易被 CSRF 轰炸。
  - `Lax`（现代浏览器默认值）：完美的折中。当用户从外站点击链接导航到你的网站（GET 请求跳转）时，Cookie 会带上；但如果是外站通过 `<iframe>`、POST 表单、或者 `fetch/ajax` 异步跨域请求你的接口，Cookie 绝对不会带过去。彻底杜绝了黑客在外站诱导用户点击、静默盗用登录态发请求的可能。

---

## 四、前端

### 13. Next.js App Router 的 RSC 模型与 'use client' 划分

**核心划分原则**

Next.js 的 React Server Components (RSC) 默认所有组件都是 Server Component（服务端组件）。只有显式声明了 `'use client'` 的组件才是 Client Component（客户端组件）。

- **Server Component (RSC)：** 在服务端运行并渲染。它直接拥有读取数据库、文件系统、调用微服务的能力，并且它的依赖包不会被打包进前端的 JS Bundle 中（零前端体积开销）。
- **Client Component (RCC)：** 它依然会在服务端进行初次 SSR（预渲染生成 HTML），但它的 JS 代码会被发送到浏览器进行 Hydration（水合/激活），从而拥有完整的浏览器交互能力。

**什么情况下必须用 `'use client'`？**

当组件需要使用以下只有浏览器才具备的特性时，必须在文件最顶部声明 `'use client'`：

1. 使用 React 状态与生命周期 Hooks：如 `useState`、`useReducer`、`useEffect`、`useLayoutEffect`。
2. 使用浏览器独有的 API：如 `window`、`document`、`localStorage`、`navigator`（如果直接在 RSC 里写，服务端渲染时会直接报 `window is not defined` 错误）。
3. 使用事件监听器：如 `onClick`、`onChange`、`onSubmit` 等需要用户交互的属性。
4. 使用了依赖浏览器 API 的第三方组件：有些老旧的 UI 库或者图表库内部直接访问了 `window`，引入它们时也需要包裹在 `'use client'` 组件中。

> **架构提分点：** 不要滥用 `'use client'`。好的 RSC 架构应当是"叶子节点（Leaf Nodes）是 Client Component，树干和根节点（Tree Trunk）是 Server Component"。例如，一个商品详情页，整个页面和数据获取都是 RSC，只有右上角的"收藏按钮"因为需要处理点击状态，被抽离成一个 `'use client'` 的微型组件。

### 14. React Hook Form + Zod 的校验流程与逻辑复用

**校验流程**

1. **定义 Schema (Zod)：** 使用 Zod 定义表单数据的结构、类型和业务校验规则（如 `z.object({ email: z.string().email() })`）。
2. **绑定 Resolver (React Hook Form)：** 通过 `@hookform/resolvers/zod` 将 Zod Schema 注入到 `useForm` 的 `resolver` 配置项中。
3. **触发校验：**
   - 触发时机：根据配置（`mode: 'onChange' | 'onBlur' | 'onSubmit'`），当用户输入或提交表单时，RHF 拦截事件。
   - 执行验证：RHF 将当前表单的整个静态对象塞给 Zod 执行 `safeParse()`。
   - 错误回显：如果 Zod 校验失败，会将结构化的错误信息（`errors` 对象）映射回 RHF，自动触发组件重绘，在界面上显示具体的 `error.message`。

**前后端校验逻辑有没有复用？怎么复用？**

这取决于项目的架构。在像本案例这样的 pnpm monorepo 架构下，前后端校验逻辑可以做到完美复用或深度对齐：

1. **方案一：Monorepo 内共享 TypeScript/Zod（同构复用）** — 如果是 Next.js 前端 + Next.js API Routes（或者 Node.js 后端），我们可以将 Zod Schema 写在 `packages/shared-schema` 中。前端用它做表单即时验证，后端在接收到 `req.body` 时，直接运行 `schema.parse(req.body)`。这是最高效的方案。
2. **方案二：跨语言协议对齐（TS + Python/FastAPI）** — 如果后端是用 Python (FastAPI + Pydantic)，两端无法直接共享同一个 Zod 文件。
   - 落地做法：通过 OpenAPI/Swagger 桥接。FastAPI 运行生成的 `openapi.json` 包含了后端的验证规则。前端可以使用工具将 OpenAPI 的 schema 转换为 TypeScript 类型，确保两端对齐。
   - 规则重写：核心的复杂业务校验（如"用户名不能重复"）必须在后端查库校验。前端的 Zod 只负责第一道防线（格式、长度、非空），通过分工达成逻辑上的互补。

### 15. 移动端适配 h-dvh 与 100vh 的区别及 iOS Safari 的坑

**核心区别**

- **`100vh`（Viewport Height）：** 它是视口高度的 100%。但它的致命问题在于，它计算的是浏览器工具栏（地址栏、底栏）完全展开时的静态高度。
- **`100dvh`（Dynamic Viewport Height）：** 它是动态视口高度。它会随着浏览器工具栏的显示或隐藏，实时自动调整自身高度。

**iOS Safari 上的惊天巨坑**

如果你在 iOS Safari 上用 `100vh` 布局一个全屏的 App 页面（底部带有固定导航栏），你会发现底部的导航栏会被 Safari 弹出的自带底栏死死遮住。用户必须向上滑动一下页面、让 Safari 的工具栏收起，才能点到你的按钮。

**解决方案演进史**

1. **过去（老旧方案）：** 通过 JS 监听 `window.onresize`，计算 `window.innerHeight`，然后动态给 CSS 变量 `--vh` 赋值，在样式里写 `height: calc(var(--vh, 1vh) * 100)`。这种方法在滚动时会频繁触发重绘，导致页面严重的闪烁卡顿。
2. **现在（现代标准方案）：** 直接使用 Tailwind 中的 `h-dvh`（对应 CSS 的 `height: 100dvh`）。浏览器底层会原生优化这个动态高度计算，既不会遮挡，也不会产生 JS 计算带来的性能抖动。

### 16. CVA (class-variance-authority) 解决了什么问题？

**它解决了什么问题？**

在 Tailwind CSS 中，当我们要封装一个高复用性、多状态的底层组件（如 Button，有不同的 `size` [sm, md, lg]、不同的 `variant` [primary, secondary, danger]）时，传统的写法需要写极其臃肿且难以维护的字符串拼接或模板字符串：

```tsx
// 传统做法：灾难般的条件字符串拼接
const className = `btn ${size === 'sm' ? 'px-2 py-1' : 'px-4 py-2'} ${variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'}`;
```

CVA 解决了变体组件（Variant-based Components）的样式组织问题。它用强类型、声明式的方式把样式逻辑结构化，让 Tailwind 组件具备类似传统 UI 库（如 AntD/Shadcn UI）的配置化能力。

**CVA 写法示例**

```tsx
import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors", // 基础样式
  {
    variants: {
      variant: {
        primary: "bg-blue-500 text-white hover:bg-blue-600",
        danger: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        sm: "text-sm px-2 py-1",
        md: "text-base px-4 py-2",
      },
    },
    defaultVariants: { variant: "primary", size: "md" }, // 默认值
  }
);
```

**和直接写 Tailwind class 的区别**

1. **高内聚与声明式：** 直接写 class 导致业务逻辑（如 if/else）与样式强耦合。CVA 将样式变体彻底抽离，组件代码只需要一行 `className={buttonVariants({ variant, size })}`。
2. **完美的 TypeScript 类型推导：** CVA 可以根据你定义的变体，自动推导出对应的 Props 类型（例如组件使用者在写 `<Button variant="..." />` 时，IDE 会精准联想出 `primary` 和 `danger`），这是直接拼写字符串绝对做不到的。
3. **复合变体支持 (Compound Variants)：** CVA 支持"当 variant A 遇上 size B 时触发特定样式"的复合规则配置，极大地简化了复杂设计系统的开发。

> 现代最火的组件库规范 **shadcn/ui** 整个底层就是建立在 CVA + Tailwind 之上的。

---

## 五、后端

### 17. FastAPI 的 async/await 模型阻塞场景与 asyncpg 连接池配置

**什么情况下会出现阻塞（Event Loop Blocking）？**

FastAPI 基于 uvicorn（底层是 asyncio 的事件循环）。事件循环是单线程的，如果某个请求占用了这个线程而不释放，整个服务器就会处于"卡死"状态，无法响应其他任何请求。以下三种情况会引发致命阻塞：

- **执行了同步的 I/O 操作：** 在 `async def` 路由中使用了同步的阻塞库。例如使用了 `requests.get()`、旧版的 `pika`（RabbitMQ）、或者标准库的 `time.sleep()`。
- **CPU 密集型计算（本项目的排盘引擎）：** 如果在 `async def` 内部执行极其复杂的数学计算、大量的循环、解密加密（如 bcrypt 计算密码 Hash）或图像处理。这会一直占用 CPU 算力，导致事件循环无法切换。
- **错误的第三方异步库调用：** 调用了异步方法，但忘记写 `await`，导致后续的链式反应或者直接返回了一个 coroutine 对象，甚至引发死锁。

> **避坑解决方案：** 如果必须跑同步 I/O 或纯 CPU 计算，不要在路由前加 `async`。FastAPI 遇到普通的 `def` 路由时，会自动将其丢进内部的**线程池（ThreadPoolExecutor）**中运行，从而不阻塞主事件循环。或者，在 `async def` 内部，使用 `asyncio.to_thread()` 将阻塞的计算任务手动派发到子线程：

```python
result = await asyncio.to_thread(blocking_cpu_calculation, data)
```

**asyncpg 的连接池怎么配置？**

在大并发场景下，频繁创建和销毁数据库连接的开销是巨大的。asyncpg 提供了性能极高的连接池管理。

核心配置落地，通常在 FastAPI 的生命周期事件（lifespan）中初始化和关闭连接池：

```python
from contextlib import asynccontextmanager
import asyncpg
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. 启动时创建连接池
    app.state.pool = await asyncpg.create_pool(
        dsn="postgresql://user:password@localhost/db",
        min_size=10,                            # 初始化时最少保持 10 个空闲连接
        max_size=50,                            # 连接池上限，最大支持 50 个并发连接
        max_queries=5000,                       # 一个连接最多执行 5000 次查询后自动重建
        max_inactive_connection_lifetime=300.0, # 空闲连接存活时间（秒）
        timeout=30.0                            # 获取连接的超时时间
    )
    yield
    # 2. 关闭时彻底释放连接池
    await app.state.pool.close()

app = FastAPI(lifespan=lifespan)
```

### 18. Pydantic Settings 类的加载优先级

在基于 Pydantic 的配置管理中（通常使用 `pydantic-settings` 库），优雅之处在于它支持多源配置覆盖。当同一个配置项在多个地方存在时，Pydantic 会按照严格的**优先级由低到高（后渲染的覆盖先渲染的）**进行加载：

1. **类内部的默认值（Lowest）：** 在 `BaseSettings` 派生类中直接写死的默认值（如 `database_port: int = 5432`）。
2. **从自定义 init 字典中读取：** 在实例化配置类时显式传入的参数（如 `Settings(_env_file='...')`）。
3. **从环境中加载的 `.env` 文件：** 读取指定路径下的环境变量配置文件（如 `.env.development` 或 `.env.production`）。
4. **操作系统的环境变量（Highest）：** 直接从生产环境机器中读取的系统的 Env 变量（如通过 `export DATABASE_PORT=6432` 或 Docker 注入的变量）。

> **实战价值：** 这种优先级设计非常契合现代云原生部署。本地开发时，依赖 `.env` 文件（第 3 级）读取配置；当部署到 Kubernetes 或 Docker 容器中时，运维人员直接在容器层面配置同名的环境变量（第 4 级），即可无缝强行覆盖本地的开发配置，而不需要修改任何代码。

### 19. Redis 可选降级的容错设计实现

当 Redis 因为高并发被打挂、网络抖动或正在重启时，高可用的后端系统绝对不能直接报 500 Error 导致业务停摆，必须具备降级到 PostgreSQL 或直接降级到无缓存的能力。

在架构实现上，推荐使用**"装饰器模式（Decorator）"**配合**"熔断器思想（Circuit Breaker）"**，而不是在每个业务代码里到处写 `try/except`。

**为什么不用到处写 try/except？**

如果在每个获取用户信息、查询排盘的 Service 层里都包一层 `try...except redis.exceptions.ConnectionError`，代码会变得极度臃肿（垃圾代码横行），严重违反了 DRY（Don't Repeat Yourself）和单一职责原则。

**优雅的工程落地：结合装饰器与容错策略**

我们可以编写一个通用的缓存装饰器，内部做异常捕获与回源降级。如果 Redis 挂了，自动打印错误日志，并直接去查数据库，对业务层完全透明。

```python
import logging
from functools import wraps
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)

def cache_fallback(fallback_func=None):
    """
    Redis 降级装饰器
    如果 Redis 正常，走缓存；如果 Redis 抛出异常，自动降级去跑原函数（查库）
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 获取 fastapi app 状态中的 redis 实例
            # 假设第一个参数是 self (Service层) 且持有 redis_client
            redis_client = getattr(args[0], "redis_client", None)
            cache_key = f"cache:{func.__name__}:{args[1:]}"  # 简单生成一个 Key

            if redis_client:
                try:
                    # 尝试从 Redis 获取数据
                    cached_data = await redis_client.get(cache_key)
                    if cached_data:
                        return cached_data
                except RedisError as e:
                    # 【核心降级点】Redis 挂了，不抛出异常，记录日志，继续往下走
                    logger.error(f"Redis 异常，已自动降级回源数据库. Error: {e}")

            # 降级：直接执行原函数（查数据库）
            db_data = await func(*args, **kwargs)

            # 尝试异步回写 Redis，同样要防着回写时报错
            if redis_client and db_data:
                try:
                    await redis_client.setex(cache_key, 3600, db_data)
                except RedisError:
                    pass

            return db_data
        return wrapper
    return decorator
```

业务层使用极其干净：

```python
class UserService:
    def __init__(self, redis_client, db_pool):
        self.redis_client = redis_client
        self.db_pool = db_pool

    @cache_fallback()
    async def get_user_profile(self, user_id: int):
        # 如果 Redis 挂了，装饰器会吞掉错误，并自动执行下面的这段查库逻辑
        async with self.db_pool.acquire() as conn:
            return await conn.fetchrow("SELECT * FROM users WHERE id = $1", user_id)
```

> **进阶架构思考：** 如果线上 Redis 短时间内好不了，每次请求都先去连一下 Redis（导致几秒的 Timeout 阻塞）再降级，依然会把后端拖垮。在线上环境，应当引入 `pybreaker`（熔断器库）。当 Redis 报错连续达到 5 次时，熔断器打开（Open 状态），在接下来的 60 秒内，请求会直接跳过 Redis 查库，直到 60 秒后进入半开状态（Half-Open）去尝试探测 Redis 是否恢复。

---

## 六、AI 集成

### 20. AI 解盘的 Prompt 工程与六维报告结构化输出

解盘（如八字、星盘）报告通常包含极高的业务复杂度和多维度的指标（例如：事业、财运、健康、感情、大运、流年）。要让大模型稳定输出特定格式的报告，仅仅靠在 Prompt 里写"请按 JSON 格式输出"是绝对不够的，线上高并发下必然会出现 JSON 截断或格式错乱。

**核心治理方案：基于 Schema 的强制约束（生产环境唯一解）**

放弃让模型"自由发挥"，采用大模型厂商原生支持的 Structured Outputs 机制（如 OpenAI 的 `json_schema` 模式，或 Gemini 的 `response_schema`）。

- 前端/后端定义契约：使用 Zod (前端) 或 Pydantic (Python 后端) 定义好六维报告的严格数据结构：

```python
from pydantic import BaseModel, Field

class DimensionScore(BaseModel):
    score: int = Field(..., description="1-100的分数")
    analysis: str = Field(..., description="该维度的深度解盘文案")

class BaziReport(BaseModel):
    career: DimensionScore
    wealth: DimensionScore
    # ... 其他四个维度
```

- API 级强绑定：在调用大模型 API 时，将这个 Schema 传给 API 接口。大模型厂商在解码（Decoding）阶段会通过**受控采样（Constrained Sampling）**算法，强制模型只能输出符合该 JSON 格式的 Token。格式正确率可以达到 100%。

**Prompt 工程的设计技巧**

在 Prompt 内部，为了配合结构化输出并提升"解盘算法"的准确度，需要采用以下策略：

- **Few-Shot Prompting（少样本提示）：** 在 Prompt 中内置 1-2 个标准的输入（如：乾造：甲子...）与最终六维 JSON 报告的真实样例，给模型建立强烈的上下文模仿。
- **思维链（Chain of Thought, CoT）：** 不要让模型直接输出最终分数。在 JSON Schema 中增加一个 `reasoning_process`（推理过程）隐藏字段，让模型先在内部"计算"五行旺衰、喜用神提取，最后再输出六维结论。先思考后输出，能大幅提升解盘的专业度。

### 21. Prompt 管理策略：前端代码硬编码 vs 后端/配置中心

把 Prompt 直接写在前端代码 `bazi-analysis.ts` 里是一种典型的技术债（Anti-Pattern）。

这样做带来的致命缺陷：

1. **上线代价高：** 业务运营或命理专家想要微调一个提示词（比如让语气更温柔一点），必须由前端工程师改代码、跑 CI/CD、重新发布前端产品，流程极长。
2. **泄露风险：** 前端代码经过打包后最终暴露在浏览器中。即使做了混淆，黑客也能轻易通过开发者工具（F12）或抓包，无成本地盗走你辛苦调优的解盘 Prompt 资产。

**改进后的 Prompt 管理策略架构：**

```
┌────────────────────────┐
│  Apollo / Nacos 配置中心 │
└───────────┬────────────┘
            │ (实时动态推送)
            ▼
┌──────────────┐    ┌────────────────┐    ┌──────────────┐
│  前端应用     │───>│  FastAPI 后端   │───>│   大模型 API   │
│ (纯交互/渲染) │    │ (注入系统提示词) │    │(OpenAI/Gemini) │
└──────────────┘    └────────────────┘    └──────────────┘
```

1. **核心原则：Prompt 必须收拢在后端管理。** 前端只负责收集用户的出生年月日时等元数据（Metadata），通过 POST 请求打包传给后端 FastAPI。后端从数据库或配置中心拉取对应的解盘 Prompt，在后端完成组装后再发起大模型请求。
2. **进阶演进（配置中心 / CMS）：**
   - 轻量级实现：将 Prompt 视为动态配置，存放在 Apollo、Nacos 或 Redis 中。后端每次调用时从缓存中读取。当需要调整 Prompt 时，在配置中心后台一键修改并下发，秒级生效，无需重启任何服务。
   - 专业级实现（Promptops）：引入 Langfuse 或 LangChain Hub 这类专业的 Prompt 管理工具。它支持 Prompt 版本控制（Versioning）。你可以同时在线上运行 v1.0 和 v2.0 的解盘 Prompt，在后端进行 A/B 测试，观察哪个 Prompt 带来的用户留存率或付费率更高。

### 22. 多 Provider 切换与多云容灾策略

在大模型应用中，完全依赖单一厂商（如只用 OpenAI）是非常危险的（可能遇到额度超限、线路被墙、厂商宕机、甚至是政策性封退）。

**1. 统一抽象层设计（Gateway 思想）**

在后端代码中，绝对不能直接调用 `import openai` 或 `import deepseek` 导致业务代码与特定 SDK 强耦合。应当基于**工厂模式（Factory Pattern）**抽象出一个通用的 `LLMProvider` 接口：

```python
from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @abstractmethod
    async def generate_report(self, prompt: str) -> str:
        pass
```

分别实现 `OpenAIProvider` 和 `DeepSeekProvider`。

**2. 自动化降级与容灾逻辑的实现**

在具体的 Service 调用层，采用"主备模式（Active-Passive）"或"动态权重负载均衡（Load Balancing）"，并结合重试与超时重定向机制：

```python
import logging
from typing import List

logger = logging.getLogger(__name__)

class LLMManager:
    def __init__(self, providers: List[LLMProvider]):
        # 按照优先级排序，例如 [DeepSeekProvider(便宜高性能), OpenAIProvider(高可用备用)]
        self.providers = providers

    async def bazi_analysis_with_retry(self, prompt: str) -> str:
        last_exception = None

        for provider in self.providers:
            try:
                # 设置严格的单次请求超时时间（例如 15 秒）
                return await asyncio.wait_for(
                    provider.generate_report(prompt), timeout=15.0
                )
            except (StandardLLMAPIException, asyncio.TimeoutError) as e:
                logger.warning(
                    f"当前大模型厂商 {provider.__class__.__name__} "
                    f"调用失败或超时，正在尝试自动降级到下一个备份厂商... Error: {e}"
                )
                last_exception = e
                continue  # 核心点：捕获异常，进入下一个循环，实现无缝切换

        # 如果所有厂商都挂了，再向前端抛出异常，触发业务系统的整体兜底
        logger.error("所有大模型供应商均不可用，触发全线熔断！")
        raise AllProvidersDownException(
            "系统开小差了，请稍后再试", inner_error=last_exception
        )
```

**3. 线上高阶容灾考量**

- **动态权重切换：** 日常流量中，80% 的请求走 DeepSeek（极致性价比），20% 走 OpenAI。这样不仅能分摊单点故障风险，还能保证两条链路在生产环境中都是"热备"状态。
- **熔断机制（Circuit Breaker）：** 如果 DeepSeek 连续 10 次请求报错（通常意味着官方服务宕机），熔断器开启，在接下来的 10 分钟内，所有请求直接直达 OpenAI，不再进行无意义的重试，保护用户端响应延迟不被拉长。

---

## 七、排盘算法

### 23. 八字排盘的核心算法与正确性保证

**复杂度最高的部分是哪块？**

很多人以为计算天干地支（如根据公历算六十甲子）最难，其实由于有现成的历法库配合，干支计算只是基础。排盘系统中复杂度最高、逻辑漏洞最多的部分是**"节气精准交割的判定"**以及**"大运、流年逆推与起运时间的精确计算"**。

**核心难点解析：**

- **节气交割（月份与年柱的真正分界线）：** 八字中的"月"不是按照农历初一划分的，而是严格按照二十四节气（如立春、惊蛰、清明等）的精确分钟级时间点来交割的。
  - 例如：某年立春是 2 月 4 日 11:42。如果一个婴儿出生在 2 月 4 日 11:41，那他的年柱和月柱依然算上一年（腊月）；如果出生在 11:43，才算新的一年和正月。这就要求算法在处理节气临界点时，必须精确到分钟甚至秒，否则整个八字（年、月柱）直接排错。
- **起运时间的动态推排：** 大运的推排遵循"阳男阴女顺推，阴男阳女逆推"的规律。计算起运年龄时，需要计算出生时刻距离下一个（或上一个）节气交割点的精确分钟差。
  - 传统公式是"三天折合一岁，一天折合四个月，一个小时折合五天"。在工程数字化时，如果直接用这种粗暴的约分，会导致起运时间出现几天到几个月的误差。必须精确计算出总分钟数，换算成具体的目标时间戳。

**怎么保证正确性？（单元测试与对齐策略）**

因为排盘结果是后续 AI 解盘（Prompt）的绝对输入来源，一步错步步错。我们采取了**"三层防御体系"**来确保算法 100% 正确：

```
[ 测试输入：年月日时 ]
        │
        ▼
┌──────────────┐    对比验证    ┌──────────────┐
│  本地排盘算法  │ <──────────> │ 权威第三方API  │
└──────┬───────┘              └──────────────┘
       │
       ▼
┌──────────────┐
│  边界测试矩阵  │ (5000+ 极端测试用例: 节气当天、子时交界、世纪交替、闰月)
└──────┬───────┘
       │
       ▼
[ 结果：100% 确定性输出 ]
```

- **第一层：边界值单元测试（Boundary Test Matrix）** — 人工构造一个包含至少 5000 个特殊出生时间的测试用例库（Golden Dataset）。专门挑选以下临界点：
  - 节气交割当天的前后 5 分钟、前后 1 分钟。
  - 早晚子时切换点（23:00 - 24:00 之间的特殊处理）。
  - 跨世纪交替（如 1999 年 12 月 31 日 23:59 与 2000 年 1 月 1 日 00:01）。
- **第二层：权威第三方差分对齐（Differential Testing）** — 编写自动化脚本，批量将本地算法输出的干支、大运数据，与行业内公认权威的排盘系统（或天文历法数据源）进行接口结果比对（Diff）。只要有一例字段不一致，立刻报警回溯。

### 24. 农历/公历转换的闰月处理与边界 Case 验证

在前端或 Node 端使用 `lunar-typescript` 确实是目前生态里最成熟的选择，但如果直接"开箱即用"而不处理特定的中国历法边界，线上一定会出 Bug。

**遇到闰月怎么处理？**

中国农历采用"19年7闰"的置闰规则，会导致某一年出现两个相同的月份（如：闰四月）。

- **对齐干支月柱：** 命理学中，闰月没有独立的月柱。闰月的前半个月随前一个月（四月），后半个月随下一个月（五月）。但在算八字大运时，有些流派认为闰月应当直接并入本月，或者直接看节气。
- **`lunar-typescript` 的原生解法：** 这个库在设计上非常严谨，它的 `Lunar.fromYmd` 或获取月亮信息时，专门提供了一个 `isLeap`（是否为闰月）的布尔值参数或属性。
  - 在接收前端用户输入时，如果用户选择的是农历，表单必须支持勾选"是否为闰月"。
  - 传入库时：如果是正常的四月，传 `fromYmd(2020, 4, 15, false)`；如果是闰四月，必须传 `fromYmd(2020, 4, 15, true)`。否则，库会默认将其当成正常的四月去转换公历，导致转换出来的公历日期直接错位一个月。

**这个库的边界情况（Edge Cases）验证过吗？**

在线上生产环境运行，必须防范以下三个由中国历法或特殊历史引发的边界坑：

**边界一：早子时与晚子时（夜子时）的割裂**

中国传统一天始于子时（前一天 23:00 至当天 01:00）。

- 很多日历库默认过了 00:00 才算第二天。但如果用户出生在 23:30（晚子时），此时公历日期还是今天，但八字的日柱已经提前切换到了明天。
- **验证与防范：** 必须手动校验小时数。如果 `hour == 23`，需要利用库提供的特殊方法（如设定子时类型为晚子时），显式地让日柱进位，否则排出来的八字连最核心的"日元（代表用户自己）"都是错的。

**边界二：1986 — 1991 年的"夏令时（Daylight Saving Time）"**

中国在 1986 年至 1991 年期间实行过夏令时，每年 4 月中旬的某个周日凌晨将时钟拨快 1 小时，9 月中旬再拨慢 1 小时。

- 如果用户的出生日期刚好落在这个区间的夏令时内，他身份证上的时间（公历登记时间）实际上比**真实太阳时（真太阳时）**快了 1 个小时。这可能直接导致他的时柱从"卯时"变成了"辰时"。
- **验证与防范：** 在排盘前置逻辑中，必须有一段历史时间检查：如果是 1986-1991 之间出生的用户，且匹配当年的夏令时区间，系统需要自动将其时间减去 1 小时，还原为标准北京时间后再送入 `lunar-typescript` 进行干支排盘。

**边界三：极端的远古与未来日期限制**

`lunar-typescript` 绝大多数版本的有效计算区间通常在 **1900 年至 2100 年**（甚至到 2050 年）之间。虽然对于活着的现代人足够用，但如果遇到有人故意捣乱，在前端输入公元前 500 年或者公元 3000 年，库的内部查表法或者高阶天文气象公式会直接失效、甚至返回 NaN 导致进程崩溃。

- **验证与防范：** 在前端表单和后端 Pydantic 校验中，对 `year` 字段做严格的 Min/Max 范围限制（限制在 1900-2100），在源头上熔断这类恶意或极端的输入。

---

## 八、工程化 & 部署

### 25. Railway 部署实战与环境变量管理

Railway 是一款对 Monorepo 支持极其优秀的现代 PaaS 平台。在 Railway 中部署前端（Next.js）和后端（FastAPI）时，核心是利用"共享项目上下文 + 多服务独立构建（Multi-service）"的模式。

**前后端分别配置策略**

在 Railway 项目中，你不需要把 Monorepo 拆开，而是直接关联同一个 GitHub 仓库，并在 Railway 中创建两个服务（Services）：

- **前端服务 (Frontend Service)：**
  - Root Directory（根目录）：指定为整个仓库根目录（或者 `packages/frontend`，取决于你的打包结构，推荐在根目录利用 pnpm 的 filter 机制）。
  - Build Command（构建命令）：`pnpm --filter frontend build`
  - Start Command（启动命令）：`pnpm --filter frontend start`
- **后端服务 (Backend Service)：**
  - Root Directory：`packages/backend`
  - Build Command：Railway 会自动检测 `requirements.txt` 或 `pyproject.toml`。如果是自定义构建，可以写 `pip install -r requirements.txt`。
  - Start Command：`uvicorn main:app --host 0.0.0.0 --port $PORT`（注意：必须绑定 Railway 动态注入的 `$PORT` 环境变量，否则服务无法对外暴露）。

**环境变量（Environment Variables）管理经验**

在大规模全栈项目中，环境变量的管理不当很容易导致配置泄漏或线上环境错乱。我们在 Railway 和本地实践中总结了以下经验：

1. **利用 Railway 的 Shared Variables（共享变量）：** 像 `DATABASE_URL`、`JWT_SECRET` 这种前后端可能都需要知道，或者多服务通用的核心配置，在 Railway 项目级别（Project Settings）定义为共享变量，然后一键注入到对应的子服务中，避免重复复制。
2. **严格区分构建期（Build-time）与运行时（Runtime）变量：**
   - Next.js 的坑：Next.js 在 RSC（服务端组件）中使用的变量是运行时的；但是在客户端组件（Client Component）中使用的 `NEXT_PUBLIC_` 开头的变量，是在构建（Build）阶段就死死硬编码进 JS Bundle 的。
   - 经验：在 Railway 配置前端的 `NEXT_PUBLIC_API_URL` 时，必须确保在构建开始前该变量就已存在于 Railway 的 Variables 列表中，否则前端打包出来后会找不到后端地址。
3. **环境隔离与配置回退（Pydantic BaseSettings）：** 在后端代码中，配合 Pydantic 的 Settings 类。本地开发通过 `.env.local` 传参，Railway 线上则直接读取机器的系统环境变量。由于系统变量优先级最高（第 18 题提到的机制），线上会自动无缝覆盖本地配置，绝对不在 Git 仓库里提交任何密钥文件。

### 26. 零测试项目的测试引入策略：先攻哪一层？

如果一个项目目前完全没有测试，盲目追求 80% 的代码覆盖率去补全量单元测试会拖垮团队的业务开发节奏。最理智、ROI（投资回报率）最高的策略是：**先写核心计算逻辑的"单元测试"，再写主业务流程的"集成测试（或 E2E 测试）"**。

**第一步：先给"核心计算逻辑"加【单元测试】（ROI 最高）**

在这个项目中，八字排盘引擎和节气交割算法是绝对的资产核心。它是一个纯函数式的计算模型（相同的年月日时输入，必然得到相同的干支和起运时间矩阵），不依赖数据库，不依赖网络请求。

- 做法：使用 Vitest 或 Jest，针对第 23 题提到的那 5000+ 边界值用例（如夏令时、节气临界点）编写高密度的单元测试。因为没有任何外部 Mock 成本，执行速度极快（几毫秒），能瞬间帮团队守住排盘不报错的底线。

**第二步：再给"核心业务链条"加【集成测试 / 关键接口测试】**

普通的增删改查（CRUD）接口（如用户修改昵称、查看历史订单）不需要急着写单元测试。应当针对**"付费扣款 -> 触发 AI 解盘 -> 生成六维报告"**这一条核心业务链条写集成测试。

- 做法：在 FastAPI 后端，利用 TestClient 编写集成测试，Mock 掉真正的 OpenAI/DeepSeek API（避免测试时产生真实账单和延迟），但真实连接测试数据库（PostgreSQL）。模拟一个完整用户请求，验证整个长链路下的数据一致性和状态流转。

### 27. TypeScript Strict 模式下最棘手的类型问题

在开启 `strict: true`（包含 `noImplicitAny`、`strictNullChecks` 等）后，最棘手的问题往往发生在处理泛型（Generics）嵌套、动态类型推导、或第三方非强类型库的摩擦上。

**真实踩坑案例：基于 Zod Schema 动态推导多维表单的泛型死锁**

在做 AI 六维报告时，前端使用了 React Hook Form + Zod，并且需要封装一个通用的 `DimensionCard` 组件，它接收任意一个维度的 Schema 并动态渲染。

遇到的死锁问题：当尝试把复杂的 Zod Schema 作为泛型参数传递给通用的高阶组件（HOC）时，由于 Zod 对象的深度嵌套，TypeScript 的**类型实例化深度限制（Type instantiation is excessively deep and possibly infinite）**被触发了。

```typescript
// 报错：类型实例化过深，TS 直接摆烂推导出了 any
type ExtractFormType<T extends z.ZodTypeAny> = z.infer<T>;
```

**解决这个黑魔法的实战经验：**

1. **利用 Path 和 PathValue 递归类型收窄（Dot Notation）：** 在处理深层嵌套对象（例如：`report.career.score`）的表单联动时，直接拼字符串 `register("career.score")` 会丢失类型安全。我们手动编写了一个递归的 `NestedPaths` 映射类型，强制让字符串路径获得 IDE 的高亮联想：

```typescript
type Cons<H extends string, T extends readonly string[]> = [H, ...T];
type Paths<T> = T extends object
  ? { [K in keyof T]: Cons<K & string, Paths<T[K]>> }[keyof T]
  : [];
```

2. **合理使用类型逆变与协变（Contravariance & Covariance）：** 在某些严苛的类型守卫中，如果一个泛型组件既要接收输入又要输出更新，TS 会判定类型不兼容。需要通过声明 `in out` 关键字（TS 5.0+ 引入的泛型方差变体声明）来显式告知编译器其方差行为，从而解决类型死锁。
3. **底线防线（Opaque Types / 类型断言的克制使用）：** 在极少数和底层历法库（JS 编写，TS 类型不全）对接的临界点，如果遇到了彻底无法对齐的结构，坚决不写 `as any`，而是利用 `unknown` + 严格的 Type Guard（类型收卫函数 `isBaziReport(obj)`）进行运行时断言，将不确定性消灭在系统的边界处。
