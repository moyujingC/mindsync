# RelayHub v1 Providers 最小真实 fetch transport 工厂实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect / Test
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-providers-最小真实fetch-transport工厂实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-16-v1-providers-真实transport与wire-adapter-交付说明.md

这份任务文档用于把 `Providers` 的真实只读试点从“抽象 transport”继续推进到“最小真实 fetch transport 工厂”。

## 1. 任务目标

本轮目标是：

- 为 providers 真实试点补一个可直接接 HTTP 的 fetch transport 工厂
- 保持默认 datasource 仍不启用真实请求
- 为下一棒接真实 base URL 与认证方式预留稳定接缝

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- 本轮只推进 `Providers`
- fetch transport 继续服务现有 transport / adapter / facade 三层结构
- 页面层与 `consoleData.ts` 对外接口保持不变
- 不引入环境变量、鉴权和 runtime 自动切换

## 3. 本轮要做的实现

### 3.1 fetch transport 工厂

要求：

- 新增 `ProvidersFetchLike`
- 新增 `ProvidersReadonlyTransportConfig`
- 新增 `createRealProvidersFetchTransport(config)`
- 继续只支持 `GET /providers` 与 `GET /providers/:providerId`

### 3.2 最小 HTTP 行为

要求：

- URL 由 `baseUrl + path` 拼接
- `defaultHeaders` 原样透传
- `204` 返回 `data = null`
- `404` 返回 `data = null` 且保留 `statusCode = 404`
- 其他非 2xx 且非 404 状态抛明确错误
- 非法 JSON 抛明确错误

### 3.3 facade 归一化

要求：

- detail 场景下 `statusCode = 404 && data = null` 直接映射为 `not-found`
- collection 场景继续依赖 adapter 输出 `{ items }`
- adapter 不消费 HTTP status，仅负责 body 到 payload contract

### 3.4 组合 helper

要求：

- 新增 `createRealProvidersFetchDataSource(config)`
- 内部组合 fetch transport 与现有 datasource facade
- 默认 datasource 组合工厂继续保持 mock providers 行为

## 4. 本轮明确不做

本轮不做：

- 真实内网地址接入
- 环境变量与认证头字段决策
- runtime 自动切换
- payload 向后端正式 wire format 命名迁移
- 页面层感知真实 fetch transport
- 任何真实控制动作

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- providers 最小真实 fetch transport 工厂已落位
- `npm test` 通过
- `npm run build` 通过
- 已补 QA 验证记录与交付说明
