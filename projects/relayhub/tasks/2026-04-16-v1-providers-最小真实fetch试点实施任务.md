# RelayHub v1 Providers 最小真实 fetch 试点实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect / Test
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/tasks/2026-04-16-v1-providers-最小真实fetch试点实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：projects/relayhub/delivery/2026-04-16-v1-providers-真实只读API试点骨架-交付说明.md

这份任务文档用于把 `Providers` 试点骨架继续推进到“最小真实 fetch 方案”。

## 1. 任务目标

本轮目标是：

- 为 providers 真实试点补齐 request input、URL 组装和 contract adapter
- 让 `realProvidersDataSource.ts` 从静态 stub 升级成可注入 request 的真实请求形态
- 保持默认 datasource 仍不启用真实请求
- 保持页面层和 `consoleData` 对外接口不变

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- 本轮只推进 `Providers`
- 本轮默认不发真实网络请求
- request 层通过显式依赖注入进入 datasource
- 返回值继续使用当前 providers contract

## 3. 本轮要做的实现

### 3.1 request / URL 骨架

要求：

- 新增 `ProvidersReadonlyRequest`
- request input 至少包含 `resource / scope / path / providerId? / filters? / forceError?`
- 新增 collection 与 detail 的 URL builder

### 3.2 datasource facade

要求：

- 新增 `createRealProvidersReadonlyDataSource(request)`
- facade 负责把 request payload 适配成 `ProviderCollectionContract / ProviderDetailContract`
- 保持 `filters / empty / not-found` 语义稳定

### 3.3 测试层

要求：

- 新增 URL builder 测试
- 新增 request input 与错误透传测试
- 现有 datasource 组合工厂测试继续通过

## 4. 本轮明确不做

本轮不做：

- 真实 HTTP 地址接入
- 认证与环境变量配置
- payload 向后端 wire format 命名迁移
- 页面层感知真实请求
- 任何真实控制动作

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- `realProvidersDataSource.ts` 已具备最小真实 request 形态
- `npm test` 通过
- `npm run build` 通过
- 已补 QA 验证记录与交付说明
