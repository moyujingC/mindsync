# 2026-04-17 v1 Providers token provider seam 实施任务

## Summary

在现有 `auth browser runtime option` 之上新增 services 层 `token provider seam`，把 Providers auth 从显式 headers resolver/source 继续推进到显式 token provider/source。

## Key Changes

- 在 `providersAuthHeaders.ts` 增加：
  - `ProvidersAuthTokenProvider`
  - `ProvidersAuthTokenSource`
  - `defaultDisabledProvidersAuthTokenSource`
  - `createStaticProvidersAuthTokenSource(provider?)`
  - `createGlobalProvidersAuthTokenSource()`
  - `resolveProvidersAuthTokenProviderFromSource(source?)`
  - `resolveProvidersAuthHeadersResolverFromTokenProvider(provider?, headerName?)`
- 在 `ProvidersRuntimeConfigSourceFactoryOptions["env"]` 增加：
  - `authTokenProvider?`
  - `authTokenSource?`
- 在 `ConsoleDeploymentRuntimeInput["env"]` 增加：
  - `authTokenProvider?`
  - `authTokenSource?`
- 在 `ConsoleBrowserDeploymentRuntimeInput` 三种 real-fetch browser 模式增加：
  - `authTokenProvider?`
  - `authTokenSource?`
- 固定优先级：
  - `authHeadersResolver`
  - `authHeadersSource`
  - `authHeadersSourceFactoryOptions`
  - `authHeadersSourceCompositionOptions`
  - `authDeploymentInput`
  - `authBrowserRuntimeOption`
  - `authTokenProvider`
  - `authTokenSource`

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
