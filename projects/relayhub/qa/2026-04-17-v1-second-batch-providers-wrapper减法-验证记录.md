# RelayHub v1 second batch Providers wrapper 减法 验证记录

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-second-batch-providers-wrapper减法-验证记录.md
> 项目：RelayHub
> 阶段：verification

## 1. 执行项

- 已执行：`npm test`
- 已执行：`npm run build`
- 已执行：误导表达全文搜索

## 2. 结果

- `npm test` 通过。
  - 结果：`4` 个 test file 全部通过，`322` 个测试全部通过。
  - 关键覆盖：
    - `consoleDataSource.test.ts`
    - `consoleData.test.ts`
    - `routes.test.tsx`
    - 推荐 deployment/browser real-fetch smoke 路径
- `npm run build` 通过。
  - 结果：`tsc --noEmit -p tsconfig.app.json`、`tsc --noEmit -p tsconfig.node.json`、`vite build` 全部通过。
- startup security wrapper 死引用检查通过。
  - `console/src` 未再命中：
    - `ConsoleProvidersSecurityStartupInput`
    - `securityStartupInput`
    - `resolveProvidersAuthHeadersResolverFromSecurityStartupInput(...)`
- 误导表达全文搜索符合约束。
  - `console/src` 命中仅出现在 `AppRoutes.tsx` 的“不提供 ...”语境。
  - `tasks/`、`qa/`、`delivery/` 命中位于 QA 检查项、验证记录或历史任务语境。

## 3. 结论

- 第二批减法已完成，startup helper 已不再承载 security 聚合语义。
- 默认 mock 行为未回归，deployment/browser 推荐 real-fetch 入口保持可用。
- 当前仍应把后续真实安全闭环下沉到 deployment/browser 层，而不是重新回到 startup wrapper 路线。
