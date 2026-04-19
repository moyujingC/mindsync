# RelayHub v1 Providers 真实 transport 与 wire adapter 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect / Test
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-providers-真实transport与wire-adapter实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-16-v1-providers-最小真实fetch试点-交付说明.md

这份任务文档用于把 `Providers` 的真实只读试点从“最小真实 fetch 形态”继续推进到“transport + wire adapter + facade”三层结构。

## 1. 任务目标

本轮目标是：

- 为 providers 真实试点抽出独立 transport 层
- 为真实响应 body 抽出独立 wire adapter 层
- 保持 facade 继续负责 contract 语义收口
- 保持默认 datasource 仍不启用真实请求

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- 本轮只推进 `Providers`
- transport 继续通过显式依赖注入进入 datasource
- wire adapter 只服务真实响应到 contract payload 的映射
- 页面层与 `consoleData.ts` 对外接口保持不变

## 3. 本轮要做的实现

### 3.1 transport 层

要求：

- 新增 `ProvidersReadonlyTransportRequest`
- 新增 `ProvidersReadonlyTransportResponse`
- transport 继续使用 `resource / scope / path / providerId? / filters? / forceError?`
- 不引入环境变量、fetch client 或 runtime 自动切换

### 3.2 wire adapter 层

要求：

- 新增 collection / detail wire adapter
- adapter 接收 `unknown` body
- adapter 输出 `{ items }` 或 `{ item }`
- adapter 在 payload 不符合最小预期时抛明确错误

### 3.3 facade 编排层

要求：

- `createRealProvidersReadonlyDataSource(...)` 改为对象参数
- facade 通过 transport 获取 body，再通过 adapter 转成 payload contract
- facade 继续负责 `ready / empty / not-found` 语义

### 3.4 测试层

要求：

- 补 transport request 验证
- 补 wire adapter 正常与异常验证
- 补 facade 的 transport error / adapter error 验证
- 现有 datasource 组合测试继续通过

## 4. 本轮明确不做

本轮不做：

- 真实内网地址接入
- 环境变量与认证头
- payload 向后端正式 wire format 命名迁移
- 页面层感知 transport 或 wire payload
- 任何真实控制动作

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- providers transport 与 wire adapter 已独立落位
- `npm test` 通过
- `npm run build` 通过
- 已补 QA 验证记录与交付说明
