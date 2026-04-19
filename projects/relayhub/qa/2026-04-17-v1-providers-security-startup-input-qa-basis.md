# 2026-04-17 v1 Providers Security Startup Input QA Basis

## 必测项

- 默认 `securityStartupInput` 解析为 `undefined`
- `security-deployment-input` 可映射为 deployment security input 产出的 resolver
- `security-browser-runtime-input` 可映射为 browser security input 产出的 resolver
- `resolveConsoleDeploymentRuntimeInputFromEnv(..., securityStartupInput)` 可携带 startup security input
- `bootstrapConsoleEnvDeploymentRuntime(..., securityStartupInput)` 可装配 Providers real-fetch datasource
- `bootstrapConsoleEnvDeploymentRuntimeWithBrowserFetch(..., securityStartupInput)` 可装配带 browser fetch 的 real-fetch datasource
- 同时传显式 `authHeadersResolver` 与 `securityStartupInput` 时，显式 resolver 优先
- global resolver 或 global token provider 抛错时继续向上抛，不 fallback 到 mock
- 默认 `bootstrapDefaultConsoleEnvDeploymentRuntime()` 与 `bootstrapDefaultConsoleBrowserDeploymentRuntime()` 仍保持 mock providers 行为
- `main.tsx` 默认启动路径不自动读取 global auth resolver 或 global token provider
- `consoleDataSource.test.ts`、`consoleData.test.ts`、`routes.test.tsx` 继续通过

## 构建与检索

- `npm run build` 必须通过
- 误导表达全文搜索：
  - `保存策略`
  - `立即切流`
  - `发布到生产`
  - `启用自动路由`
  - `编辑生产白名单`
  - `立即应用配置`
- 命中只能出现在“不提供 / 禁止 / QA检查项”语境中
