# 2026-04-17 v1 Providers auth header resolver seam 实施任务

## Summary

本轮为 Providers real-fetch transport 增加显式 auth header resolver seam，仅补“认证头注入能力占位”，不定义真实认证方案，不改变默认 mock 启动。

## Scope

- 新增 `console/src/services/providersAuthHeaders.ts`
- 在 `realProvidersFetchTransport.ts` 增加 `authHeadersResolver?`
- transport 请求头合并规则：
  - 基础为 `defaultHeaders`
  - resolver 返回值覆盖同名 `defaultHeaders`
  - resolver 返回 `undefined` 时保持原样
  - resolver 抛错时继续向上抛
- 不改默认 app startup
- 不把 auth seam 接入默认 browser runtime option

## Implementation Notes

1. 抽出 `ProvidersAuthHeaderResolver` 与 `resolveProvidersAuthHeaders(resolver?)`
2. 保持 resolver 输出契约为 `Record<string, string> | undefined`
3. 在 fetch transport 发请求前解析 resolver
4. 继续保留当前 JSON-only、`204/404`、错误映射语义
5. 补 transport 层自动化测试

## Acceptance

- 未传 resolver 时请求头只包含 `defaultHeaders`
- resolver 可追加 header
- resolver 可覆盖同名 header
- resolver 返回 `undefined` 时请求头不变
- resolver 抛错时 transport 继续抛错
- 默认 startup 与 Providers mock 行为不变
