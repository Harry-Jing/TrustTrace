# TrustTrace — Backend Plan

> Updated 2026-04-23.

## Tech Stack

Bun, Hono, Zod, Drizzle, SQLite (`bun:sqlite`), pino, @t3-oss/env-core, openai SDK, @google/genai SDK, Vitest.

## Key Decisions

- **camelCase JSON** — API 响应全部使用 camelCase，前端不做 case 转换。
- **只用 SQLite** — 不搞 SQLite/PostgreSQL 双驱动。需要 PostgreSQL 时 Drizzle 切换成本低。
- **CheckResult 结构以前端为准** — synthesis 服务产出前端 `types.ts` 中定义的 `CheckResult` 形状，不沿用旧 Python 后端的结构。
- **后台任务必须 try/catch** — `POST /checks` 立即返回，check 在后台 Promise 中执行，失败时标记为 `failed`，不能让进程崩溃。

## API

所有路由挂在 `/v1` 下，与前端 `backendChecksClient.ts` 已有的调用对齐：

- `POST /checks` — 创建 check
- `GET /checks` — 列表，支持 `?limit=N&offset=N`
- `GET /checks/:checkId` — 查询状态/结果
- `GET /checks/:checkId/events` — SSE 进度流，支持 `?afterSeq=N` 断点续传
- `GET /health`

## Implementation Phases

| Phase | Scope                                                               | Done when                                        |
| ----- | ------------------------------------------------------------------- | ------------------------------------------------ |
| 1     | Server skeleton: app, config, logger, errors, middleware, `/health` | `curl /health` → 200                             |
| 2     | DB + REST routes (mock LLM, real DB)                                | 前端 backend mode 跑通 create → loading → result |
| 3     | SSE streaming                                                       | 前端 loading 页面收到实时进度                    |
| 4     | Provider adapters + synthesis + full pipeline                       | 端到端：提交 → 真实 LLM 分析 → 结果展示          |
