# RelayHub v1 contract 按资源拆分 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/qa/2026-04-16-v1-contract-按资源拆分-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：projects/relayhub/tasks/2026-04-16-v1-contract-按资源拆分实施任务.md

这份文档定义 `RelayHub` 控制台在将前端只读 contract 按资源拆分时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. contract 按资源拆分后更易读、可维护
2. `base` 与资源级 contract 的职责边界明确
3. raw helper 与页面 helper 行为不变
4. 页面层继续不直接依赖 contract

## 2. 验收标准

### 2.1 结构拆分

必须满足：

- 存在 `base.ts`
- 存在资源级 contract 文件
- 存在统一导出入口或清晰导入路径

### 2.2 行为稳定

必须满足：

- raw helper 返回类型不变
- 页面 helper 返回 view model 不变
- 原有 service / route 测试继续通过

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

- contract 已按资源拆分
- 测试通过
- 构建通过
- 边界未被改写
