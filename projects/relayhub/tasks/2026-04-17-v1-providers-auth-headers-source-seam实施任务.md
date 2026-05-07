# 2026-04-17 v1 Providers auth headers source seam 实施任务

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-auth-headers-source-seam实施任务.md

## Summary

本轮目标是把当前“调用方直接传 `authHeadersResolver`”收束为正式的 auth headers source seam，为后续 token 来源接入预留集中入口，同时保持默认 mock 启动不变。

## Key Changes

- 在 `providersAuthHeaders.ts` 固化 source seam：
  - `defaultDisabledProvidersAuthHeadersSource`
  - `createStaticProvidersAuthHeadersSource(resolver?)`
  - `resolveProvidersAuthHeaderResolverFromSource(source?)`
- 在 Providers runtime config source factory 的 `env` 模式增加 `authHeadersSource?`
- 在 `ConsoleDeploymentRuntimeInput["env"]` 增加 `authHeadersSource?`
- 在 browser runtime 三条 real-fetch 输入模式增加 `authHeadersSource?`
- 固定优先级：显式 `authHeadersResolver` 高于 `authHeadersSource`

## Acceptance

- disabled source 固定等价于未传 resolver
- static source 可显式提供 resolver
- deployment/browser runtime 可通过 auth source 把 header 带入请求
- 显式 resolver 与 source 同时存在时，显式 resolver 生效
- 默认 startup 与 mock 行为不变
