# RelayHub v1 third batch Providers wrapper 减法 交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-third-batch-providers-wrapper减法-交付说明.md
> 项目：RelayHub
> 阶段：delivery

## 1. 本轮交付

- 删除 security browser/deployment wrapper。
- browser/deployment 主链收回最后一层 security 聚合职责。
- 更新 Providers runtime 入口收敛说明。

## 2. 保持不变

- deployment/browser 推荐 real-fetch 主链不变。
- auth/token browser/deployment wrapper 暂不删除。
- auth/token composition factory 暂不删除。

## 3. 验证

- `npm test` 通过，`4` 个 test file、`309` 个测试全部通过。
- `npm run build` 通过，类型检查与前端构建全部通过。
- security browser/deployment wrapper 的源码死引用已清零。
- 误导表达全文搜索符合约束：
  - 源码命中仅保留在 `AppRoutes.tsx` 的“不提供 ...”文案。
  - 文档命中位于 QA 检查项、验证记录或历史任务语境。

## 4. 残留边界

- 本轮只做 security browser/deployment wrapper 减法。
- 下一轮若继续减法，应优先评估 auth/token browser/deployment wrapper 的真实使用价值。

## 5. 当前推荐路径

- browser/deployment 主链现在直接承接安全解析，不再额外经过 security wrapper。
- app 层推荐继续使用：
  - `ConsoleDeploymentRuntimeInput.env`
  - `ConsoleBrowserDeploymentRuntimeInput.browser-fetch`
  - `ConsoleBrowserDeploymentRuntimeInput.browser-fetch-source`
- 若后续继续减法，应优先收敛 auth/token wrapper，而不是重新引入新的 security 聚合层。
