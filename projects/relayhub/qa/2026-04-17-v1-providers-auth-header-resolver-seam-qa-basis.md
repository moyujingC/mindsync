# 2026-04-17 v1 Providers auth header resolver seam QA Basis

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer / QA
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-auth-header-resolver-seam-qa-basis.md


## 目标

验证 Providers real-fetch transport 已支持显式 auth header resolver seam，且不破坏默认 mock 启动与既有 browser runtime 路径。

## 核心检查项

- transport 未传 resolver 时继续只发送 `defaultHeaders`
- resolver 返回 header 时能并入请求
- resolver 返回同名 header 时覆盖 `defaultHeaders`
- resolver 返回 `undefined` 时请求保持原样
- resolver 抛错时 transport 继续抛错
- 现有 `browser-fetch`、`browser-fetch-source`、`global-browser-fetch` 路径继续可用
- 默认 `bootstrapDefaultConsoleBrowserDeploymentRuntime()` 仍保持 mock providers 行为
- `main.tsx` 默认启动路径不变更为真实请求

## 回归范围

- `consoleDataSource.test.ts`
- `consoleData.test.ts`
- `routes.test.tsx`
- `npm run build`

## 误导表达检查

全文搜索以下关键词，命中只能出现在“禁止 / 不提供 / QA 检查项”语境中：

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`
