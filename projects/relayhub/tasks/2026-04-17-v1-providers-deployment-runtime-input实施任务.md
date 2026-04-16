# RelayHub v1 Providers deployment runtime input 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-17-v1-providers-deployment-runtime-input实施任务.md
> 项目：RelayHub
> 阶段：task

这份任务用于把 `RelayHub` 控制台当前已经具备的 `console app runtime` 再向上推进一层，新增 `deployment runtime input` 装配层。

## 1. 目标

本轮目标是让 `Providers` 的 runtime 链从：

- `app startup -> console app runtime -> providers runtime bootstrap`

推进到：

- `app startup -> deployment runtime input -> console app runtime -> providers runtime bootstrap`

同时继续保持：

- 默认仍走 mock
- 页面层、路由层和 `consoleData.ts` 对外 helper 不感知 deployment input
- 不读取真实环境变量

## 2. 关键实现

### 2.1 deployment runtime input 层

在 `console/src/app/consoleDeploymentRuntime.ts` 新增：

- `ConsoleDeploymentRuntimeInputMode = "default-mock" | "static" | "env"`
- `ConsoleDeploymentRuntimeInput`
- `resolveConsoleAppRuntimeOptions(input?)`
- `bootstrapConsoleDeploymentRuntime(input?)`

要求：

- 只服务 `Providers`
- 只负责把更高层 deployment input 映射成现有 `ConsoleAppRuntimeOptions`
- `bootstrapConsoleDeploymentRuntime(input?)` 内部直接调用 `bootstrapConsoleAppRuntime(...)`

### 2.2 deployment input 语义

- `default-mock`
  - 固定映射到默认 mock providers 路径
- `static`
  - 接受显式 `ProvidersRuntimeConfig`
  - 映射到 `providersBootstrapOptions.sourceFactoryOptions = { mode: "static", config }`
- `env`
  - 接受显式 `ProvidersRuntimeEnv` 与可选 `fetchImpl`
  - 映射到 `providersBootstrapOptions.sourceFactoryOptions = { mode: "env", env, fetchImpl }`

### 2.3 默认启动接线

调整 `main.tsx`：

- 默认启动从 `bootstrapConsoleAppRuntime()` 改为 `bootstrapConsoleDeploymentRuntime()`
- 默认不传 input，因此行为仍固定为 mock

保留不变：

- `bootstrapConsoleAppRuntime()` 继续存在
- `consoleAppRuntime.ts` 继续负责 runtime 组装与 datasource 安装
- `providersRuntimeBootstrap.ts` 继续负责 providers source 装配

## 3. 本轮不做

- 不读取 `import.meta.env`
- 不读取 `process.env`
- 不新增认证字段或 token/provider/auth resolver
- 不引入自动切换、fallback、hybrid、canary 模式
- 不把 deployment input 扩到 `dashboard / environments / eval`
- 不新增任何真实控制动作

## 4. 验收要求

- `npm test` 通过
- `npm run build` 通过
- deployment input 默认行为与当前 mock 等价
- deployment input 可映射到 static/env real-fetch providers 路径
- 非 Providers 资源继续保持 mock-only
- 误导表达关键词命中仍只出现在“禁止 / 不提供”的说明语境中
