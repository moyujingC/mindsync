# RelayHub v1 Providers app runtime startup input QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-app-runtime-startup-input-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 目标

验证 `ConsoleProvidersAppRuntimeStartupInput` 已作为 startup helper 层更高一层装配入口接入 `ConsoleAppRuntime`，且默认 Providers 主链仍保持 mock。

## 2. 必测场景

1. 默认 `startup input` 解析为空 `ConsoleAppRuntimeOptions`。
2. `app-runtime-options` 模式可映射到现有 `ConsoleAppRuntimeOptions`。
3. `app-runtime-input` 模式可映射到现有 `ConsoleProvidersAppRuntimeInput`。
4. `bootstrapConsoleAppRuntimeFromStartupInput()` 默认行为仍为 mock。
5. `bootstrapConsoleAppRuntimeFromStartupInput({ mode: "app-runtime-options" })` 可驱动 static mock / static real-fetch。
6. `bootstrapConsoleAppRuntimeFromStartupInput({ mode: "app-runtime-input" })` 可驱动 env real-fetch。
7. `ConsoleAppRuntimeOptions` 内部既有优先级不回归。
8. `main.tsx` 默认启动路径不自动切到 app runtime startup input 主链。
9. `consoleDataSource.test.ts`、`consoleData.test.ts`、`routes.test.tsx` 全部继续通过。

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
- 新增 startup input 只作为装配层，不改变现有低层兼容入口与默认启动路径。
