# 2026-04-17 v1 Providers auth headers source 组合工厂 v2 QA Basis

## Core Cases

- 默认 composition factory 返回 disabled source
- `default-disabled` 模式与当前 disabled source 行为等价
- `static` 模式可返回显式 resolver
- `static` 模式缺少 resolver 时返回 disabled/undefined 等价行为
- `global` 模式只有被显式选择时才读取 `globalThis` resolver
- `global` 模式在 resolver 缺失时返回 `undefined`
- env deployment input + `authHeadersSourceCompositionOptions` 可装配 Providers real-fetch datasource
- `browser-fetch + authHeadersSourceCompositionOptions` 可把 composition factory 产出的 headers 带入请求
- `browser-fetch-source + authHeadersSourceCompositionOptions` 可把 composition factory 产出的 headers 带入请求
- `global-browser-fetch + authHeadersSourceCompositionOptions` 可把 composition factory 产出的 headers 带入请求
- 同时传 `authHeadersResolver`、`authHeadersSource`、`authHeadersSourceFactoryOptions`、`authHeadersSourceCompositionOptions` 时按约定优先级生效
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
