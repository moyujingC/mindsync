# RelayHub v1 Providers readonly wire contract 对齐 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-readonly-wire-contract对齐-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 核心验收

- 默认 collection wire payload `{ items }` 可映射为 ready / empty。
- 默认 detail wire payload `{ item }` 可映射为 ready / not-found。
- 非法 collection/detail wire payload 继续抛出清晰错误。
- collection/detail path builder 继续输出既定路径。
- transport `404 + null` detail 继续映射为 `not-found`。
- custom collection/detail adapter 继续可用。
- 推荐 deployment/browser real-fetch smoke 继续通过。

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
