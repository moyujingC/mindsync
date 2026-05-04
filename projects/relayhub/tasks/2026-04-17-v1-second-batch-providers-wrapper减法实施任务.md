# RelayHub v1 second batch Providers wrapper 减法 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-second-batch-providers-wrapper减法实施任务.md
> 项目：RelayHub
> 阶段：implementation

## 1. 目标

- 删除仅剩连续包装价值的 startup 层 security wrapper。
- 保持 deployment/browser 推荐 real-fetch 主链不变。
- 保持默认 startup 为 mock，不修改 `main.tsx`。

## 2. 实施项

- 删除 `console/src/app/consoleProvidersSecurityStartup.ts`。
- 收敛 `console/src/app/consoleEnvDeploymentRuntime.ts`：
  - 移除 `securityStartupInput?`
  - 移除对 `resolveProvidersAuthHeadersResolverFromSecurityStartupInput(...)` 的依赖
  - 仅保留显式 `authHeadersResolver?`
- 清理 `console/src/test/consoleDataSource.test.ts` 中 startup security wrapper 相关断言。
- 更新 `projects/relayhub/specs/2026-04-17-v1-providers-runtime入口收敛说明.md`。

## 3. 不变项

- 不删除 deployment/browser/security 主链 wrapper。
- 不删除 auth/token browser/deployment wrapper。
- 不删除 auth/token composition factory。
- 不修改 services 层 runtime config/source/factory/transport/datasource 主链。

## 4. 验证要求

- `npm test`
- `npm run build`
- 误导表达全文搜索：
  - `保存策略`
  - `立即切流`
  - `发布到生产`
  - `启用自动路由`
  - `编辑生产白名单`
  - `立即应用配置`
