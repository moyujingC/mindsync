# RelayHub v1 third batch Providers wrapper 减法 验证记录

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-third-batch-providers-wrapper减法-验证记录.md
> 项目：RelayHub
> 阶段：verification

## 1. 执行项

- 已执行：`npm test`
- 已执行：`npm run build`
- 已执行：误导表达全文搜索

## 2. 结果

- `npm test` 通过。
  - 结果：`4` 个 test file 全部通过，`309` 个测试全部通过。
  - 关键覆盖：
    - `consoleDataSource.test.ts`
    - `consoleData.test.ts`
    - `routes.test.tsx`
    - 推荐 deployment/browser real-fetch smoke 路径
- `npm run build` 通过。
  - 结果：`tsc --noEmit -p tsconfig.app.json`、`tsc --noEmit -p tsconfig.node.json`、`vite build` 全部通过。
- security browser/deployment wrapper 死引用检查通过。
  - `console/src` 未再命中：
    - `ConsoleProvidersSecurityBrowserRuntimeInput`
    - `ConsoleProvidersSecurityDeploymentInput`
    - `securityBrowserRuntimeInput`
    - `securityDeploymentInput`
    - `resolveProvidersAuthHeadersResolverFromSecurityBrowserRuntimeInput(...)`
    - `resolveProvidersAuthHeadersResolverFromSecurityDeploymentInput(...)`
- 误导表达全文搜索符合约束。
  - `console/src` 命中仅出现在 `AppRoutes.tsx` 的“不提供 ...”语境。
  - `tasks/`、`qa/`、`delivery/` 命中位于 QA 检查项、验证记录或历史任务语境。

## 3. 结论

- 第三批减法已完成，browser/deployment 主链已不再保留额外 security 聚合层。
- 默认 mock 行为未回归，deployment/browser 推荐 real-fetch 入口保持可用。
- 当前若继续减法，应优先评估 auth/token browser/deployment wrapper 的真实使用价值，而不是回到 security wrapper 路线。
