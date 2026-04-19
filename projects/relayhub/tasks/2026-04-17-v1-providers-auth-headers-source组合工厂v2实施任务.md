# 2026-04-17 v1 Providers auth headers source 组合工厂 v2 实施任务

## Summary

在现有 `global auth headers source seam` 之上新增更高一层 auth source composition factory，把 `default-disabled / static / global` 三类来源统一收束成单一工厂入口，并接入 Providers runtime/deployment/browser 输入链。

## Key Changes

- 在 `providersAuthHeaders.ts` 增加：
  - `ProvidersAuthHeadersSourceFactoryMode = "default-disabled" | "static" | "global"`
  - `ProvidersAuthHeadersSourceCompositionOptions`
  - `createProvidersAuthHeadersSourceFactory(options?)`
- 在 `ProvidersRuntimeConfigSourceFactoryOptions["env"]` 增加 `authHeadersSourceCompositionOptions?`
- 在 `ConsoleDeploymentRuntimeInput["env"]` 增加 `authHeadersSourceCompositionOptions?`
- 在 `ConsoleBrowserDeploymentRuntimeInput` 的 `browser-fetch` / `browser-fetch-source` / `global-browser-fetch` 增加 `authHeadersSourceCompositionOptions?`
- 固定优先级：
  - `authHeadersResolver`
  - `authHeadersSource`
  - `authHeadersSourceFactoryOptions`
  - `authHeadersSourceCompositionOptions`

## Constraints

- 不新增 auth env key
- 不新增 `env`、`token-provider`、`refreshing-provider`、`cached-provider` 模式
- 不决定 header 名、token 字段名、刷新机制或凭据存储位置
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
