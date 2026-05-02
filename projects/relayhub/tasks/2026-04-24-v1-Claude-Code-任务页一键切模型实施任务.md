# RelayHub v1 Claude Code 任务页一键切模型实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-24
> source_of_truth：projects/relayhub/tasks/2026-04-24-v1-Claude-Code-任务页一键切模型实施任务.md
> 项目：RelayHub
> 阶段：task

## 1. 实施目标

让用户进入 `/tasks` 后，可以不翻任务表格，直接切 `Claude Code` 当前模型。

## 2. 实施内容

- 在 `TasksPage` 顶部增加 `Claude Code 当前模型` 专用区
- 读取 `task-claude-code`
- 复用现有行级快速切换保存逻辑
- 成功后立即刷新页面中的当前绑定展示
- 保持现有任务表格和完整编辑入口不回归

## 3. 测试要求

至少覆盖：

- `/tasks` 出现 `Claude Code 当前模型` 专用区
- 当前绑定模型显示正确
- 选择新模型并点击按钮后，页面反馈明确
- 切换后当前绑定展示立即刷新
