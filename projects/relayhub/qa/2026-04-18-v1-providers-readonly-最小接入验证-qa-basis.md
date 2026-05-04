# RelayHub v1 Providers readonly 最小接入验证 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-18
> source_of_truth：projects/relayhub/qa/2026-04-18-v1-providers-readonly-最小接入验证-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 核心验收

- deployment 推荐入口可完成 readonly 最小接入验证成功路径。
- browser `browser-fetch` 推荐入口可完成 readonly 最小接入验证成功路径。
- browser `browser-fetch-source` 推荐入口可完成 readonly 最小接入验证成功路径。
- request path / query / headers 符合默认 contract。
- `defaultHeaders` 与显式 `authHeadersResolver` 能进入请求。
- detail `404` 映射为 `not-found`。
- 非 `404` 非 `2xx` transport error 继续向上抛。
- 默认 bootstrap 路径继续保持 mock。

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
