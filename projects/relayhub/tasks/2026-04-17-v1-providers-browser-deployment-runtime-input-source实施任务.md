# RelayHub v1 Providers browser deployment runtime input source 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-17-v1-providers-browser-deployment-runtime-input-source实施任务.md
> 项目：RelayHub
> 阶段：task

这份任务用于把 `RelayHub` 控制台当前已经具备的 `browser fetch adapter + env deployment helper` 再向前推进到“显式 browser deployment runtime input source”。

## 1. 目标

本轮目标是让 `Providers` 的启动链在保留默认 mock 行为的前提下，具备更正式的 browser 侧运行时输入层。

同时继续保持：

- 默认启动仍走 mock
- 页面层、路由层和 `consoleData.ts` 不感知 browser runtime input source
- 不引入认证字段决策

## 2. 关键实现

### 2.1 browser deployment runtime input source

在 `console/src/app/consoleBrowserDeploymentRuntime.ts` 新增：

- `ConsoleBrowserDeploymentRuntimeInputMode`
- `ConsoleBrowserDeploymentRuntimeInput`
- `resolveConsoleEnvDeploymentRuntimeArgs(input?)`
- `bootstrapConsoleBrowserDeploymentRuntime(input?)`
- `bootstrapDefaultConsoleBrowserDeploymentRuntime()`

要求：

- `default-mock` 只映射到默认 env 路径，不注入 browser fetch
- `browser-fetch` 只接受显式 `env + browserFetch`
- 这一层只做输入装配，不重复实现 env key 解析

### 2.2 默认启动接线

调整 `main.tsx`：

- 默认启动改为调用 `bootstrapDefaultConsoleBrowserDeploymentRuntime()`
- 默认仍不得自动注入 browser fetch
- 因此默认行为继续等价于当前 mock providers 路径

### 2.3 既有层级边界

保持：

- `consoleBrowserFetch.ts` 只负责 `browser fetch -> ProvidersFetchLike`
- `consoleEnvDeploymentRuntime.ts` 继续负责 `env -> deployment runtime input`
- `consoleDeploymentRuntime.ts` 继续负责 `deployment runtime input -> app runtime`

## 3. 本轮不做

- 不自动读取 `globalThis.fetch`
- 不新增认证字段、token resolver 或 header 命名
- 不新增自动切换、fallback、hybrid、canary
- 不把 browser runtime input source 扩展到 `dashboard / environments / eval`
- 不新增任何真实控制动作

## 4. 验收要求

- `npm test` 通过
- `npm run build` 通过
- browser runtime input source 默认继续走 mock
- 显式 `env + browserFetch` 输入可以进入 Providers real-fetch 路径
- 缺少 `browserFetch` 或缺少 `baseUrl` 时继续回到 mock
- 误导表达关键词命中仍只出现在“禁止 / 不提供”的说明语境中
