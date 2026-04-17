# RelayHub v1 Providers readonly wire contract 对齐 验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-readonly-wire-contract对齐-验证记录.md
> 项目：RelayHub
> 阶段：verification

## 1. 待验证项

- `npm test`
- `npm run build`
- 默认 wire adapter / datasource contract 测试
- 推荐 deployment/browser real-fetch smoke
- 误导表达全文搜索

## 2. 结果

- `npm test` 通过，`4` 个 test file、`314` 个测试全部通过。
- `npm run build` 通过，类型检查与前端构建全部通过。
- 默认 wire adapter / datasource contract 已通过自动化验证：
  - collection `{ items }` 可映射为 `ready / empty`。
  - detail `{ item }` 可映射为 `ready / not-found`。
  - transport `404 + null` detail 继续映射为 `not-found`，且不会额外调用 detail adapter。
  - 非法 collection/detail wire payload 继续抛出清晰错误。
- `buildProvidersCollectionPath(...)` 与 `buildProviderDetailPath(...)` 继续输出既定路径。
- `createRealProvidersReadonlyDataSource(...)` 与 `createRealProvidersFetchDataSource(...)` 在默认 contract 下行为不回归。
- custom collection/detail adapter 继续可用，但默认 contract 仍是推荐路径。
- 推荐 deployment/browser real-fetch smoke 继续通过，证明 contract 收口未破坏 trial 主链。
- `consoleDataSource.test.ts`、`consoleData.test.ts`、`routes.test.tsx` 全部继续通过。
- 误导表达全文搜索符合约束：
  - 当前新增命中位于 QA 检查项或任务文档语境。
  - `console/dist/` 为构建产物，不纳入源码交付边界。
