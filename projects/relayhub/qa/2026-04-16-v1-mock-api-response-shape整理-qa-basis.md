# RelayHub v1 mock API response shape 整理 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/qa/2026-04-16-v1-mock-api-response-shape整理-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：projects/relayhub/tasks/2026-04-16-v1-mock-api-response-shape整理实施任务.md

这份文档定义 `RelayHub` 控制台在整理 mock API response shape 时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. mock API 对外返回统一 envelope
2. service 层成功解包，页面层无需改消费心智
3. 不改变环境边界和只读边界
4. service 级自动化测试可覆盖关键解包路径

## 2. 验收标准

### 2.1 response shape

必须满足：

- 列表接口返回 `items`
- 单项详情返回 `item`
- 聚合页返回 `overview`
- response 中包含统一 `meta`

### 2.2 service 行为

必须满足：

- `getDashboardOverview()` 仍返回页面所需 overview
- `getEnvironment(id)` 在未命中时仍返回 `null`
- `listProviders(filters)` 仍保留过滤结果
- `getEvalOverview()` 仍返回页面所需 overview

### 2.3 边界保持

必须满足：

- 页面仍不出现真实控制动作
- 心理疗愈生产版“只允许国产模型”的表达不被改写
- 不引入真实网络请求

## 3. 验证方式

本轮至少执行：

1. `npm test`
2. `npm run build`
3. 误导表达全文搜索

## 4. 通过标准

只有同时满足下面条件，才允许宣布本轮完成：

- service 级测试通过
- 原有路由测试通过
- 构建通过
- 只读边界未被改写
