# RelayHub v1 third batch Providers wrapper 减法 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-third-batch-providers-wrapper减法实施任务.md
> 项目：RelayHub
> 阶段：implementation

## 1. 目标

- 删除 `security browser/deployment wrapper`。
- 把最后一层安全聚合收回 deployment/browser 主链。
- 保持 deployment/browser 推荐 real-fetch 主链不变。

## 2. 实施项

- 删除 `console/src/app/consoleProvidersSecurityBrowserRuntime.ts`。
- 删除 `console/src/app/consoleProvidersSecurityDeployment.ts`。
- 收敛 `console/src/app/consoleDeploymentRuntime.ts`：
  - 移除 `securityDeploymentInput?`
  - 移除对 `resolveProvidersAuthHeadersResolverFromSecurityDeploymentInput(...)` 的依赖
- 收敛 `console/src/app/consoleBrowserDeploymentRuntime.ts`：
  - 移除 `securityBrowserRuntimeInput?`
  - 移除对 `resolveProvidersAuthHeadersResolverFromSecurityBrowserRuntimeInput(...)` 的依赖
- 清理 `console/src/test/consoleDataSource.test.ts` 中 security browser/deployment wrapper 相关断言。
- 更新 `projects/relayhub/specs/2026-04-17-v1-providers-runtime入口收敛说明.md`。

## 3. 不变项

- 不删除 auth/token browser/deployment wrapper。
- 不删除 auth/token composition factory。
- 不修改 `main.tsx` 默认启动路径。
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
