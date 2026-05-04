# RelayHub v1 mock API meta 语义占位实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect / Test
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/tasks/2026-04-16-v1-mock-api-meta语义占位实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：projects/relayhub/delivery/2026-04-16-v1-Providers-URL边界组合回归-交付说明.md, projects/relayhub/qa/2026-04-16-v1-mock-api-meta语义占位-qa-basis.md

这份任务文档用于把 `RelayHub` 控制台当前 mock API 的 `meta`，从“只有生成信息”推进到“带最小语义占位”的只读 response 契约。

## 1. 任务目标

本轮目标是：

- 扩展 `MockResponseMeta`
- 让 mock API 返回更接近未来只读接口的最小语义化 meta
- 在 service 层补保留 `meta` 的 raw helper，供测试与后续契约演进使用
- 保持页面层继续只消费稳定 view model

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- 不改页面层现有调用入口
- 不把 `meta` 直接透给页面
- 不引入真实 API
- 不新增写操作
- 不扩展成复杂后端规则或分页系统

## 3. 本轮要做的实现

### 3.1 meta 字段扩展

至少补齐：

- `resource`
- `scope`
- `status`
- `version`
- `filters?`

### 3.2 mock API 填充

要求：

- `dashboard / environments / providers / eval` 都带 `resource`
- `overview / collection / detail` 都带 `scope`
- 正常返回为 `ready`
- 空集合为 `empty`
- 明细未命中为 `not-found`
- `listProviders` 的 `meta.filters` 反映当前请求筛选条件

### 3.3 service raw helper

新增仅供测试和契约演进使用的 raw helper，允许读取保留 `meta` 的原始 envelope。

页面继续使用当前解包后的 service。

## 4. 本轮明确不做

本轮不做：

- contract 文件单独抽离
- 页面层消费 `meta`
- 真实后端
- SSR
- E2E
- 任何真实控制动作

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- `MockResponseMeta` 已扩展
- mock API 已填充最小语义化 meta
- service raw helper 已存在
- `npm test` 通过
- `npm run build` 通过
- 已补验证记录与交付说明
