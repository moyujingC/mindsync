# RelayHub v1 first batch Providers wrapper 减法 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-first-batch-providers-wrapper减法-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 目标

验证第一批 app runtime wrapper 删除后，推荐入口与默认 mock 行为不回归。

## 2. 必测场景

1. `ConsoleAppRuntimeOptions` 收敛后默认 mock 行为不变。
2. `createConsoleAppRuntime()` 默认行为仍为 mock。
3. `providersBootstrapOptions` 可继续驱动 static mock / static real-fetch / env real-fetch。
4. `providersBootstrapOptions` 仍高于 `providersBootstrapInput`。
5. 推荐 deployment/browser real-fetch smoke 测试继续通过。
6. app runtime input/startup input 相关旧测试已被一并清理，不留失效兼容断言。
7. `consoleDataSource.test.ts`、`consoleData.test.ts`、`routes.test.tsx` 全部继续通过。

## 3. 验证命令

- `npm test`
- `npm run build`
- 误导表达全文搜索：
  - `保存策略`
  - `立即切流`
  - `发布到生产`
  - `启用自动路由`
  - `编辑生产白名单`
  - `立即应用配置`

## 4. 通过标准

- 自动化测试与构建全部通过。
- 删除 app runtime wrapper 后，默认 mock 与推荐 real-fetch 主链不回归。
