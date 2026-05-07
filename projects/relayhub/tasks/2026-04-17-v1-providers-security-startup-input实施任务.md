# 2026-04-17 v1 Providers Security Startup Input 实施任务

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-security-startup-input实施任务.md

## 目标

在 `Console` app startup 层新增统一安全输入装配入口，把 startup 附近仍分散的 deployment/browser 安全入口收束成单一高层输入对象，同时保持默认启动为 disabled/mock。

## 实施要求

- 新增 `console/src/app/consoleProvidersSecurityStartup.ts`
- 定义：
  - `ConsoleProvidersSecurityStartupInputMode`
  - `ConsoleProvidersSecurityStartupInput`
  - `resolveProvidersAuthHeadersResolverFromSecurityStartupInput(input?)`
- 扩展：
  - `resolveConsoleDeploymentRuntimeInputFromEnv(env, fetchImpl?, authHeadersResolver?, securityStartupInput?)`
  - `bootstrapConsoleEnvDeploymentRuntime(env, fetchImpl?, authHeadersResolver?, securityStartupInput?)`
  - `bootstrapConsoleEnvDeploymentRuntimeWithBrowserFetch(env, browserFetch?, authHeadersResolver?, securityStartupInput?)`
- startup helper 在显式传入 `authHeadersResolver` 时继续优先使用它；只有未显式传入 resolver 时，才使用 `securityStartupInput?`
- `main.tsx` 默认路径不注入 `securityStartupInput`

## 约束

- 不新增 auth env key
- 不引入 refresh、cache、expiry、credential store
- 不改默认启动行为
- 不扩到 `dashboard / environments / eval`
- 不新增真实控制动作或自动真实请求

## 验证要求

- 补齐 unified security startup input 单测
- `npm test` 通过
- `npm run build` 通过
- 误导表达全文搜索命中只能出现在“不提供 / 禁止 / QA检查项”语境中
