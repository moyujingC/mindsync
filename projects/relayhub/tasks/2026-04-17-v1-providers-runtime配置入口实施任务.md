# RelayHub v1 Providers runtime 配置入口实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect / Test
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-runtime配置入口实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：projects/relayhub/delivery/2026-04-16-v1-providers-runtime数据源入口-交付说明.md

这份任务文档用于把 `Providers` 的 runtime 数据源入口继续推进到“显式 runtime 配置解析入口”。

## 1. 任务目标

本轮目标是：

- 新增 Providers 专用 runtime config 层
- 把 runtime config 解析与 datasource 构造分开
- 保持默认 providers 行为仍为 mock
- 为下一棒接真实内网只读 API 预留集中配置入口

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- runtime config 只服务 `Providers`
- 默认配置固定为 `mock`
- 不读取环境变量、URL 参数、本地存储或全局配置文件
- 不新增认证字段命名决策
- 页面层与 `consoleData.ts` 对外接口保持不变

## 3. 本轮要做的实现

### 3.1 runtime config 层

要求：

- 新增 `ProvidersRuntimeConfigMode`
- 新增 `ProvidersRuntimeConfig`
- 新增 `getDefaultProvidersRuntimeConfig()`
- 新增 `resolveProvidersRuntimeDataSourceOptions(config?)`

### 3.2 runtime datasource 接入

要求：

- `createProvidersRuntimeDataSource(options)` 继续接收已解析 datasource options
- `getProvidersRuntimeDataSource(config?)` 通过 config resolver 得到 datasource options
- `real-fetch` config 只允许显式传入 `baseUrl / fetchImpl / defaultHeaders?`

### 3.3 测试层

要求：

- 验证默认 config 解析为 mock
- 验证 mock config 等价于当前默认 providers 行为
- 验证 real-fetch config 会透传 `baseUrl / fetchImpl / defaultHeaders`
- 验证 real-fetch 错误不 fallback

## 4. 本轮明确不做

本轮不做：

- 环境变量接入
- 认证头字段决策
- runtime 自动切换
- 把 dashboard / environments / eval 纳入 runtime config
- 页面层感知 runtime config
- 任何真实控制动作

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- providers runtime config 解析入口已落位
- `npm test` 通过
- `npm run build` 通过
- 已补 QA 验证记录与交付说明
