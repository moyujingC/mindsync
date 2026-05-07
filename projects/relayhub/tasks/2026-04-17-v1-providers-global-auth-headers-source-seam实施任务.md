# 2026-04-17 v1 Providers global auth headers source seam 实施任务

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-global-auth-headers-source-seam实施任务.md

## Summary

在现有 `auth headers source factory` 之上继续补一个显式 `global auth headers source seam`，让 Providers auth 在不引入 env auth key、不定义 token provider 的前提下，具备读取 `globalThis` 上显式 resolver 的能力。

## Key Changes

- 在 `providersAuthHeaders.ts` 增加：
  - `ProvidersAuthHeadersSourceMode` 扩为 `"default-disabled" | "static" | "global"`
  - `getDefaultProvidersAuthHeaderResolver()`
  - `createGlobalProvidersAuthHeadersSource()`
- `createProvidersAuthHeadersSource(options?)` 支持 `mode: "global"`
- 默认链路继续保持 disabled/mock；只有显式选择 `global` source 或 `global` factory mode 时才读取 `globalThis`
- 继续复用现有优先级：
  - `authHeadersResolver`
  - `authHeadersSource`
  - `authHeadersSourceFactoryOptions`

## Constraints

- 不新增 auth env key
- 不新增 token provider / token refresh / credential store
- 不定义 header 名与 token 字段名
- 不影响 `dashboard / environments / eval`
- 不新增真实控制动作

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
