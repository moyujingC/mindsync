# RelayHub v1 Providers app runtime input QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-app-runtime-input-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 目标

验证 `ConsoleProvidersAppRuntimeInput` 已作为更高层装配入口接入 `ConsoleAppRuntime`，且默认 Providers 主链仍保持 mock。

## 2. 必测场景

1. 默认 `providersRuntimeInput` 解析为默认 mock app runtime options。
2. `bootstrap-options` 模式可映射到现有 `providersBootstrapOptions`。
3. `bootstrap-input` 模式可映射到现有 `providersBootstrapInput`。
4. `createConsoleAppRuntimeFromInput()` 默认行为仍为 mock。
5. `bootstrapConsoleAppRuntimeFromInput()` 可驱动 static mock source。
6. `createConsoleAppRuntimeFromInput()` 可驱动 static real-fetch source。
7. `bootstrapConsoleAppRuntimeFromInput()` 可驱动 env real-fetch source。
8. 同时传 `providersBootstrapOptions`、`providersBootstrapInput`、`providersRuntimeInput` 时按约定优先级生效。
9. `getDefaultConsoleAppRuntime()`、`createConsoleReadonlyDataSource()` 默认行为继续保持 mock providers。
10. `main.tsx` 默认启动路径不自动切到 app runtime input 主链。
11. `consoleDataSource.test.ts`、`consoleData.test.ts`、`routes.test.tsx` 全部继续通过。

## 3. 验证命令

- `npm test`
- `npm run build`
- 误导表达全文搜索：
  - `保存策略`
  - `立即切流`
  - `发布到生产`
  - `启用自动路由`
  - `编辑生产白名单`
  - `立即应用配置`

## 4. 通过标准

- 自动化测试与构建全部通过。
- Providers 默认行为仍为 mock。
- 新增 app runtime input 只作为装配层，不改变现有低层兼容入口与默认启动路径。
