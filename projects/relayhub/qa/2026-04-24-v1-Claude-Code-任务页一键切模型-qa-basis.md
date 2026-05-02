# RelayHub v1 Claude Code 任务页一键切模型 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-24
> source_of_truth：projects/relayhub/qa/2026-04-24-v1-Claude-Code-任务页一键切模型-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 验证目标

确认任务页已经提供“Claude Code 当前模型”的一键切换入口，并正确回写到 `task-claude-code`。

## 2. 自动化验证

至少覆盖：

- `/tasks` 出现 `Claude Code 当前模型`
- 当前绑定显示当前 `defaultModelEntryName`
- 选择新模型并点击 `切换 Claude Code 当前模型` 后，成功提示出现
- 切换后页面中的当前绑定立即更新

## 3. 手工 smoke

至少覆盖：

- 打开 `/tasks`
- 找到 `Claude Code 当前模型`
- 选择另一个已激活模型
- 点击切换
- 再通过 `dev-relay` 或 `claude` 命令确认后续请求跟随
