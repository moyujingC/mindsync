# 2026-04-17 v1 Providers auth deployment input 实施任务

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-auth-deployment-input实施任务.md

## Summary

在 `Console` 侧新增更高层 `Providers auth deployment input` 装配入口，把当前散落在 deployment/browser runtime 输入中的多种 auth 参数收束成单一 auth 输入对象。

## Key Changes

- 新增 `consoleProvidersAuthDeployment.ts`
- 定义：
  - `ConsoleProvidersAuthDeploymentInputMode`
  - `ConsoleProvidersAuthDeploymentInput`
  - `resolveProvidersAuthHeadersResolverFromDeploymentInput(input?)`
- 在 `ConsoleDeploymentRuntimeInput["env"]` 增加 `authDeploymentInput?`
- 在 `ConsoleBrowserDeploymentRuntimeInput` 的 `browser-fetch` / `browser-fetch-source` / `global-browser-fetch` 增加 `authDeploymentInput?`
- 固定优先级：
  - `authHeadersResolver`
  - `authHeadersSource`
  - `authHeadersSourceFactoryOptions`
  - `authHeadersSourceCompositionOptions`
  - `authDeploymentInput`

## Constraints

- services 层不新增 `authDeploymentInput`
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
