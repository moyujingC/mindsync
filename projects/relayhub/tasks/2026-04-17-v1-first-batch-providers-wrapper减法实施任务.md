# RelayHub v1 first batch Providers wrapper 减法实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-17-v1-first-batch-providers-wrapper减法实施任务.md
> 项目：RelayHub
> 阶段：task

这份任务用于执行第一批 Providers wrapper 减法，优先删除已不在推荐路径中的 app runtime wrapper。

## 1. 目标

本轮目标是：

- 删除只剩兼容价值、且不在推荐路径中的 app runtime wrapper
- 保持 deployment/browser 推荐 real-fetch 主链不变
- 保持默认 mock 行为不变

## 2. 关键实现

### 2.1 删除 app runtime wrapper

删除：

- `console/src/app/consoleProvidersAppRuntimeInput.ts`
- `console/src/app/consoleProvidersAppRuntimeStartup.ts`

收敛 `console/src/app/consoleAppRuntime.ts`：

- `ConsoleAppRuntimeOptions` 只保留：
  - `providersBootstrapOptions?`
  - `providersBootstrapInput?`
- 删除：
  - `providersRuntimeInput?`
  - `createConsoleAppRuntimeFromInput(...)`
  - `bootstrapConsoleAppRuntimeFromInput(...)`
  - `bootstrapConsoleAppRuntimeFromStartupInput(...)`
  - `getDefaultConsoleAppRuntimeFromStartupInput()`
- `getDefaultConsoleAppRuntime()` 改回直接基于 `createConsoleAppRuntime()`

### 2.2 更新收敛说明

更新 `specs/2026-04-17-v1-providers-runtime入口收敛说明.md`：

- 将 app runtime input/startup input 标记为已移除
- 保持 browser/deployment/security wrapper 暂不进入本轮删除

### 2.3 清理测试

删除只验证 app runtime wrapper 的测试，保留：

- `ConsoleAppRuntimeOptions` 默认 mock 行为
- `providersBootstrapOptions`
- `providersBootstrapInput`
- 推荐 deployment/browser real-fetch smoke

## 3. 本轮不做

- 不删除 browser/deployment/security wrapper
- 不删除 auth/token composition factory
- 不修改 `main.tsx`
- 不新增新 wrapper

## 4. 验收要求

- `npm test` 通过
- `npm run build` 通过
- app runtime wrapper 删除后默认 mock 行为不变
- 推荐 deployment/browser real-fetch smoke 继续通过
- 误导表达关键词命中仍只出现在“不提供 / 禁止 / QA检查项”语境中
