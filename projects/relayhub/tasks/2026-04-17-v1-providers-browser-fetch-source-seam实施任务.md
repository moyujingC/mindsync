# RelayHub v1 Providers browser fetch source seam 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-browser-fetch-source-seam实施任务.md
> 项目：RelayHub
> 阶段：task

这份任务用于把 `RelayHub` 控制台当前已经具备的 `browser fetch adapter + browser deployment runtime input source` 再向前推进到“browser fetch source seam”。

## 1. 目标

本轮目标是给 `Providers` 补一个集中、可测试的 browser fetch 来源入口，同时继续保持默认 mock 行为。

同时继续保持：

- 默认启动仍走 mock
- 页面层、路由层和 `consoleData.ts` 不感知 browser fetch source seam
- 不引入认证字段决策

## 2. 关键实现

### 2.1 browser fetch source seam

在 `console/src/app/consoleBrowserFetchSource.ts` 新增：

- `ProvidersBrowserFetchSource`
- `defaultDisabledProvidersBrowserFetchSource`
- `createStaticProvidersBrowserFetchSource(browserFetch?)`
- `createGlobalProvidersBrowserFetchSource()`
- `resolveProvidersBrowserFetchFromSource(source?)`

要求：

- 默认 source 固定返回 `undefined`
- global source 只在被显式创建并传入时才读取 `globalThis.fetch`
- source seam 只负责来源解析，不负责 env 或 runtime mode

### 2.2 browser runtime 输入层扩展

调整 `consoleBrowserDeploymentRuntime.ts`：

- 保留现有 `browser-fetch` 直接注入模式
- 新增 `browser-fetch-source` 模式
- `browser-fetch-source` 只接受显式 `env + browserFetchSource`
- source 解析后继续复用现有 env deployment runtime helper

### 2.3 默认启动边界

保持：

- `main.tsx` 继续调用 `bootstrapDefaultConsoleBrowserDeploymentRuntime()`
- 默认不自动使用 global source
- 没有显式 browser fetch source 或 browser fetch 注入时，即使 env 为 `real-fetch` 也继续回到 mock

## 3. 本轮不做

- 不把 `globalThis.fetch` 接入默认启动
- 不新增认证字段、token resolver 或 header 命名
- 不新增自动切换、fallback、hybrid、canary
- 不把 browser fetch source seam 扩展到 `dashboard / environments / eval`
- 不新增任何真实控制动作

## 4. 验收要求

- `npm test` 通过
- `npm run build` 通过
- 默认 disabled source 返回 `undefined`
- 显式 static/global source 可驱动 `browser-fetch-source` 输入模式
- source 缺失或解析为 `undefined` 时继续回到 mock
- 误导表达关键词命中仍只出现在“禁止 / 不提供”的说明语境中
