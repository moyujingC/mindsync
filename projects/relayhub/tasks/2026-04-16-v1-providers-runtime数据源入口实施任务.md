# RelayHub v1 Providers runtime 数据源入口实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect / Test
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-providers-runtime数据源入口实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-16-v1-providers-最小真实fetch-transport工厂-交付说明.md

这份任务文档用于把 `Providers` 的真实只读试点从“已具备 fetch transport 工厂”继续推进到“默认关闭的 runtime 数据源入口”。

## 1. 任务目标

本轮目标是：

- 为 providers 新增独立 runtime 数据源入口
- 保持默认行为仍为 mock providers
- 给下一棒接真实 providers source 提供一个单一切换点

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- runtime seam 只服务 `Providers`
- runtime seam 默认固定为 `mock`
- 不读取环境变量、URL 参数、本地存储或全局配置文件
- 页面层与 `consoleData.ts` 对外接口保持不变

## 3. 本轮要做的实现

### 3.1 runtime seam

要求：

- 新增 `ProvidersRuntimeMode`
- 新增 `ProvidersRuntimeDataSourceOptions`
- 新增 `createProvidersRuntimeDataSource(options)`
- 新增 `getProvidersRuntimeDataSource(options?)`

### 3.2 模式行为

要求：

- `mode = "mock"` 时复用 `mockProvidersReadonlyDataSource`
- `mode = "real-fetch"` 时复用 `createRealProvidersFetchDataSource(config)`
- runtime seam 不做 fallback，不自动从 real-fetch 回退到 mock

### 3.3 datasource 组合接入

要求：

- `mockConsoleDataSource.ts` 的 providers 默认拼装改经由 runtime seam
- `createConsoleReadonlyDataSource({ providersSource })` 现有接口保持不变
- 显式 `providersSource` 覆盖优先级仍高于 runtime seam 默认值

### 3.4 测试层

要求：

- 补默认 runtime seam 为 mock 的验证
- 补 `mock / real-fetch` 两种 runtime mode 验证
- 补显式 override 优先级验证
- 补 real-fetch error 继续向上抛出的验证

## 4. 本轮明确不做

本轮不做：

- 环境变量接入
- 认证头字段决策
- runtime 自动切换
- 把 dashboard / environments / eval 一起纳入 runtime seam
- 页面层感知 runtime mode
- 任何真实控制动作

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- providers runtime 数据源入口已落位
- `npm test` 通过
- `npm run build` 通过
- 已补 QA 验证记录与交付说明
