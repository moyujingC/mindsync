# 2026-04-17 v1 Providers token deployment input 实施任务

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-token-deployment-input实施任务.md

## Summary

在现有 `token source composition factory v2` 之上新增 `Console` 侧 `token deployment input` 装配层，把 deployment/browser runtime 输入中的 `authTokenProvider / authTokenSource / authTokenSourceFactoryOptions / authTokenSourceCompositionOptions` 收束成单一 token 输入对象。

## Key Changes

- 在 `consoleProvidersTokenDeployment.ts` 增加：
  - `ConsoleProvidersTokenDeploymentInputMode = "default-disabled" | "provider" | "source" | "source-factory" | "source-composition"`
  - `ConsoleProvidersTokenDeploymentInput`
  - `resolveProvidersAuthHeadersResolverFromTokenDeploymentInput(input?)`
- 在 `ConsoleDeploymentRuntimeInput["env"]` 增加 `tokenDeploymentInput?`
- 在 `ConsoleBrowserDeploymentRuntimeInput` 的 `browser-fetch` / `browser-fetch-source` / `global-browser-fetch` 增加 `tokenDeploymentInput?`
- 固定 token 侧优先级：
  - `authTokenProvider`
  - `authTokenSource`
  - `authTokenSourceFactoryOptions`
  - `authTokenSourceCompositionOptions`
  - `tokenDeploymentInput`

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
