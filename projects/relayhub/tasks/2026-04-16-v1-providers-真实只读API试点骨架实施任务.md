# RelayHub v1 Providers 真实只读 API 试点骨架实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect / Test
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-providers-真实只读API试点骨架实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-16-v1-资源级只读数据源接口-交付说明.md

这份任务文档用于把 `Providers` 作为 `RelayHub` 控制台首个真实只读 API 试点资源，先落 datasource 切换骨架。

## 1. 任务目标

本轮目标是：

- 为 providers 试点新增可替换的数据源骨架
- 让 datasource 层从“单一 mock 默认实现”推进到“按资源组合”
- 保持 providers 页面、路由和 service 对外接口完全不变
- 为下一棒接真实 providers 只读 API 预留稳定切换点

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- 本轮只以 `Providers` 为试点，不同时推进其他资源
- 本轮只做到切换骨架，不发真实 HTTP 请求
- providers 试点实现可用本地 stub 表达，不引入环境变量或 runtime 自动选择
- 返回值继续使用当前 `ProviderCollectionContract / ProviderDetailContract`

## 3. 本轮要做的实现

### 3.1 datasource 组合工厂

要求：

- 在 datasource 层新增组合工厂，例如 `createConsoleReadonlyDataSource`
- 默认组合保持 dashboard / environments / providers / eval 全部来自 mock
- 允许单独替换 providers source

### 3.2 providers 试点骨架

要求：

- 新增 `realProvidersDataSource.ts`
- 仅覆盖 `listProviders` 与 `getProvider`
- 用本地 stub 表达未来真实只读 API 的插拔点
- 保持 `meta.filters / empty / not-found` 语义稳定

### 3.3 测试层

要求：

- 扩展 datasource 层测试，验证默认行为与 providers source 替换行为
- 至少覆盖 providers 列表、详情、empty、not-found、filters
- 现有 service / route 测试继续通过

## 4. 本轮明确不做

本轮不做：

- 真实 HTTP 请求
- providers payload 向后端 wire format 命名迁移
- runtime 自动切换或环境变量切换
- 页面层感知试点切换
- 任何真实控制动作

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- providers 试点骨架已落位
- datasource 组合工厂已可替换 providers source
- `npm test` 通过
- `npm run build` 通过
- 已补 QA 验证记录与交付说明
