# RelayHub v1 Providers app runtime 启动接线实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-app-runtime启动接线实施任务.md
> 项目：RelayHub
> 阶段：task

这份任务用于把 `RelayHub` 控制台中已经完成的 `Providers runtime bootstrap` 再向上接一层，形成最小 `app runtime` 启动接线层。

## 1. 目标

本轮目标是让 `Providers` 的 runtime 链从：

- `config / env parser / source factory / runtime bootstrap`

推进到：

- `app startup -> app runtime bootstrap -> providers runtime bootstrap -> providers datasource`

同时继续保持：

- 默认仍走 mock
- 页面层与路由层不感知 runtime 接线
- `consoleData.ts` 对外 helper 保持稳定

## 2. 关键实现

### 2.1 app runtime 启动层

新增独立 app runtime 启动层，落位 `console/src/app/consoleAppRuntime.ts`，至少提供：

- `ConsoleAppRuntimeOptions`
- `ConsoleAppRuntime`
- `createConsoleAppRuntime(options?)`
- `bootstrapConsoleAppRuntime(options?)`
- `getDefaultConsoleAppRuntime()`

约束：

- `ConsoleAppRuntimeOptions` 只承载 `providersBootstrapOptions?`
- `providersBootstrapOptions` 直接复用现有 `ProvidersRuntimeBootstrapOptions`
- `ConsoleAppRuntime` 至少暴露 `dataSource: ConsoleReadonlyDataSource`

### 2.2 datasource 安装 seam

调整 `mockConsoleDataSource.ts`：

- 保留 `createConsoleReadonlyDataSource({ providersSource })`
- 保留 `defaultConsoleReadonlyDataSource`
- 保留 `getConsoleReadonlyDataSource()`
- 新增：
  - `setConsoleReadonlyDataSource(dataSource)`
  - `resetConsoleReadonlyDataSource()`

要求：

- 维护“当前默认 datasource”而不是只返回固定常量
- 默认值仍等价于当前 mock 路径

### 2.3 consoleData 读取方式

调整 `consoleData.ts`：

- 不再在模块初始化时缓存 datasource
- 每次 raw helper 调用时都通过 `getConsoleReadonlyDataSource()` 读取当前 datasource

保持不变：

- `getDashboardOverview()` / `listEnvironments()` / `getEnvironment()`
- `listProviders()` / `getProvider()`
- `getEvalOverview()`
- raw helper 与 readonly api helper 的公开语义

### 2.4 app startup 接线

调整 `main.tsx`：

- 在渲染前调用 `bootstrapConsoleAppRuntime()`
- 默认不传 options
- 不读取真实环境变量
- 不引入 React context / provider / props 注入

## 3. 本轮不做

- 不接真实部署配置
- 不读取 `import.meta.env` 或 `process.env`
- 不引入认证字段命名
- 不新增 runtime 自动切换
- 不把 runtime 能力扩到 `dashboard / environments / eval`
- 不新增真实控制动作

## 4. 验收要求

- `npm test` 通过
- `npm run build` 通过
- app runtime 默认行为仍与 mock 等价
- app runtime 可通过显式 options 切到 Providers real-fetch 路径
- 非 Providers 资源继续保持 mock-only
- 误导表达关键词命中仍只出现在“禁止 / 不提供”的说明语境中
