# RelayHub v1 OpenAI-compatible models Providers trial 说明

> 状态：current
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-04-18
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/specs/2026-04-18-v1-openai-compatible-models-providers-trial说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 目标

把 RelayHub Providers readonly real-fetch 从专用 `/providers` 目录接口扩展到 OpenAI-compatible `/v1/models`。

本轮目标是尽快把 `https://relayhub.jingshu.cc/providers` 跑成真实数据，而不是等待专门的 Providers 后端。

## 2. 推荐接入形态

- release 同源代理：`/api`
- upstream 目录接口：`GET /v1/models`
- 前端 trial 构建：
  - `RELAYHUB_PROVIDERS_RUNTIME_MODE=real-fetch`
  - `RELAYHUB_PROVIDERS_READONLY_BASE_URL=/api`
  - `RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT=openai-models`

默认 `main.tsx` 与默认 bootstrap 继续保持 mock，不自动切到真实链路。

## 3. wire contract 模式

本轮新增只读 contract 模式：

```ts
"providers" | "openai-models"
```

- `providers`
  - 继续读取 `/providers` 与 `/providers/:id`
  - 保持既有默认 Providers contract
- `openai-models`
  - collection path 固定为 `/models`
  - detail 不要求上游存在 `/models/:id`
  - detail 由 collection 结果按 `id` 派生

## 4. 模型到 Provider 的映射

当前采用“模型即 Provider”。

- `id` = model id
- `name` = `root` 或 model id
- `kind` = `第三方中转`
- `availableEnvironments` = `["开发版"]`
- `health` = `healthy`
- `transparency` = `部分缺失`
- `errorRate` = `0`
- `p95Latency` = `0`
- `description` 明确标注来自 OpenAI-compatible `/v1/models` 目录适配
- `recommendation` 明确标注当前只验证目录可见性
- `recommendationNote` 明确标注缺少真实治理元数据
- `models` 至少包含当前 model 自身
- `metrics` = `null`

## 5. 错误与状态语义

- `/models` 返回 `data.length > 0` 映射为 collection `ready`
- `/models` 返回 `data.length = 0` 映射为 collection `empty`
- detail 由 collection 中命中的 model 映射为 `ready`
- detail 未命中 model id 映射为 `not-found`
- 非 `2xx` 错误继续向上抛，不 fallback 到 mock
- 非法 `/models` payload 抛清晰错误

## 6. release 认证策略

- 浏览器端不保存 token
- 前端构建不注入 token
- release nginx 在 `/api/` 固定注入：

```http
Authorization: Bearer <token>
```

本轮不新增 auth env key，不引入新的 runtime wrapper。
