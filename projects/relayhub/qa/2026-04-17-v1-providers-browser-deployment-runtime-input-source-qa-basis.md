# RelayHub v1 Providers browser deployment runtime input source QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-browser-deployment-runtime-input-source-qa-basis.md
> 项目：RelayHub
> 阶段：qa

这份文档定义 `RelayHub` 控制台为 `Providers` 增加 browser deployment runtime input source 后的验证口径。

## 1. 验证目标

确认控制台已经从“有 browser fetch adapter + env deployment helper”推进到“有正式 browser runtime input source”，同时保持默认 mock、只读边界和公开 helper 稳定。

## 2. 核心验证点

### 2.1 browser runtime input source 映射

- `resolveConsoleEnvDeploymentRuntimeArgs()` 默认输入映射为默认 env 且不注入 browser fetch
- `default-mock` 输入与当前 mock 路径等价
- `browser-fetch` 输入只保留显式 `env + browserFetch`
- 这一层不重复解析 env key 语义

### 2.2 browser runtime 安装

- `bootstrapConsoleBrowserDeploymentRuntime(...)` 安装后的 providers datasource 能被 `consoleData.ts` helper 读到
- 完整 `browser-fetch` 输入可以进入 Providers real-fetch datasource
- 缺少 `browserFetch`、缺少 `baseUrl`、非法 env mode 时继续回到 mock
- `bootstrapDefaultConsoleBrowserDeploymentRuntime()` 继续保持 mock providers 行为

### 2.3 默认启动边界

- `main.tsx` 默认启动改经由 browser runtime input source
- 默认启动仍不自动注入 browser fetch
- `dashboard / environments / eval` 继续保持 mock-only

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

- 新 browser runtime input source 已落位
- 默认 mock 行为未回归
- Providers real-fetch 仍需显式满足完整条件才进入
- 非 Providers 资源保持 mock-only
- 构建与测试全部通过
