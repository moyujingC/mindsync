# RelayHub v1 Providers readonly trial config governance QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-readonly-trial-config-governance-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 核心验收

- 默认配置继续解析为 mock。
- `real-fetch` 只有在具备 `baseUrl` 与显式 fetch 注入时才进入。
- 非法 mode、缺少 `baseUrl`、缺少 fetch 注入时继续回退 mock。
- 合法 default headers JSON 可进入 transport。
- 非法、非对象、空对象 default headers JSON 被忽略。
- 显式 `authHeadersResolver` 继续能进入 real-fetch 请求。
- 默认 bootstrap 路径继续保持 mock providers 行为。

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
