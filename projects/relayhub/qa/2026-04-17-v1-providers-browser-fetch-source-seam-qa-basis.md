# RelayHub v1 Providers browser fetch source seam QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-browser-fetch-source-seam-qa-basis.md
> 项目：RelayHub
> 阶段：qa

这份文档定义 `RelayHub` 控制台为 `Providers` 增加 browser fetch source seam 后的验证口径。

## 1. 验证目标

确认控制台已经从“有 browser fetch adapter + browser runtime input source”推进到“有 browser fetch source seam”，同时保持默认 mock、只读边界和公开 helper 稳定。

## 2. 核心验证点

### 2.1 source seam 本身

- 默认 disabled source 返回 `undefined`
- 未传 source 时 resolver 返回 `undefined`
- static source 可返回显式 browser fetch
- static source 缺少 browser fetch 时返回 `undefined`
- global source 只有被显式创建并传入时才读取 `globalThis.fetch`

### 2.2 browser runtime 输入层接线

- `browser-fetch-source + env` 可装配 Providers real-fetch datasource
- source 解析为 `undefined` 时继续回到 mock
- 直接 `browser-fetch` 注入模式继续可用
- `bootstrapDefaultConsoleBrowserDeploymentRuntime()` 继续保持 mock providers 行为

### 2.3 默认启动边界

- `main.tsx` 默认启动路径不变更为真实请求
- `dashboard / environments / eval` 继续保持 mock-only
- Providers real-fetch 仍只在显式 source 或 browser fetch 注入时生效

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

- browser fetch source seam 已落位
- 默认 mock 行为未回归
- Providers real-fetch 仍需显式满足完整条件才进入
- 非 Providers 资源保持 mock-only
- 构建与测试全部通过
