# 2026-04-17 v1 Providers Security Deployment Input QA Basis

## 必测项

- 默认 `securityDeploymentInput` 解析为 `undefined`
- `auth-deployment-input` 可映射为显式 auth resolver
- `token-deployment-input` 可映射为 token deployment input 产出的 resolver
- `security-browser-runtime-input` 可映射为现有 security browser runtime input 产出的 resolver
- `env deployment input + securityDeploymentInput` 可装配 Providers real-fetch datasource
- 同时传现有所有低层 deployment auth/token 输入与 `securityDeploymentInput` 时按约定优先级生效
- global resolver 或 global token provider 抛错时继续向上抛，不 fallback 到 mock
- 默认 `bootstrapDefaultConsoleBrowserDeploymentRuntime()` 仍保持 mock providers 行为
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
