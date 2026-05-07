# 2026-04-17 v1 Providers auth runtime input 接线 QA Basis

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer / QA
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-auth-runtime-input接线-qa-basis.md


## 目标

验证 Providers auth resolver 已从 transport 配置层成功接到 runtime 输入层，同时默认 mock 启动和既有 browser/runtime 路径不回归。

## 核心检查项

- static real-fetch config 可携带 `authHeadersResolver` 并传到 fetch transport
- env deployment input + `fetchImpl` + `authHeadersResolver` 可装配 Providers real-fetch datasource
- `browser-fetch` / `browser-fetch-source` / `global-browser-fetch` 均可把 resolver header 带入请求
- 缺少 `fetchImpl` 或缺少 `baseUrl` 时继续回到 mock，即使传了 resolver
- resolver 抛错时继续向上抛，不 fallback 到 mock
- 默认 `bootstrapDefaultConsoleBrowserDeploymentRuntime()` 仍保持 mock providers 行为
- `main.tsx` 默认启动路径不产生真实请求

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
