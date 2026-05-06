# 2026-04-17 v1 Providers auth browser runtime option 实施任务

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-auth-browser-runtime-option实施任务.md

## Summary

在 `Console` 侧新增更高层 `Providers auth browser runtime option` 装配入口，把 browser runtime 输入中的显式 `authDeploymentInput` 再收束一层。

## Key Changes

- 新增 `consoleProvidersAuthBrowserRuntime.ts`
- 定义：
  - `ConsoleProvidersAuthBrowserRuntimeOptionMode`
  - `ConsoleProvidersAuthBrowserRuntimeOption`
  - `resolveProvidersAuthDeploymentInputFromBrowserRuntimeOption(option?)`
- 在 `ConsoleBrowserDeploymentRuntimeInput` 的 `browser-fetch` / `browser-fetch-source` / `global-browser-fetch` 增加 `authBrowserRuntimeOption?`
- 固定优先级：
  - `authHeadersResolver`
  - `authHeadersSource`
  - `authHeadersSourceFactoryOptions`
  - `authHeadersSourceCompositionOptions`
  - `authDeploymentInput`
  - `authBrowserRuntimeOption`

## Constraints

- services 层不新增 `authBrowserRuntimeOption`
- `ConsoleDeploymentRuntimeInput` 不新增 `authBrowserRuntimeOption`
- 不新增 auth env key
- 不新增 token provider / refresh / cache
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
