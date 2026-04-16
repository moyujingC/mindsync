# RelayHub v1 Providers runtime bootstrap 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect / Test
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-17-v1-providers-runtime-bootstrap实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-17-v1-providers-runtime配置来源组合工厂-交付说明.md

这份任务文档用于把 `Providers` 的 config、env parser、source factory 与 datasource 串成 runtime bootstrap 最小装配层。

## 1. 任务目标

本轮目标是：

- 为 providers 新增独立 runtime bootstrap
- 把 source factory 与 datasource 组合成更上层装配入口
- 保持默认 providers 行为仍为 mock
- 为下一棒接真实部署配置预留 bootstrap 接线点

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- bootstrap 只服务 `Providers`
- 默认 bootstrap 固定返回 mock
- 不读取 `import.meta.env`、`process.env` 或全局配置
- 不新增认证字段命名决策
- 页面层与 `consoleData.ts` 对外接口保持不变

## 3. 本轮要做的实现

### 3.1 runtime bootstrap 层

要求：

- 新增 `ProvidersRuntimeBootstrapOptions`
- 新增 `ProvidersRuntimeBootstrap`
- 新增 `createProvidersRuntimeBootstrap(options?)`
- 新增 `getDefaultProvidersRuntimeBootstrap()`

### 3.2 默认 datasource 接入

要求：

- `mockConsoleDataSource.ts` 的默认 providers 拼装改经由 default bootstrap
- 保留 `createConsoleReadonlyDataSource({ providersSource })` 覆盖优先级
- bootstrap 不影响 `dashboard / environments / eval`

### 3.3 测试层

要求：

- 验证 default bootstrap 与默认 mock 行为等价
- 验证 static / env sourceFactoryOptions 可驱动 bootstrap
- 验证 env 缺少必要字段时 bootstrap 回退 mock
- 验证 bootstrap 不影响其他资源

## 4. 本轮明确不做

本轮不做：

- 读取真实环境变量
- 认证头字段决策
- runtime 自动切换
- 把 dashboard / environments / eval 纳入 bootstrap
- 任何真实控制动作

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- providers runtime bootstrap 已落位
- `npm test` 通过
- `npm run build` 通过
- 已补 QA 验证记录与交付说明
