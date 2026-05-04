# RelayHub v1 Providers app runtime startup input 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-app-runtime-startup-input实施任务.md
> 项目：RelayHub
> 阶段：task

这份任务用于把 `RelayHub Console` 已有的 `providers app runtime input` 再向上收束一层，补齐 startup helper 级统一装配入口。

## 1. 目标

本轮目标是让 Providers runtime 链从：

- `startup helper -> providersBootstrapOptions / providersBootstrapInput / providersRuntimeInput`

推进到：

- `ConsoleProvidersAppRuntimeStartupInput -> ConsoleAppRuntimeOptions -> ConsoleProvidersAppRuntimeInput -> ProvidersRuntimeBootstrap`

同时继续保持：

- 默认仍走 mock
- `main.tsx` 默认启动路径不变化
- `dashboard / environments / eval` 不感知新的 startup input

## 2. 关键实现

### 2.1 startup input 装配入口

新增 `console/src/app/consoleProvidersAppRuntimeStartup.ts`，至少提供：

- `ConsoleProvidersAppRuntimeStartupInputMode`
- `ConsoleProvidersAppRuntimeStartupInput`
- `resolveConsoleAppRuntimeOptionsFromStartupInput(input?)`

约束：

- `default-mock` 固定解析为空 `ConsoleAppRuntimeOptions`
- `app-runtime-options` 直接复用现有 `ConsoleAppRuntimeOptions`
- `app-runtime-input` 直接复用现有 `ConsoleProvidersAppRuntimeInput`

### 2.2 console app runtime startup 接线

调整 `console/src/app/consoleAppRuntime.ts`：

- 新增 `bootstrapConsoleAppRuntimeFromStartupInput(input?)`
- 新增 `getDefaultConsoleAppRuntimeFromStartupInput()`
- `bootstrapConsoleAppRuntime(options?)` 保持现有低层 options 入口
- `bootstrapConsoleAppRuntimeFromInput(input?)` 保持现有 app runtime input 入口

### 2.3 默认主路径保持不变

保持不变：

- `main.tsx` 继续调用 `bootstrapDefaultConsoleBrowserDeploymentRuntime()`
- `ConsoleDeploymentRuntimeInput`
- `ConsoleBrowserDeploymentRuntimeInput`
- `ConsoleProvidersSecurityStartupInput`

## 3. 本轮不做

- 不新增 `deployment-runtime-input`、`browser-deployment-runtime-input`、`security-startup-input`、`env` 直通 mode
- 不把 auth/token/security 字段上提到 startup input
- 不改变默认 mock 主链
- 不新增真实环境读取

## 4. 验收要求

- `npm test` 通过
- `npm run build` 通过
- startup input 默认行为仍与 mock 等价
- startup input 可驱动 static mock / static real-fetch / env real-fetch
- 既有 `ConsoleAppRuntimeOptions` 内部优先级不回归
- 误导表达关键词命中仍只出现在“不提供 / 禁止 / QA检查项”语境中
