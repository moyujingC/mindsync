# RelayHub v1 contract 脱离页面模型 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-contract-脱离页面模型-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-contract-脱离页面模型实施任务.md

这份文档定义 `RelayHub` 控制台在将前端只读 contract 从页面模型依赖中解耦时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. `contracts/` 不再直接依赖 `models/console.ts`
2. raw helper 继续返回稳定 contract response
3. 页面 helper 继续返回原有 view model
4. `providers` 的 `meta.filters` 语义保持稳定

## 2. 验收标准

### 2.1 contract 边界

必须满足：

- `contracts/base.ts` 不再 import 页面模型
- 资源级 contract 文件承载自己的 payload 类型
- `ProviderFilterSnapshot` 等 contract 语义不再借用页面 filter 类型

### 2.2 service 行为

必须满足：

- raw helper 返回 resource-level contract response
- 页面 helper 返回的字段形态不变
- contract 到页面 model 的映射逻辑集中在 service 层

### 2.3 边界保持

必须满足：

- 不引入真实 API
- 不新增真实控制动作
- 生产边界与只读边界不被改写

## 3. 验证方式

本轮至少执行：

1. `npm test`
2. `npm run build`
3. 误导表达全文搜索

## 4. 通过标准

只有同时满足下面条件，才允许宣布本轮完成：

- contract 与页面 model 的依赖边界已收束
- 自动化测试通过
- 构建通过
- `RelayHub` 项目边界未被改写
