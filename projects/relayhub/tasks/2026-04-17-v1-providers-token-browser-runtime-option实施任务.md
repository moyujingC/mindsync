# 2026-04-17 v1 Providers token browser runtime option 实施任务

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-token-browser-runtime-option实施任务.md

## Summary

在现有 `Providers token deployment input` 之上新增 `Console` 侧 `token browser runtime option`，把 browser runtime 输入里显式传 `tokenDeploymentInput` 的方式再收束一层。

## Key Changes

- 在 `consoleProvidersTokenBrowserRuntime.ts` 增加：
  - `ConsoleProvidersTokenBrowserRuntimeOptionMode = "default-disabled" | "provider" | "source" | "source-factory" | "source-composition" | "deployment-input"`
  - `ConsoleProvidersTokenBrowserRuntimeOption`
  - `resolveProvidersTokenDeploymentInputFromBrowserRuntimeOption(option?)`
- 在 `ConsoleBrowserDeploymentRuntimeInput` 的 `browser-fetch` / `browser-fetch-source` / `global-browser-fetch` 增加 `tokenBrowserRuntimeOption?`
- 固定 token 侧优先级：
  - `authTokenProvider`
  - `authTokenSource`
  - `authTokenSourceFactoryOptions`
  - `authTokenSourceCompositionOptions`
  - `tokenDeploymentInput`
  - `tokenBrowserRuntimeOption`

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
