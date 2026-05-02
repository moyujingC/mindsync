# RelayHub v1 Providers 筛选 URL 化与路由测试 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/qa/2026-04-16-v1-Providers筛选URL化与路由测试-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：projects/relayhub/tasks/2026-04-16-v1-Providers筛选URL化与路由测试实施任务.md

这份文档定义 `RelayHub` 控制台在推进 `Providers` 筛选 URL 化与核心路由测试时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. `Providers` 筛选条件可以通过 URL 查询参数表达
2. 打开带筛选 URL 的链接时，页面能恢复正确筛选状态
3. 核心路由具备自动化回归测试
4. 只读边界与生产约束表达不被削弱

## 2. 验收标准

### 2.1 URL 查询参数

必须满足：

- `kind`、`environment`、`health`、`transparency` 可进入 URL
- 改变筛选时 URL 同步更新
- 刷新页面后筛选状态保留

### 2.2 路由级自动化测试

必须满足：

- 存在 `Dashboard` 测试
- 存在 `Providers` 测试
- 存在 `Eval` 测试
- 测试可在本地通过命令执行

### 2.3 边界表达

必须满足：

- `Providers` 页面仍是只读
- 测试中仍能断言“只允许国产模型”或相关边界说明
- 页面与测试都不引入真实控制动作

## 3. 明确禁止的误导表达

仍然禁止出现：

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`

## 4. 验证方式

本轮至少执行：

1. `npm run build`
2. `npm test` 或等价测试命令
3. 路由 URL 人工核对
4. 误导表达全文搜索

## 5. 通过标准

只有同时满足下面条件，才允许宣布本轮完成：

- `Providers` 筛选 URL 化已完成
- 核心路由测试通过
- 构建通过
- 只读边界未被改写
