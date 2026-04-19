# RelayHub v1 Providers readonly 最小接入验证说明

> 状态：current
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-04-18
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/specs/2026-04-18-v1-providers-readonly-最小接入验证说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 目标

在不接真实内网地址治理、真实认证治理和默认启动切换的前提下，为 Providers readonly real-fetch 补一轮最小接入验证说明。

本轮只验证三件事：

- 推荐入口发出的 request 是否符合默认 contract
- 默认 wire payload 是否能稳定映射到 readonly contract
- 后续真实后端接入前，调用方应按什么步骤自测

## 2. 推荐验证入口

### 2.1 deployment

- `ConsoleDeploymentRuntimeInput.mode = "env"`

最小必需项：

- `RELAYHUB_PROVIDERS_RUNTIME_MODE = "real-fetch"`
- `RELAYHUB_PROVIDERS_READONLY_BASE_URL`
- 显式 `fetchImpl`

可选项：

- `authHeadersResolver`

### 2.2 browser

- `ConsoleBrowserDeploymentRuntimeInput.mode = "browser-fetch"`
- `ConsoleBrowserDeploymentRuntimeInput.mode = "browser-fetch-source"`

最小必需项：

- `RELAYHUB_PROVIDERS_RUNTIME_MODE = "real-fetch"`
- `RELAYHUB_PROVIDERS_READONLY_BASE_URL`
- 显式 `browserFetch` 或 `browserFetchSource`

可选项：

- `RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON`
- `authHeadersResolver`

### 2.3 services

- `ProvidersRuntimeConfigSourceFactoryOptions`

services 层继续作为 runtime config source 的推荐入口，但本轮最小接入验证以 deployment/browser 显式入口为主。

## 3. contract 样例

### 3.1 providers

Collection success：

```ts
{ items: [ProviderRecordContract] }
```

Collection empty：

```ts
{ items: [] }
```

Detail success：

```ts
{ item: ProviderRecordContract }
```

Detail not-found：

```ts
{ item: null }
```

Transport error：

- `404 + null` 由 datasource 映射为 `not-found`
- 非 `404` 非 `2xx` 继续向上抛

### 3.2 openai-models

Collection success：

```ts
{ data: [{ id: "gpt-5.3-codex" }] }
```

Collection empty：

```ts
{ data: [] }
```

Detail 由 collection 结果按 `id` 派生，不额外要求 `/models/:id`。

## 4. 最小验证步骤

调用方在真实后端接入前，至少应完成：

1. 用本地 fake `fetchImpl`、`browserFetch` 或 `browserFetchSource` 返回上述默认 contract。
2. 验证 collection/detail path 符合当前 wire contract：
   - `providers` -> `/providers` 与 `/providers/:id`
   - `openai-models` -> `/models`，detail 由 collection 派生
3. 验证 query 仅承接允许的 filters：`kind` / `environment` / `health` / `transparency`。
4. 验证 `RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON` 与显式 `authHeadersResolver` 能进入请求。
5. 验证 detail `404` 映射为 `not-found`，非 `404` 非 `2xx` 向上抛。
6. 若使用 `openai-models`，验证未命中 model id 时映射为 `not-found`。

## 5. 不提供

- 不提供真实 base URL
- 不提供真实 token 来源
- 不提供 auth env key
- 不提供本地 stub server 或额外 HTTP 服务进程
- 不修改 `main.tsx`
