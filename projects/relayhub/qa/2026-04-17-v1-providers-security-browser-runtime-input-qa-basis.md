# 2026-04-17 v1 Providers Security Browser Runtime Input QA Basis

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer / QA
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-security-browser-runtime-input-qa-basis.md


## 必测项

- 默认 `securityBrowserRuntimeInput` 解析为 `undefined`
- `auth-deployment-input` 可映射为显式 auth resolver
- `auth-browser-runtime-option` 可映射为现有 auth browser runtime option 产出的 resolver
- `token-deployment-input` 可映射为 token deployment input 产出的 resolver
- `token-browser-runtime-option` 可映射为 token browser runtime option 产出的 resolver
- `browser-fetch + securityBrowserRuntimeInput` 可把统一输入产出的 headers 带入请求
- `browser-fetch-source + securityBrowserRuntimeInput` 可把统一输入产出的 headers 带入请求
- `global-browser-fetch + securityBrowserRuntimeInput` 可把统一输入产出的 headers 带入请求
- 同时传现有所有低层 auth/token 输入与 `securityBrowserRuntimeInput` 时按约定优先级生效
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
