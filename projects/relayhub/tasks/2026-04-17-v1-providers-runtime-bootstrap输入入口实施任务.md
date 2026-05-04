# 2026-04-17 v1 Providers Runtime Bootstrap 输入入口实施任务

## 目标

在 services 层为 `ProvidersRuntimeBootstrap` 新增正式 bootstrap 输入入口，把直接传 `sourceFactoryOptions` 的方式收束成单一 input 对象，同时保持默认 mock 行为与现有 options 注入兼容。

## 实施要求

- 扩展 `console/src/services/providersRuntimeBootstrap.ts`
- 定义：
  - `ProvidersRuntimeBootstrapInputMode`
  - `ProvidersRuntimeBootstrapInput`
  - `resolveProvidersRuntimeBootstrapOptions(input?)`
  - `createProvidersRuntimeBootstrapFromInput(input?)`
- 保留：
  - `ProvidersRuntimeBootstrapOptions`
  - `createProvidersRuntimeBootstrap(options?)`
  - `getDefaultProvidersRuntimeBootstrap()`
- 默认 `input` 固定映射为 default mock bootstrap options
- `source-factory-options` 模式只复用现有 `ProvidersRuntimeConfigSourceFactoryOptions`
- `getDefaultProvidersRuntimeBootstrap()` 改经由 bootstrap input 默认值

## 接线要求

- `ConsoleAppRuntimeOptions` 增加 `providersBootstrapInput?`
- `createConsoleAppRuntime()` 在未显式传 `providersBootstrapOptions` 时才使用 `providersBootstrapInput?`
- `providersBootstrapOptions` 必须保持更高优先级
- 默认 `createConsoleReadonlyDataSource()`、`getDefaultConsoleAppRuntime()` 继续保持 mock providers 行为

## 约束

- 不新增 `env`、`config-source`、`config-object` 直通 bootstrap mode
- 不修改 `ConsoleDeploymentRuntimeInput`、`ConsoleBrowserDeploymentRuntimeInput`
- 不把 auth/token/security deployment/browser/startup 语义并入 bootstrap input
- 不改默认启动路径
- 不新增真实控制动作或自动真实请求

## 验证要求

- 补齐 bootstrap input 单测
- `npm test` 通过
- `npm run build` 通过
- 误导表达全文搜索命中只能出现在“不提供 / 禁止 / QA检查项”语境中
