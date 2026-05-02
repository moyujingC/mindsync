# RelayHub v1 VS Code Claude Code 主路径收口实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-27
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/tasks/2026-04-27-v1-VS-Code-Claude-Code-主路径收口实施任务.md
> 项目：RelayHub
> 阶段：task

## 1. 实施目标

把 `VS Code / Claude Code` 收成 `RelayHub` 当前唯一默认主路径，并补齐本地 runbook、QA 口径和交付说明。

## 2. 实施内容

- 新增一轮 `spec / task / qa / delivery` artifact，正式回写当前阶段改向
- 新增一份面向 `VS Code / Claude Code` 的本地 runbook
  - 明确默认通过本地 `dev-relay`
  - 明确默认模型名为 `relayhub-task-claude-code`
  - 明确默认必须隔离 `~/.claude/settings.json`
  - 明确默认导出完整 `ANTHROPIC_*`
- 在 `tasks/README.md`、`qa/README.md`、`delivery/README.md`、`specs/README.md` 增加本轮入口
- 保持当前 `Claude Code` 页面能力不回退
- 不扩展 `Codex` 新功能

## 3. 测试要求

至少覆盖：

- 新文档明确 `VS Code Claude Code` 是当前唯一主路径
- 新 runbook 明确 `Paperclip claude_local` 不在本轮范围
- 页面现有 `Claude Code` 切模型与验证能力不回归
- 现有自动化测试与构建继续通过

## 4. 回归要求

必须继续通过：

- `cd projects/relayhub/dev-relay && npm test`
- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`
