# 2026-04-17 v1 Providers auth deployment input QA Basis

## Core Cases

- 默认 deployment auth input 解析为 `undefined`
- `resolver` 模式可返回显式 resolver
- `source` 模式可返回 source 提供的 resolver
- `source-factory` 模式可返回 factory 提供的 resolver
- `source-composition` 模式可返回 composition factory 提供的 resolver
- env deployment input + `authDeploymentInput` 可装配 Providers real-fetch datasource
- `browser-fetch + authDeploymentInput` 可把 deployment auth input 产出的 headers 带入请求
- `browser-fetch-source + authDeploymentInput` 可把 deployment auth input 产出的 headers 带入请求
- `global-browser-fetch + authDeploymentInput` 可把 deployment auth input 产出的 headers 带入请求
- 同时传 `authHeadersResolver`、`authHeadersSource`、`authHeadersSourceFactoryOptions`、`authHeadersSourceCompositionOptions`、`authDeploymentInput` 时按约定优先级生效
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
