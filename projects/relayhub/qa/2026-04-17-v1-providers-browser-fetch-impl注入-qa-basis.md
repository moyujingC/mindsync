# RelayHub v1 Providers browser fetch impl 注入 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-browser-fetch-impl注入-qa-basis.md
> 项目：RelayHub
> 阶段：qa

这份文档定义 `RelayHub` 控制台为 `Providers` 增加显式 browser fetch adapter 与 `fetchImpl` 注入入口后的验证口径。

## 1. 验证目标

确认控制台已经从“有 env deployment input source”推进到“有显式 browser fetch adapter 注入入口”，同时保持默认 mock、只读边界和公开 helper 稳定。

## 2. 核心验证点

### 2.1 browser fetch adapter

- `createProvidersBrowserFetchLike(...)` 会把 URL 与 `method / headers` 原样透传给底层 browser fetch
- adapter 返回值满足现有 `ProvidersFetchLike` 需要的 `status / headers / json`
- `getDefaultProvidersBrowserFetch()` 只提供显式 browser fetch 封装，不负责自动启用真实请求

### 2.2 env deployment 注入 helper

- `bootstrapConsoleEnvDeploymentRuntimeWithBrowserFetch(env, browserFetch)` 在完整 real-fetch 条件下可装配 Providers real-fetch datasource
- 缺少 browser fetch 或缺少 `baseUrl` 时仍回退 mock
- `bootstrapDefaultConsoleEnvDeploymentRuntime()` 继续保持 mock providers 行为

### 2.3 默认启动边界

- `main.tsx` 默认启动路径不自动注入 browser fetch
- `dashboard / environments / eval` 继续保持 mock-only
- Providers real-fetch 仍只在显式注入时生效

## 3. 自动化验证

在 `projects/relayhub/console` 执行：

- `npm install --cache .npm-cache`
- `npm test`
- `npm run build`

## 4. 误导表达检查

全文搜索：

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`

通过标准：

- 命中只能出现在“禁止 / 不提供”的说明语境中

## 5. 通过标准

- 新 browser fetch adapter 与显式注入 helper 已落位
- 默认 mock 行为未回归
- Providers real-fetch 仍需显式满足完整条件才进入
- 非 Providers 资源保持 mock-only
- 构建与测试全部通过
