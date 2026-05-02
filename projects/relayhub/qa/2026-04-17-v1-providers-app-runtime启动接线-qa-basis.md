# RelayHub v1 Providers app runtime 启动接线 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-app-runtime启动接线-qa-basis.md
> 项目：RelayHub
> 阶段：qa

这份文档定义 `RelayHub` 控制台为 `Providers` 增加 app runtime 启动接线层后的验证口径。

## 1. 验证目标

确认控制台已经从“仅有 providers runtime bootstrap”推进到“app startup 可安装 providers runtime datasource”，同时保持默认 mock、只读边界和页面 helper 稳定。

## 2. 核心验证点

### 2.1 app runtime 装配

- `getDefaultConsoleAppRuntime()` 返回 mock providers 路径
- `createConsoleAppRuntime()` 默认行为与当前 mock datasource 等价
- `providersBootstrapOptions` 可驱动 static mock / static real-fetch / env real-fetch 装配
- env options 不完整时仍回落到 mock providers

### 2.2 datasource 安装 seam

- `bootstrapConsoleAppRuntime()` 可安装当前默认 datasource
- `consoleData.ts` 中的 `listProvidersRaw()` / `getProviderRaw()` 能读取安装后的 providers datasource
- `resetConsoleReadonlyDataSource()` 能恢复默认 mock 行为

### 2.3 资源边界

- app runtime 只影响 Providers
- `dashboard / environments / eval` 继续保持 mock-only
- 页面 helper、raw helper、readonly api helper 的对外函数名和返回语义不变

### 2.4 启动入口

- `main.tsx` 默认启动路径会调用 `bootstrapConsoleAppRuntime()`
- 默认启动不传 options，因此仍固定走 mock
- 不引入 context、provider 或页面 props 注入

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

- 新 app runtime 与 datasource 安装 seam 已落位
- 默认 mock 行为未回归
- Providers real-fetch 接线仍是显式 opt-in
- 非 Providers 资源保持 mock-only
- 构建与测试全部通过
