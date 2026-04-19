# RelayHub v1 Providers real-fetch readonly trial 验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-real-fetch-readonly-trial-验证记录.md
> 项目：RelayHub
> 阶段：verification

## 1. 待验证项

- `npm test`
- `npm run build`
- 推荐 deployment/browser real-fetch smoke
- 默认 mock 启动行为
- 误导表达全文搜索

## 2. 结果

- `npm test` 通过，`4` 个 test file、`310` 个测试全部通过。
- `npm run build` 通过，类型检查与前端构建全部通过。
- 推荐 deployment real-fetch smoke 继续通过：
  - `ConsoleDeploymentRuntimeInput.mode = "env"` 可完成 Providers collection / detail / not-found 验证。
- 推荐 browser real-fetch smoke 继续通过：
  - `ConsoleBrowserDeploymentRuntimeInput.mode = "browser-fetch"` 可验证 `defaultHeaders` 与显式 `authHeadersResolver` 注入。
  - `ConsoleBrowserDeploymentRuntimeInput.mode = "browser-fetch-source"` 可完成 Providers collection / detail / not-found 验证。
- real-fetch error 继续向上抛，不 fallback 到 mock。
- 默认 `bootstrapDefaultConsoleBrowserDeploymentRuntime()` 与默认 app runtime 仍保持 mock providers 行为。
- 误导表达全文搜索符合约束：
  - 源码与当前新增文档未引入新的误导性操作表达。
  - 历史命中继续位于 QA 检查项、验证记录、历史任务或“不提供”语境。
  - `console/dist/` 为构建产物，未纳入本轮提交边界。
