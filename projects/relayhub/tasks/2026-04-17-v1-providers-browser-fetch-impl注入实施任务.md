# RelayHub v1 Providers browser fetch impl 注入实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-browser-fetch-impl注入实施任务.md
> 项目：RelayHub
> 阶段：task

这份任务用于把 `RelayHub` 控制台当前已经具备的 `env deployment input source` 再向前推进到“显式 browser fetch adapter 与 `fetchImpl` 注入入口”。

## 1. 目标

本轮目标是让 `Providers` 的启动链在保留默认 mock 行为的前提下，具备显式 browser fetch 注入能力。

同时继续保持：

- 默认启动仍走 mock
- 页面层、路由层和 `consoleData.ts` 不感知 browser fetch seam
- 不引入认证字段决策

## 2. 关键实现

### 2.1 browser fetch adapter

在 `console/src/app/consoleBrowserFetch.ts` 新增：

- `ProvidersBrowserFetch`
- `createProvidersBrowserFetchLike(fetchImpl)`
- `getDefaultProvidersBrowserFetch()`

要求：

- adapter 只负责把 browser `fetch` 适配成现有 `ProvidersFetchLike`
- 不在这一层处理 env、runtime mode、fallback 或业务 contract

### 2.2 env deployment 显式注入 helper

调整 `console/src/app/consoleEnvDeploymentRuntime.ts`：

- 保留 `bootstrapDefaultConsoleEnvDeploymentRuntime()` 当前行为不变
- 新增 `bootstrapConsoleEnvDeploymentRuntimeWithBrowserFetch(env, browserFetch?)`
- 只有显式提供 browser fetch 时，才把 adapter 后的 `fetchImpl` 传给现有 env deployment runtime

### 2.3 默认启动边界

保持 `main.tsx` 默认启动不自动注入 browser fetch：

- 默认仍调用 `bootstrapDefaultConsoleEnvDeploymentRuntime()`
- 即使配置了 `real-fetch` env key，只要没有显式 `fetchImpl` 注入，仍回到 mock providers

## 3. 本轮不做

- 不把 browser fetch 自动接入默认启动路径
- 不新增认证字段、token resolver 或 header 约定
- 不新增自动切换、fallback、hybrid、canary
- 不把 browser fetch seam 扩展到 `dashboard / environments / eval`
- 不新增任何真实控制动作

## 4. 验收要求

- `npm test` 通过
- `npm run build` 通过
- browser fetch adapter 会把 URL 与请求参数原样传给底层 fetch
- 显式 `env + browser fetch` 注入可以进入 Providers real-fetch 路径
- 默认启动在无显式注入时继续保持 mock
- 误导表达关键词命中仍只出现在“禁止 / 不提供”的说明语境中
