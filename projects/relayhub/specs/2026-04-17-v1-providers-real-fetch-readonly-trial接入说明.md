# RelayHub v1 Providers real-fetch readonly trial 接入说明

> 状态：current
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/specs/2026-04-17-v1-providers-real-fetch-readonly-trial接入说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 目标

在不新增 seam / wrapper 的前提下，给 Providers readonly real-fetch 提供一份正式试点接入说明。

本说明只回答三件事：

- 新接入优先走哪条入口
- 如何显式开启 readonly real-fetch
- 哪些入口只保留兼容价值，不作为试点主路径

## 2. 推荐入口

### 2.1 services 层推荐

- `ProvidersRuntimeConfigSourceFactoryOptions`

用于 services/runtime 侧显式产出 Providers runtime config source，是 services 层推荐入口。

### 2.2 deployment 侧推荐

- `ConsoleDeploymentRuntimeInput.mode = "env"`

用于 app/deployment 场景的显式 readonly real-fetch 试点。

最小要求：

- `RELAYHUB_PROVIDERS_RUNTIME_MODE = "real-fetch"`
- `RELAYHUB_PROVIDERS_READONLY_BASE_URL`
- 显式 `fetchImpl`

可选要求：

- `authHeadersResolver`
- `authHeadersSource`
- `authHeadersSourceFactoryOptions`
- `authHeadersSourceCompositionOptions`
- `authDeploymentInput`
- `authTokenProvider`
- `authTokenSource`
- `authTokenSourceFactoryOptions`
- `authTokenSourceCompositionOptions`
- `tokenDeploymentInput`

## 2.3 browser 侧推荐

- `ConsoleBrowserDeploymentRuntimeInput.mode = "browser-fetch"`
- `ConsoleBrowserDeploymentRuntimeInput.mode = "browser-fetch-source"`

用于 app/browser 场景的显式 readonly real-fetch 试点。

最小要求：

- `RELAYHUB_PROVIDERS_RUNTIME_MODE = "real-fetch"`
- `RELAYHUB_PROVIDERS_READONLY_BASE_URL`
- 显式 `browserFetch` 或 `browserFetchSource`

可选要求：

- `RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON`
- `authHeadersResolver`
- `authHeadersSource`
- `authHeadersSourceFactoryOptions`
- `authHeadersSourceCompositionOptions`
- `authDeploymentInput`
- `authBrowserRuntimeOption`
- `authTokenProvider`
- `authTokenSource`
- `authTokenSourceFactoryOptions`
- `authTokenSourceCompositionOptions`
- `tokenDeploymentInput`
- `tokenBrowserRuntimeOption`

## 3. 默认行为

- `main.tsx` 继续走 `bootstrapDefaultConsoleBrowserDeploymentRuntime()`
- 默认 startup / app runtime / deployment runtime 继续保持 mock
- 不自动读取真实环境
- 不自动发真实请求
- 不新增 auth env key

## 4. compatibility-only 入口

以下入口继续保留，但不作为本试点的推荐主路径：

- auth/token browser/deployment wrapper
- 现有 auth/token source factory / composition factory 分支
- 其他为兼容历史测试与渐进演进保留的包装入口

这些入口可以继续工作，但不应再作为新 trial 的默认接入说明。

## 5. 试点验证口径

正式 readonly real-fetch trial 至少应验证：

- `/providers` collection 请求可成功返回
- `/providers/:id` detail 请求可成功返回
- detail `404` 映射为 `not-found`
- transport error 继续向上抛，不 fallback 到 mock
- `defaultHeaders` 与显式 `authHeadersResolver` 可进入请求

## 6. 本轮不提供

- 不提供默认启动自动切换到 real-fetch
- 不提供真实环境自动读取
- 不提供 refresh、cache、expiry、credential store
- 不提供 dashboard / environments / eval 范围扩展
