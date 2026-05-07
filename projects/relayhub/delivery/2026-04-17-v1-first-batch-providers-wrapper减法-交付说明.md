# RelayHub v1 first batch Providers wrapper 减法 交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-first-batch-providers-wrapper减法-交付说明.md
> 项目：RelayHub
> 阶段：delivery

## 1. 本轮交付

- 删除 app runtime input/startup input wrapper。
- `ConsoleAppRuntime` 收敛回较低层 bootstrap 容器。
- 更新 Providers runtime 入口收敛说明。

## 2. 保持不变

- deployment/browser 推荐 real-fetch 主链不变。
- browser/deployment/security wrapper 暂不删除。
- auth/token composition factory 暂不删除。

## 3. 验证

- `npm test` 通过，`4` 个 test file、`325` 个测试全部通过。
- `npm run build` 通过，类型检查与前端构建全部通过。
- 误导表达全文搜索符合约束：
  - 源码命中仅保留在 `AppRoutes.tsx` 的“不提供 ...”文案。
  - 文档命中位于 QA 检查项或验证语境。

## 4. 残留边界

- 本轮只做第一批 app runtime wrapper 减法。
- 下一轮若继续减法，应先评估 browser/deployment/security wrapper 的真实使用价值。

## 5. 当前推荐路径

- services 层推荐继续使用 `ProvidersRuntimeConfigSourceFactoryOptions` 与已有 runtime bootstrap 主链。
- app 层推荐继续使用：
  - `ConsoleDeploymentRuntimeInput.env`
  - `ConsoleBrowserDeploymentRuntimeInput.browser-fetch`
  - `ConsoleBrowserDeploymentRuntimeInput.browser-fetch-source`
- `ConsoleAppRuntime` 现仅保留 bootstrap 容器职责，不再作为更高层 wrapper 扩展点。
