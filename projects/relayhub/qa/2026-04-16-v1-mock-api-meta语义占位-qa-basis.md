# RelayHub v1 mock API meta 语义占位 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-mock-api-meta语义占位-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-mock-api-meta语义占位实施任务.md

这份文档定义 `RelayHub` 控制台在扩展 mock API `meta` 语义占位时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. 所有 mock response 都带统一语义化 `meta`
2. `meta` 至少能表达资源、范围、状态、版本
3. `Providers` 集合接口的 `meta.filters` 能反映当前请求筛选条件
4. 页面层继续不直接消费 `meta`

## 2. 验收标准

### 2.1 meta 字段

必须满足：

- 存在 `resource`
- 存在 `scope`
- 存在 `status`
- 存在 `version`
- `filters` 仅在需要时出现

### 2.2 语义覆盖

必须满足：

- dashboard 为 `overview + ready`
- environments 列表为 `collection + ready`
- environment 未命中为 `detail + not-found`
- providers 空列表为 `collection + empty`
- eval 为 `overview + ready`

### 2.3 边界保持

必须满足：

- 页面层接口保持稳定
- 不新增真实控制动作
- 生产边界与只读边界不被改写

## 3. 验证方式

本轮至少执行：

1. `npm test`
2. `npm run build`
3. 误导表达全文搜索

## 4. 通过标准

只有同时满足下面条件，才允许宣布本轮完成：

- meta 语义测试通过
- 原有路由与 service 测试继续通过
- 构建通过
- 只读边界未被改写
