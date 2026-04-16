# RelayHub v1 Providers runtime 配置来源组合工厂实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect / Test
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-17-v1-providers-runtime配置来源组合工厂实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-17-v1-providers-env-runtime配置解析器-交付说明.md

这份任务文档用于把 `Providers` 的 static source 与 env parser source 收束成 runtime config source 组合工厂。

## 1. 任务目标

本轮目标是：

- 为 providers 新增独立 runtime config source factory
- 统一 default mock、static、env 三类 source 创建入口
- 保持默认 providers 行为仍为 mock
- 为下一棒接真实部署配置预留集中组合入口

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- source factory 只服务 `Providers`
- 默认 factory 固定返回 mock source
- 不读取环境变量、URL 参数、本地存储或全局配置文件
- 不新增认证字段命名决策
- 页面层与 `consoleData.ts` 对外接口保持不变

## 3. 本轮要做的实现

### 3.1 source factory 层

要求：

- 新增 `ProvidersRuntimeConfigSourceMode`
- 新增 `ProvidersRuntimeConfigSourceFactoryOptions`
- 新增 `createProvidersRuntimeConfigSource(options?)`

### 3.2 runtime datasource 接入

要求：

- 保留 `getProvidersRuntimeDataSourceFromConfigSource(source?)`
- 新增 `getProvidersRuntimeDataSourceFromFactory(options?)`
- `mockConsoleDataSource.ts` 的默认 providers 拼装改经由 factory 默认 source
- `createConsoleReadonlyDataSource({ providersSource })` 覆盖优先级保持最高

### 3.3 测试层

要求：

- 验证默认 factory 与 default-mock 模式返回 mock source
- 验证 static mock / static real-fetch source
- 验证 env real-fetch source 与 env 回退 mock
- 验证默认 datasource 行为仍为 mock

## 4. 本轮明确不做

本轮不做：

- 把 env parser 接入默认 source
- 读取真实环境变量
- 认证头字段决策
- runtime 自动切换
- 把 dashboard / environments / eval 纳入 source factory
- 任何真实控制动作

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- providers runtime config source factory 已落位
- `npm test` 通过
- `npm run build` 通过
- 已补 QA 验证记录与交付说明
