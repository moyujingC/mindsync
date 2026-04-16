# RelayHub v1 Providers 最小真实 fetch transport 工厂 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-providers-最小真实fetch-transport工厂-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-providers-最小真实fetch-transport工厂实施任务.md

这份文档定义 `RelayHub` 控制台在为 `Providers` 试点补最小真实 fetch transport 工厂时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. providers 已具备可直接承接 HTTP 的 fetch transport 工厂
2. fetch transport 继续保持最小 JSON GET 语义
3. detail `404` 能在 facade 层归一化成 `not-found`
4. 页面与 service 对外接口保持不变

## 2. 验收标准

### 2.1 fetch transport 工厂

必须满足：

- 存在 `ProvidersFetchLike`
- 存在 `ProvidersReadonlyTransportConfig`
- 存在 `createRealProvidersFetchTransport(config)`
- 存在 `createRealProvidersFetchDataSource(config)`

### 2.2 行为稳定

必须满足：

- `204 / 404 / 非 2xx / 非法 JSON` 的 transport 行为明确
- detail `404` 会被 facade 映射为 `not-found`
- 默认 datasource 组合工厂与页面 helper 返回值不变

### 2.3 边界保持

必须满足：

- 不引入真实 API 地址
- 不引入写操作或真实控制动作
- 生产边界与只读边界不被改写

## 3. 验证方式

本轮至少执行：

1. `npm test`
2. `npm run build`
3. 误导表达全文搜索

## 4. 通过标准

只有同时满足下面条件，才允许宣布本轮完成：

- providers 最小真实 fetch transport 工厂已落位
- 自动化测试通过
- 构建通过
- `RelayHub` 项目边界未被改写
