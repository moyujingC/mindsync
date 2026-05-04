# RelayHub v1 third batch Providers wrapper 减法 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-third-batch-providers-wrapper减法-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 核心验收

- 删除 security browser/deployment wrapper 后，deployment/browser 默认 mock 行为不变。
- `ConsoleDeploymentRuntimeInput.env` 仍可通过现有低层 auth/token 输入装配 real-fetch datasource。
- `ConsoleBrowserDeploymentRuntimeInput.browser-fetch` / `browser-fetch-source` / `global-browser-fetch` 仍可通过现有低层 auth/token 输入装配 headers。
- 推荐 deployment/browser real-fetch smoke 测试继续通过。

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
