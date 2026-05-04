# RelayHub v1 Providers readonly trial config governance 说明

> 状态：current
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/specs/2026-04-17-v1-providers-readonly-trial-config-governance说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 目标

本说明用于把 Providers readonly real-fetch trial 从“底座可接”收口到“配置治理清晰”。

本轮不进入真实内网地址、真实认证、真实密钥或默认启动切换。

## 2. 推荐配置入口

### 2.1 services

- `ProvidersRuntimeConfigSourceFactoryOptions`

用于 services/runtime 层显式创建 Providers runtime config source。

### 2.2 deployment

- `ConsoleDeploymentRuntimeInput.mode = "env"`

用于 app/deployment 侧显式 readonly real-fetch trial。

### 2.3 browser

- `ConsoleBrowserDeploymentRuntimeInput.mode = "browser-fetch"`
- `ConsoleBrowserDeploymentRuntimeInput.mode = "browser-fetch-source"`

用于 app/browser 侧显式 readonly real-fetch trial。

## 3. 配置字段

最小必需项：

- `RELAYHUB_PROVIDERS_RUNTIME_MODE = "real-fetch"`
- `RELAYHUB_PROVIDERS_READONLY_BASE_URL`
- 显式 `fetchImpl`、`browserFetch` 或 `browserFetchSource`

可选增强项：

- `RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON`
- `RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT`
- 显式 `authHeadersResolver`

不新增：

- auth env key
- token env key
- refresh / cache / expiry / credential store 配置

## 4. 进入与回退规则

- `mode = "mock"` 或缺失 mode 时，默认 mock。
- 非法 mode 默认 mock。
- `mode = "real-fetch"` 但缺少 `baseUrl` 时，默认 mock。
- `mode = "real-fetch"` 但缺少显式 fetch 注入时，默认 mock。
- `defaultHeaders JSON` 仅接受对象中 string value 的字段。
- 非法 JSON、数组、空对象或无 string value 的对象会被忽略，不触发异常。
- `RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT` 当前只接受：
  - `providers`
  - `openai-models`
- 缺失或非法 wire contract 时，继续按默认 `providers` contract 处理。
- `authHeadersResolver` 只能由调用方显式传入，不从 env 自动读取。

## 5. compatibility-only 入口

auth/token browser/deployment wrapper 继续可用，但不作为本阶段配置治理推荐入口。

后续新 trial 应优先使用三层推荐配置入口，而不是新增 wrapper。

## 6. 默认启动

- `main.tsx` 继续调用默认 browser deployment bootstrap。
- 默认 bootstrap 继续保持 mock。
- 不自动读取真实环境。
- 不自动发真实请求。
