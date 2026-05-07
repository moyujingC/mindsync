# 2026-04-17 v1 Providers Security Startup Input 交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-providers-security-startup-input-交付说明.md


## 交付内容

- 新增 startup helper 级统一安全输入装配层
- 保持现有 security deployment / security browser 低层输入兼容
- 保持默认启动为 mock/disabled

## 交付边界

- 本轮只收束 startup helper 层
- 不新增 auth env key
- 不引入 refresh、cache、expiry、credential store
- 不扩到 `dashboard / environments / eval`

## 验证

- `npm test` 通过，4 个测试文件、313 个测试全部通过
- `npm run build` 通过
- startup helper 显式 `authHeadersResolver` 仍保持最高优先级
- `securityStartupInput` 仅在未显式传入 resolver 时参与装配
- 默认 `bootstrapDefaultConsoleEnvDeploymentRuntime()` 与 `bootstrapDefaultConsoleBrowserDeploymentRuntime()` 继续保持 mock providers 行为
- `main.tsx` 默认启动路径未注入 `securityStartupInput`，不会自动读取 global auth/token 能力
