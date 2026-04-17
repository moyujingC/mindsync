# 2026-04-17 v1 Providers Runtime Bootstrap 输入入口 QA Basis

## 目标行为

- providers 已具备独立 bootstrap input 入口
- 默认 bootstrap input 仍解析为 mock providers 行为
- `source-factory-options` 模式可映射到现有 bootstrap options
- `providersBootstrapOptions` 与 `providersBootstrapInput` 同时存在时，前者优先

## 验收标准

### 1. bootstrap input 落位

- 存在 `ProvidersRuntimeBootstrapInputMode`
- 存在 `ProvidersRuntimeBootstrapInput`
- 存在 `resolveProvidersRuntimeBootstrapOptions(input?)`
- 存在 `createProvidersRuntimeBootstrapFromInput(input?)`

### 2. 行为稳定

- 默认 bootstrap input 解析为默认 mock bootstrap options
- `createProvidersRuntimeBootstrapFromInput()` 默认返回 mock providers source
- `source-factory-options` 模式可驱动 static mock / static real-fetch / env real-fetch
- `createConsoleReadonlyDataSource()`、`getDefaultProvidersRuntimeBootstrap()`、`getDefaultConsoleAppRuntime()` 继续保持 mock providers 行为
- 显式 `providersSource` override 继续高于默认 bootstrap

### 3. 边界保持

- 不把 bootstrap input 扩展到 `dashboard / environments / eval`
- 不把 auth/token/security app 语义并入 bootstrap input
- 不新增真实环境变量读取、自动切换与真实控制动作

## 验证方式

1. `npm test`
2. `npm run build`
3. 误导表达全文搜索
