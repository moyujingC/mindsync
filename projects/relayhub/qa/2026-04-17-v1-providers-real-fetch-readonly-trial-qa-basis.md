# RelayHub v1 Providers real-fetch readonly trial QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-real-fetch-readonly-trial-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 核心验收

- deployment 推荐入口可完成 Providers readonly real-fetch collection 与 detail 请求。
- browser 推荐入口可完成 Providers readonly real-fetch collection 与 detail 请求。
- `defaultHeaders` 与显式 `authHeadersResolver` 能进入请求。
- detail `404` 继续映射为 `not-found`。
- real-fetch error 继续向上抛，不 fallback 到 mock。
- 默认启动路径继续保持 mock providers 行为。

## 2. 回归范围

- `consoleDataSource.test.ts`
- `consoleData.test.ts`
- `routes.test.tsx`
- `npm run build`

## 3. 误导表达检查

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`

命中只能出现在“不提供 / 禁止 / QA检查项”语境中。
