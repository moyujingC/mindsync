# RelayHub v1 Providers runtime 配置来源入口实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect / Test
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-17-v1-providers-runtime配置来源入口实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-17-v1-providers-runtime配置入口-交付说明.md

这份任务文档用于把 `Providers` 的 runtime config 继续推进到“显式 runtime 配置来源入口”。

## 1. 任务目标

本轮目标是：

- 为 providers 新增独立 runtime config source 层
- 把 runtime config object 与 config source 分开
- 保持默认 providers 行为仍为 mock
- 为下一棒接真实部署配置预留集中入口

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- runtime config source 只服务 `Providers`
- 默认 source 固定返回 mock config
- 不读取环境变量、URL 参数、本地存储或全局配置文件
- 不新增认证字段命名决策
- 页面层与 `consoleData.ts` 对外接口保持不变

## 3. 本轮要做的实现

### 3.1 runtime config source 层

要求：

- 新增 `ProvidersRuntimeConfigSource`
- 新增 `defaultProvidersRuntimeConfigSource`
- 新增 `createStaticProvidersRuntimeConfigSource(config?)`
- 新增 `resolveProvidersRuntimeConfigFromSource(source?)`

### 3.2 runtime datasource 接入

要求：

- 保留 `getProvidersRuntimeDataSource(config?)`
- 新增 `getProvidersRuntimeDataSourceFromConfigSource(source?)`
- `mockConsoleDataSource.ts` 的默认 providers 拼装改经由 runtime config source seam
- `createConsoleReadonlyDataSource({ providersSource })` 覆盖优先级保持最高

### 3.3 测试层

要求：

- 验证默认 source 返回 mock config
- 验证 static mock source 等价于默认 mock providers 行为
- 验证 static real-fetch source 能透传 `baseUrl / fetchImpl / defaultHeaders`
- 验证 real-fetch error 继续向上抛出

## 4. 本轮明确不做

本轮不做：

- 环境变量接入
- 认证头字段决策
- runtime 自动切换
- 把 dashboard / environments / eval 纳入 runtime config source
- 页面层感知 runtime config source
- 任何真实控制动作

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- providers runtime config source seam 已落位
- `npm test` 通过
- `npm run build` 通过
- 已补 QA 验证记录与交付说明
