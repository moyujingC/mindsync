# 2026-04-17 v1 Providers Security Deployment Input 实施任务

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-security-deployment-input实施任务.md

## 目标

在 `Console` app 层新增 deployment 级统一安全输入装配入口，把 `ConsoleDeploymentRuntimeInput["env"]` 中分散的 auth/token 输入收束成单一高层输入对象，同时保持默认启动为 disabled/mock。

## 实施要求

- 新增 `console/src/app/consoleProvidersSecurityDeployment.ts`
- 定义：
  - `ConsoleProvidersSecurityDeploymentInputMode`
  - `ConsoleProvidersSecurityDeploymentInput`
  - `resolveProvidersAuthHeadersResolverFromSecurityDeploymentInput(input?)`
- `ConsoleDeploymentRuntimeInput["env"]` 增加 `securityDeploymentInput?`
- `resolveConsoleAppRuntimeOptions(...)` 中把 `securityDeploymentInput?` 放在 deployment 层现有 auth/token 所有输入之后作为最后一层装配入口
- services 层不新增 `securityDeploymentInput` 概念，最终仍只向下传 `authHeadersResolver`

## 约束

- 不新增 auth env key
- 不引入 refresh、cache、expiry、credential store
- 不改默认启动路径
- 不扩到 `dashboard / environments / eval`
- 不新增真实控制动作或自动真实请求

## 验证要求

- 补齐 unified security deployment input 单测
- `npm test` 通过
- `npm run build` 通过
- 误导表达全文搜索命中只能出现在“不提供 / 禁止 / QA检查项”语境中
