# 2026-04-17 v1 Providers token source 组合工厂实施任务

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-token-source组合工厂实施任务.md

## Summary

在现有 `token provider seam` 之上新增正式 `token source factory`，把 `default-disabled / static / global token source` 收束成单一可测试入口，并接入现有 Providers runtime/deployment/browser 输入链。

## Key Changes

- 在 `providersAuthHeaders.ts` 增加：
  - `ProvidersAuthTokenSourceFactoryMode = "default-disabled" | "static" | "global"`
  - `ProvidersAuthTokenSourceFactoryOptions`
  - `createProvidersAuthTokenSource(options?)`
- 在 `ProvidersRuntimeConfigSourceFactoryOptions["env"]` 增加 `authTokenSourceFactoryOptions?`
- 在 `ConsoleDeploymentRuntimeInput["env"]` 增加 `authTokenSourceFactoryOptions?`
- 在 `ConsoleBrowserDeploymentRuntimeInput` 的 `browser-fetch` / `browser-fetch-source` / `global-browser-fetch` 增加 `authTokenSourceFactoryOptions?`
- 固定 token 侧优先级：
  - `authTokenProvider`
  - `authTokenSource`
  - `authTokenSourceFactoryOptions`

## Constraints

- services 层最终仍只向 transport 产出 `authHeadersResolver`
- 不新增 auth env key
- 不新增 refresh / cache / expiry / credential store
- 默认启动保持 disabled/mock
- 仅服务 Providers，不影响 `dashboard / environments / eval`

## Verification

- `npm install --cache .npm-cache`
- `npm test`
- `npm run build`
- 误导表达全文搜索：
  - `保存策略`
  - `立即切流`
  - `发布到生产`
  - `启用自动路由`
  - `编辑生产白名单`
  - `立即应用配置`
