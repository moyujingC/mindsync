# RelayHub v1 Providers env deployment input source 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-17-v1-providers-env-deployment-input-source实施任务.md
> 项目：RelayHub
> 阶段：task

这份任务用于把 `RelayHub` 控制台当前已经具备的 `deployment runtime input` 再向上推进到“真实前端 env deployment input source”。

## 1. 目标

本轮目标是让 `Providers` 的启动链从：

- `app startup -> deployment runtime input -> console app runtime`

推进到：

- `app startup -> env deployment input source -> deployment runtime input -> console app runtime`

同时继续保持：

- 默认仍走 mock
- 页面层、路由层和 `consoleData.ts` 不感知 env source
- 不引入认证注入契约

## 2. 关键实现

### 2.1 env deployment input source

在 `console/src/app/consoleEnvDeploymentRuntime.ts` 新增：

- `ConsoleDeploymentRuntimeEnv`
- `getDefaultConsoleDeploymentRuntimeEnv()`
- `resolveConsoleDeploymentRuntimeInputFromEnv(env, fetchImpl?)`
- `bootstrapConsoleEnvDeploymentRuntime(env, fetchImpl?)`
- `bootstrapDefaultConsoleEnvDeploymentRuntime()`

要求：

- `ConsoleDeploymentRuntimeEnv` 只承载当前 Providers 已有 env key
- env source 只负责把真实前端 env 映射成现有 `ConsoleDeploymentRuntimeInput`
- `bootstrapConsoleEnvDeploymentRuntime(...)` 内部调用现有 `bootstrapConsoleDeploymentRuntime(...)`

### 2.2 默认启动接线

调整 `main.tsx`：

- 默认启动改为调用 `bootstrapDefaultConsoleEnvDeploymentRuntime()`
- 允许读取 `import.meta.env`
- 但由于默认没有显式 `fetchImpl` 注入，启动结果仍固定回落到 mock providers

### 2.3 Vite env typing

补最小 `vite-env.d.ts` 或等价声明：

- 只声明本轮实际读取的 Providers env key
- 不新增认证字段或其他资源级 env key

## 3. 本轮不做

- 不读取 `process.env`
- 不引入认证字段或 token/provider/auth resolver
- 不新增自动切换、fallback、hybrid、canary
- 不把 env source 扩到 `dashboard / environments / eval`
- 不新增任何真实控制动作

## 4. 验收要求

- `npm test` 通过
- `npm run build` 通过
- 缺失 env、mock env、非法 env mode 都会回到 mock
- 完整 `real-fetch + baseUrl + fetchImpl` 可以进入 env deployment runtime 路径
- 默认 env 启动路径在无显式 `fetchImpl` 时保持 mock
- 误导表达关键词命中仍只出现在“禁止 / 不提供”的说明语境中
