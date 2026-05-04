# 2026-04-17 v1 Providers global auth headers source seam QA Basis

## Core Cases

- 默认 disabled source 仍返回 `undefined`
- `createGlobalProvidersAuthHeadersSource()` 只有被显式创建时才读取 `globalThis`
- `global` auth source 在 global resolver 存在时可返回显式 headers
- `global` auth source 在 global resolver 缺失时返回 `undefined`
- `createProvidersAuthHeadersSource({ mode: "global" })` 与显式 global source 行为等价
- env deployment input + global auth source factory mode 可装配 Providers real-fetch datasource
- `browser-fetch + global auth source factory mode` 可把 global headers 带入请求
- `browser-fetch-source + global auth source factory mode` 可把 global headers 带入请求
- `global-browser-fetch + global auth source factory mode` 可把 global headers 带入请求
- 同时传 `authHeadersResolver` / `authHeadersSource` / `authHeadersSourceFactoryOptions.mode=global` 时继续按既有优先级生效
- global resolver 抛错时继续向上抛，不 fallback 到 mock

## Regression

- `bootstrapDefaultConsoleBrowserDeploymentRuntime()` 仍保持 mock providers 行为
- `main.tsx` 默认启动路径不自动读取 global auth resolver
- `consoleDataSource.test.ts`、`consoleData.test.ts`、`routes.test.tsx` 持续通过

## Misleading Copy Check

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`

命中只能出现在“不提供 / 禁止 / QA检查项”语境中。
