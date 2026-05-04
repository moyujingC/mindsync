# RelayHub v1 Providers 最小真实 fetch 试点 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/qa/2026-04-16-v1-providers-最小真实fetch试点-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：projects/relayhub/tasks/2026-04-16-v1-providers-最小真实fetch试点实施任务.md

这份文档定义 `RelayHub` 控制台在为 `Providers` 试点补齐最小真实 fetch 方案时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. `realProvidersDataSource.ts` 具备 request input 与 URL 组装能力
2. providers datasource 可以把 request payload 适配成当前 contract
3. request 错误会继续向上抛出，维持现有页面错误态
4. 页面与 service 对外接口保持不变

## 2. 验收标准

### 2.1 request 骨架

必须满足：

- 存在 `ProvidersReadonlyRequest`
- 存在 collection / detail URL builder
- 非法筛选值不进入 query string

### 2.2 行为稳定

必须满足：

- `empty / not-found / filters` 语义保持不变
- request 错误继续向上抛出
- datasource 组合工厂与页面 helper 返回值不变

### 2.3 边界保持

必须满足：

- 不引入真实 API 地址
- 不新增真实控制动作
- 生产边界与只读边界不被改写

## 3. 验证方式

本轮至少执行：

1. `npm test`
2. `npm run build`
3. 误导表达全文搜索

## 4. 通过标准

只有同时满足下面条件，才允许宣布本轮完成：

- providers 最小真实 fetch 方案已落位
- 自动化测试通过
- 构建通过
- `RelayHub` 项目边界未被改写
