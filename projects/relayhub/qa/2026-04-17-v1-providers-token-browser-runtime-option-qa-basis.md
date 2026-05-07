# 2026-04-17 v1 Providers token browser runtime option QA Basis

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer / QA
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-token-browser-runtime-option-qa-basis.md


## Core Cases

- 默认 browser runtime option 解析为 `undefined`
- `provider` 模式可映射到 token deployment input 并返回显式 token provider 映射后的 headers
- `source` 模式可映射到 token deployment input 并返回 source 提供的 token 映射后的 headers
- `source-factory` 模式可映射到 token deployment input 并返回 factory 提供的 token 映射后的 headers
- `source-composition` 模式可映射到 token deployment input 并返回 composition factory 提供的 token 映射后的 headers
- `deployment-input` 模式可直接透传现有 token deployment input
- `browser-fetch + tokenBrowserRuntimeOption` 可把 option 产出的 headers 带入请求
- `browser-fetch-source + tokenBrowserRuntimeOption` 可把 option 产出的 headers 带入请求
- `global-browser-fetch + tokenBrowserRuntimeOption` 可把 option 产出的 headers 带入请求
- 同时传 `authHeadersResolver`、`authHeadersSource`、`authHeadersSourceFactoryOptions`、`authHeadersSourceCompositionOptions`、`authDeploymentInput`、`authBrowserRuntimeOption`、`authTokenProvider`、`authTokenSource`、`authTokenSourceFactoryOptions`、`authTokenSourceCompositionOptions`、`tokenDeploymentInput`、`tokenBrowserRuntimeOption` 时按约定优先级生效
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
