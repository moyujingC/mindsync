# RelayHub v1 前端只读 contract 层 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/qa/2026-04-16-v1-前端只读-contract-层-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：projects/relayhub/tasks/2026-04-16-v1-前端只读-contract-层实施任务.md

这份文档定义 `RelayHub` 控制台在抽出前端只读 contract 层时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. contract 与页面 model 的职责边界明确分开
2. raw helper 返回 contract response
3. 页面 helper 继续返回原有 view model
4. 页面层继续不直接依赖 contract

## 2. 验收标准

### 2.1 contract 分层

必须满足：

- 存在独立 `contracts/` 目录
- envelope / meta / resource 语义从页面 model 中拆出
- `mocks` 与 `services` 依赖 contract types

### 2.2 行为稳定

必须满足：

- raw helper 行为保持不变
- 页面 helper 返回值形态保持不变
- 原有页面与路由测试继续通过

### 2.3 边界保持

必须满足：

- 不引入真实 API
- 不新增真实控制动作
- 只读边界与生产边界不被改写

## 3. 验证方式

本轮至少执行：

1. `npm test`
2. `npm run build`
3. 误导表达全文搜索

## 4. 通过标准

只有同时满足下面条件，才允许宣布本轮完成：

- contract 层已抽出
- 相关测试通过
- 构建通过
- 边界未被改写
