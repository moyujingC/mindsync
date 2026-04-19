# RelayHub v1 Providers deployment runtime input QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-deployment-runtime-input-qa-basis.md
> 项目：RelayHub
> 阶段：qa

这份文档定义 `RelayHub` 控制台为 `Providers` 增加 deployment runtime input 装配层后的验证口径。

## 1. 验证目标

确认控制台已经从“有 console app runtime 启动层”推进到“有更高层 deployment runtime input 装配层”，同时保持默认 mock、只读边界和公开 helper 稳定。

## 2. 核心验证点

### 2.1 deployment input 映射

- `resolveConsoleAppRuntimeOptions()` 默认输入映射为空 runtime options
- `default-mock` deployment input 与当前默认 mock 行为等价
- `static` deployment input 可映射到 static mock / static real-fetch providers
- `env` deployment input 可映射到 env real-fetch providers
- env 输入缺失必要字段时继续回落到 mock

### 2.2 deployment bootstrap 安装

- `bootstrapConsoleDeploymentRuntime()` 能安装当前 providers datasource
- 安装后的 providers datasource 能被 `consoleData.ts` helper 读到
- 非 Providers 资源继续保持 mock-only

### 2.3 默认启动接线

- `main.tsx` 默认启动路径已改为调用 `bootstrapConsoleDeploymentRuntime()`
- 默认不传 input，因此行为仍固定为 mock
- 页面层与路由层不感知 deployment input

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

- 新 deployment input 层已落位
- 默认 mock 行为未回归
- Providers real-fetch 仍是显式 opt-in
- 非 Providers 资源保持 mock-only
- 构建与测试全部通过
