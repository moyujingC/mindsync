# 2026-04-17 v1 Providers auth headers source 组合工厂实施任务

## Summary

在现有 `auth headers source seam` 之上新增最小 `auth headers source factory`，把 `default-disabled/static` 两种来源收束成集中入口，并接入 Providers runtime/deployment/browser 输入链。

## Key Changes

- 在 `providersAuthHeaders.ts` 增加：
  - `ProvidersAuthHeadersSourceMode = "default-disabled" | "static"`
  - `ProvidersAuthHeadersSourceFactoryOptions`
  - `createProvidersAuthHeadersSource(options?)`
- 在 `ProvidersRuntimeConfigSourceFactoryOptions["env"]` 增加 `authHeadersSourceFactoryOptions?`
- 在 `ConsoleDeploymentRuntimeInput["env"]` 增加 `authHeadersSourceFactoryOptions?`
- 在 `ConsoleBrowserDeploymentRuntimeInput` 的 `browser-fetch` / `browser-fetch-source` / `global-browser-fetch` 增加 `authHeadersSourceFactoryOptions?`
- 固定优先级：
  - `authHeadersResolver`
  - `authHeadersSource`
  - `authHeadersSourceFactoryOptions`

## Constraints

- 不新增 auth env key
- 不新增 `global`、`env`、`token-provider` auth source 模式
- 不决定 header 名、token 字段名、刷新机制或凭据存储位置
- 默认启动保持 mock/disabled
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
