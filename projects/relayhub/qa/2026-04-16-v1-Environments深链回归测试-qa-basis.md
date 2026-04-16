# RelayHub v1 Environments 深链回归测试 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-Environments深链回归测试-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-Environments深链回归测试实施任务.md

这份文档定义 `RelayHub` 控制台在补 `Environments` 深链回归测试时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. `Environments` 核心深链具备自动化回归测试
2. 生产边界文案能在测试里被稳定断言
3. 空态、not-found、mock-error 能在测试里被稳定断言

## 2. 验收标准

### 2.1 深链覆盖

必须满足：

- `/environments/prod-aimandala/policies`
- `/environments/prod-aimandala/runs`
- `/environments/missing-environment/overview`
- `/environments/dev-relay/overview?mock=error`

都存在对应测试。

### 2.2 边界表达

必须满足：

- 测试可断言“只允许国产模型”
- 测试可断言生产版 runs 空态
- 测试可断言环境不存在提示
- 测试可断言环境详情错误态

## 3. 验证方式

本轮至少执行：

1. `npm run build`
2. `npm test`
3. 误导表达全文搜索

## 4. 通过标准

只有同时满足下面条件，才允许宣布本轮完成：

- `Environments` 深链测试已补齐
- 构建通过
- 测试通过
- 只读边界未被改写
