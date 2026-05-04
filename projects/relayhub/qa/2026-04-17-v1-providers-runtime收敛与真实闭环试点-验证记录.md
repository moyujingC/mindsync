# RelayHub v1 Providers runtime 收敛与真实闭环试点 验证记录

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-runtime收敛与真实闭环试点-验证记录.md
> 项目：RelayHub
> 阶段：verification

## 1. 执行项

- 已执行：`npm test`
- 已执行：`npm run build`
- 已执行：误导表达全文搜索

## 2. 结果

- `npm test` 通过：4 个测试文件，340 个测试全部通过。
- `npm run build` 通过。
- 新增推荐路径 smoke 测试通过，覆盖：
  - deployment `env` real-fetch collection 请求
  - deployment `env` real-fetch detail 请求
  - 404 detail 映射为 `not-found`
  - browser `browser-fetch` real-fetch collection 请求
  - `defaultHeaders` 与显式 `authHeadersResolver` 进入 transport 请求
  - real-fetch error 向上抛，不 fallback 到 mock
- 既有兼容入口相关测试继续通过，证明软减法未破坏现有调用。
- 误导表达全文搜索结果符合预期：
  - 源码命中继续只出现在 `/console/src/app/AppRoutes.tsx` 的“不提供”语境
  - 其余命中位于 `tasks/`、`qa/`、`delivery/` 等检查 artifact

## 3. 结论

- 本轮 Providers runtime 已完成“软减法 + 真实只读闭环试点”。
- 当前现有 seam 已足以承载最小 real-fetch 闭环，下一轮应优先基于真实使用情况决定删除哪些 wrapper，而不是继续新增 wrapper。
