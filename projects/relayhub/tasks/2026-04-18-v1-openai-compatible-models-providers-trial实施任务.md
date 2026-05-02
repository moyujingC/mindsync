# RelayHub v1 OpenAI-compatible models Providers trial 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-18
> source_of_truth：projects/relayhub/tasks/2026-04-18-v1-openai-compatible-models-providers-trial实施任务.md
> 项目：RelayHub
> 阶段：implementation

## 1. 目标

- 用 OpenAI-compatible `/v1/models` 打通 RelayHub Providers readonly 最小真实闭环。
- 保留既有 `/providers` contract，不做替换式重构。
- 不新增新的 app/runtime wrapper，不修改默认 `main.tsx`。

## 2. 实施项

- 新增 `openAICompatibleModelsAdapter.ts`，负责：
  - 校验 `/models` payload
  - 把 model record 映射成 `ProviderRecordContract`
  - 复用现有 filter 语义做最小过滤
- 在 `realProvidersDataSource.ts` 支持：
  - `wireContract = "openai-models"`
  - list 走 `/models`
  - detail 复用 `/models` 结果按 `id` 匹配
- 在 runtime env/config 入口透传：
  - `RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT`
- 在 trial 构建入口透传新的 wire contract env。
- 更新 release nginx 安装脚本，支持固定 Bearer token 注入。
- 同步 spec、qa、delivery、release runbook。

## 3. 不变项

- 不删除既有 `/providers` readonly contract。
- 不把 token 暴露到前端。
- 不新增 auth env key。
- 不引入真实指标、治理评分、缓存或 refresh 机制。

## 4. 验证要求

- `npm test`
- `npm run build`
- `RELAYHUB_CONSOLE_BASE_PATH=/ RELAYHUB_PROVIDERS_RUNTIME_MODE=real-fetch RELAYHUB_PROVIDERS_READONLY_BASE_URL=/api RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT=openai-models npm run build:trial`
- release `/api/models` 验证
- `https://relayhub.jingshu.cc/providers` 与详情页 smoke
