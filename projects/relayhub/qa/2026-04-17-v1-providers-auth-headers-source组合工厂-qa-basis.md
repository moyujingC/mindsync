# 2026-04-17 v1 Providers auth headers source 组合工厂 QA Basis

## Core Cases

- 默认 factory 返回 disabled auth source
- `default-disabled` 模式与现有 disabled source 行为等价
- `static` 模式可返回显式 resolver
- `static` 模式未传 resolver 时等价于 disabled source
- env deployment input + `authHeadersSourceFactoryOptions` 可装配 Providers real-fetch datasource
- `browser-fetch + authHeadersSourceFactoryOptions` 可把 factory 产出的 header 带入请求
- `browser-fetch-source + authHeadersSourceFactoryOptions` 可把 factory 产出的 header 带入请求
- `global-browser-fetch + authHeadersSourceFactoryOptions` 可把 factory 产出的 header 带入请求
- 同时传 `authHeadersResolver`、`authHeadersSource`、`authHeadersSourceFactoryOptions` 时按约定优先级生效
- factory 解析为 disabled 时继续等价于未传 auth resolver
- resolver 抛错时继续向上抛，不 fallback 到 mock

## Regression

- `bootstrapDefaultConsoleBrowserDeploymentRuntime()` 仍保持 mock providers 行为
- `main.tsx` 默认启动路径不产生真实请求
- `consoleDataSource.test.ts`、`consoleData.test.ts`、`routes.test.tsx` 持续通过

## Misleading Copy Check

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`

命中只能出现在“不提供 / 禁止 / QA检查项”语境中。
