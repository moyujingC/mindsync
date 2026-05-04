# RelayHub v1 Providers app runtime input 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-app-runtime-input实施任务.md
> 项目：RelayHub
> 阶段：task

这份任务用于把 `RelayHub Console` 中已经形成的 `providers runtime bootstrap input` 再向上收束一层，补齐正式 `providers app runtime input` 装配入口。

## 1. 目标

本轮目标是让 Providers runtime 链从：

- `ConsoleAppRuntimeOptions -> providersBootstrapOptions / providersBootstrapInput`

推进到：

- `ConsoleProvidersAppRuntimeInput -> ConsoleAppRuntimeOptions -> ProvidersRuntimeBootstrap`

同时继续保持：

- 默认仍走 mock
- `main.tsx` 默认启动主路径不变化
- `dashboard / environments / eval` 不感知新的 Providers app runtime input

## 2. 关键实现

### 2.1 app runtime input 装配入口

新增 `console/src/app/consoleProvidersAppRuntimeInput.ts`，至少提供：

- `ConsoleProvidersAppRuntimeInputMode`
- `ConsoleProvidersAppRuntimeInput`
- `resolveConsoleAppRuntimeOptionsFromProvidersInput(input?)`

约束：

- `default-mock` 固定解析为空 app runtime options
- `bootstrap-options` 直接复用现有 `ProvidersRuntimeBootstrapOptions`
- `bootstrap-input` 直接复用现有 `ProvidersRuntimeBootstrapInput`

### 2.2 console app runtime 接线

调整 `console/src/app/consoleAppRuntime.ts`：

- `ConsoleAppRuntimeOptions` 增加 `providersRuntimeInput?`
- `createConsoleAppRuntime(options?)` 优先级固定为：
  - `providersBootstrapOptions`
  - `providersBootstrapInput`
  - `providersRuntimeInput`
- 新增：
  - `createConsoleAppRuntimeFromInput(input?)`
  - `bootstrapConsoleAppRuntimeFromInput(input?)`
- `getDefaultConsoleAppRuntime()` 改经由 `createConsoleAppRuntimeFromInput()`

### 2.3 默认主路径保持不变

保持不变：

- `main.tsx` 继续调用 `bootstrapDefaultConsoleBrowserDeploymentRuntime()`
- `ConsoleDeploymentRuntimeInput`
- `ConsoleBrowserDeploymentRuntimeInput`
- `ConsoleProvidersSecurityStartupInput`

## 3. 本轮不做

- 不新增 `env`、`deployment-runtime`、`browser-runtime`、`security-startup-input` 直通 mode
- 不把 auth/token/security 字段上提到 app runtime input
- 不改变默认 mock 主链
- 不新增真实环境读取

## 4. 验收要求

- `npm test` 通过
- `npm run build` 通过
- app runtime input 默认行为仍与 mock 等价
- app runtime input 可驱动 static mock / static real-fetch / env real-fetch
- `providersBootstrapOptions` 与 `providersBootstrapInput` 继续高于 `providersRuntimeInput`
- 误导表达关键词命中仍只出现在“不提供 / 禁止 / QA检查项”语境中
