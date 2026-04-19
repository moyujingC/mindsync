# 2026-04-17 v1 Providers auth headers source seam QA Basis

## 目标

验证 Providers auth headers source seam 已落位，并且 deployment/browser runtime 可显式选择 resolver 来源，同时默认 mock 启动不回归。

## 核心检查项

- default disabled auth source 返回 `undefined`
- static auth source 可返回显式 resolver
- static auth source 未传 resolver 时返回 `undefined`
- env deployment input + `authHeadersSource` 可装配 Providers real-fetch datasource
- `browser-fetch` / `browser-fetch-source` / `global-browser-fetch` 可通过 auth source 把 header 带入请求
- disabled source 行为等价于未传 auth resolver
- 显式 `authHeadersResolver` 与 `authHeadersSource` 同时存在时，显式 resolver 优先
- resolver 抛错时继续向上抛，不 fallback 到 mock
- 默认 `bootstrapDefaultConsoleBrowserDeploymentRuntime()` 仍保持 mock providers 行为

## 回归范围

- `consoleDataSource.test.ts`
- `consoleData.test.ts`
- `routes.test.tsx`
- `npm run build`

## 误导表达检查

全文搜索以下关键词，命中只能出现在“不提供 / 禁止 / QA检查项”语境中：

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`
