# RelayHub v1 Providers readonly 最小接入验证 验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / QA
> last_updated：2026-04-18
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-18-v1-providers-readonly-最小接入验证-验证记录.md
> 项目：RelayHub
> 阶段：verification

## 1. 待验证项

- `npm test`
- `npm run build`
- 推荐 deployment/browser 最小接入验证
- 默认 mock 启动行为
- 误导表达全文搜索

## 2. 结果

- `npm test` 通过，`4` 个 test file、`314` 个测试全部通过。
- `npm run build` 通过，类型检查与前端构建全部通过。
- 推荐 deployment/browser 最小接入验证继续通过：
  - deployment `env` 推荐入口可完成 collection / detail / not-found 验证。
  - browser `browser-fetch` 推荐入口可验证 query、`defaultHeaders`、显式 `authHeadersResolver` 与 transport error 上抛。
  - browser `browser-fetch-source` 推荐入口可完成 collection / detail / not-found 验证。
- 默认 wire contract 样例已收敛到测试侧私有 fixture/helper：
  - collection success `{ items: [...] }`
  - collection empty `{ items: [] }`
  - detail success `{ item: {...} }`
  - detail not-found `{ item: null }`
- 默认 bootstrap / `main.tsx` 路径继续保持 mock providers 行为。
- 误导表达全文搜索符合约束：
  - 当前新增命中位于 QA 检查项或任务文档语境。
  - `console/dist/` 为构建产物，不纳入源码交付边界。
