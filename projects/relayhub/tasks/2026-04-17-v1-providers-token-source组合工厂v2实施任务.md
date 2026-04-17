# 2026-04-17 v1 Providers token source 组合工厂 v2 实施任务

## Summary

在现有 `token source factory` 之上新增更高一层 `token source composition factory`，把 `default-disabled / static / global` 三类 token 来源统一收束成单一、正式、可测试的组合工厂入口，并接入现有 Providers runtime/deployment/browser 输入链。

## Key Changes

- 在 `providersAuthHeaders.ts` 增加：
  - `ProvidersAuthTokenSourceCompositionMode = "default-disabled" | "static" | "global"`
  - `ProvidersAuthTokenSourceCompositionOptions`
  - `createProvidersAuthTokenSourceFactory(options?)`
- 在 `ProvidersRuntimeConfigSourceFactoryOptions["env"]` 增加 `authTokenSourceCompositionOptions?`
- 在 `ConsoleDeploymentRuntimeInput["env"]` 增加 `authTokenSourceCompositionOptions?`
- 在 `ConsoleBrowserDeploymentRuntimeInput` 的 `browser-fetch` / `browser-fetch-source` / `global-browser-fetch` 增加 `authTokenSourceCompositionOptions?`
- 固定 token 侧优先级：
  - `authTokenProvider`
  - `authTokenSource`
  - `authTokenSourceFactoryOptions`
  - `authTokenSourceCompositionOptions`

## Constraints

- services 层最终仍只向 transport 产出 `authHeadersResolver`
- 不新增 auth env key
- 不新增 refresh / cache / expiry / credential store
- 默认启动保持 disabled/mock
- 仅服务 Providers，不影响 `dashboard / environments / eval`

## Verification

- `npm test`
- `npm run build`
- 误导表达全文搜索：
  - `保存策略`
  - `立即切流`
  - `发布到生产`
  - `启用自动路由`
  - `编辑生产白名单`
  - `立即应用配置`
