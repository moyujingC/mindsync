# 2026-04-17 v1 Providers token provider seam QA Basis

## Core Cases

- 默认 disabled token source 返回 `undefined`
- static token source 可返回显式 token provider
- static token source 未传 provider 时返回 `undefined`
- global token source 只有被显式创建时才读取 `globalThis`
- token provider 可映射为现有 auth headers resolver
- token provider 返回 `undefined` 时等价于未传 auth resolver
- env deployment input + `authTokenProvider` 可装配 Providers real-fetch datasource
- env deployment input + `authTokenSource` 可装配 Providers real-fetch datasource
- `browser-fetch + authTokenProvider` 可把 token 映射后的 header 带入请求
- `browser-fetch-source + authTokenSource` 可把 token 映射后的 header 带入请求
- `global-browser-fetch + global token source` 可把 token 映射后的 header 带入请求
- 同时传 `authHeadersResolver`、`authHeadersSource`、`authHeadersSourceFactoryOptions`、`authHeadersSourceCompositionOptions`、`authTokenProvider`、`authTokenSource` 时按约定优先级生效
- global token provider 抛错时继续向上抛，不 fallback 到 mock

## Regression

- `bootstrapDefaultConsoleBrowserDeploymentRuntime()` 仍保持 mock providers 行为
- `main.tsx` 默认启动路径不自动读取 global token provider
- `consoleDataSource.test.ts`、`consoleData.test.ts`、`routes.test.tsx` 持续通过

## Misleading Copy Check

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`

命中只能出现在“不提供 / 禁止 / QA检查项”语境中。
