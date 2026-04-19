# RelayHub v1 Providers global browser fetch runtime option 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-17-v1-providers-global-browser-fetch-runtime-option实施任务.md
> 项目：RelayHub
> 阶段：task

这份任务用于把 `RelayHub` 控制台当前已经具备的 `browser fetch source seam` 再向启动输入层收束一步，新增显式 `global-browser-fetch` runtime option。

## 1. 目标

本轮目标是让调用方可以通过显式 runtime option 使用 `globalThis.fetch`，但默认启动仍保持 mock。

同时继续保持：

- 默认启动不自动读取 `globalThis.fetch`
- 页面层、路由层和 `consoleData.ts` 不感知 global browser fetch option
- 不引入认证字段决策

## 2. 关键实现

### 2.1 browser deployment runtime input 扩展

调整 `consoleBrowserDeploymentRuntime.ts`：

- `ConsoleBrowserDeploymentRuntimeInputMode` 新增 `global-browser-fetch`
- `ConsoleBrowserDeploymentRuntimeInput` 新增 `{ mode: "global-browser-fetch"; env }`
- 该模式内部复用 `createGlobalProvidersBrowserFetchSource()` 与 `resolveProvidersBrowserFetchFromSource(...)`

### 2.2 保持现有输入模式

保留：

- `browser-fetch` 直接注入模式
- `browser-fetch-source` source 注入模式
- `default-mock` 默认 mock 模式

### 2.3 默认启动边界

保持：

- `main.tsx` 继续调用 `bootstrapDefaultConsoleBrowserDeploymentRuntime()`
- 默认不自动使用 global source
- 没有显式 `global-browser-fetch` option 时，即使 env 为 `real-fetch` 也继续回到 mock

## 3. 本轮不做

- 不把 `globalThis.fetch` 接入默认启动
- 不新增认证字段、token resolver 或 header 命名
- 不新增自动切换、fallback、hybrid、canary
- 不把 global browser fetch option 扩展到 `dashboard / environments / eval`
- 不新增任何真实控制动作

## 4. 验收要求

- `npm test` 通过
- `npm run build` 通过
- `global-browser-fetch + env` 在完整 real-fetch 条件下可装配 Providers real-fetch datasource
- `global-browser-fetch` 缺少 `baseUrl` 或 env 非法时继续回到 mock
- 默认启动仍不读取或注入 global fetch
- 误导表达关键词命中仍只出现在“禁止 / 不提供”的说明语境中
