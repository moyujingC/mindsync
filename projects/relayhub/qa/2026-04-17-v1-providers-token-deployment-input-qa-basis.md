# 2026-04-17 v1 Providers token deployment input QA Basis

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer / QA
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-token-deployment-input-qa-basis.md


## Core Cases

- 默认 token deployment input 解析为 `undefined`
- `provider` 模式可返回显式 token provider 映射后的 headers resolver
- `source` 模式可返回 source 提供的 token 并映射为 headers
- `source-factory` 模式可返回 factory 提供的 token 并映射为 headers
- `source-composition` 模式可返回 composition factory 提供的 token 并映射为 headers
- env deployment input + `tokenDeploymentInput` 可装配 Providers real-fetch datasource
- `browser-fetch + tokenDeploymentInput` 可把 deployment token input 产出的 headers 带入请求
- `browser-fetch-source + tokenDeploymentInput` 可把 deployment token input 产出的 headers 带入请求
- `global-browser-fetch + tokenDeploymentInput` 可把 deployment token input 产出的 headers 带入请求
- 同时传 `authHeadersResolver`、`authHeadersSource`、`authHeadersSourceFactoryOptions`、`authHeadersSourceCompositionOptions`、`authDeploymentInput`、`authBrowserRuntimeOption`、`authTokenProvider`、`authTokenSource`、`authTokenSourceFactoryOptions`、`authTokenSourceCompositionOptions`、`tokenDeploymentInput` 时按约定优先级生效
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
