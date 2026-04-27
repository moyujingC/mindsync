# RelayHub v1 VS Code Claude Code 主路径收口 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-27
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/qa/2026-04-27-v1-VS-Code-Claude-Code-主路径收口-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 验证目标

确认 `RelayHub` 当前阶段已经把 `VS Code / Claude Code` 收成唯一默认本地主路径，且 `Codex relay` 默认停用不会影响这条路径。

## 2. 文档验收

至少覆盖：

- 新 `spec / task / qa / delivery` artifact 已建立
- 新 runbook 明确：
  - `Claude Code` 默认走本地 `dev-relay`
  - 默认模型名为 `relayhub-task-claude-code`
  - 默认追加 `--setting-sources local`
  - 默认导出完整 `ANTHROPIC_*`
- runbook 明确：
  - `Paperclip claude_local` 不在本轮范围
  - `Codex relay` 默认关闭

## 3. 手工验证

至少覆盖：

- 本地 `dev-relay` 已启动
- `task-claude-code` 当前绑定可读
- 通过统一入口运行一次本地 `Claude Code` 请求
- 确认请求不会被用户级 `~/.claude/settings.json` 覆盖
- 切换 `task-claude-code.defaultModelEntryId` 后再次请求
- 确认后续请求目标跟随变化

## 4. 页面回归

至少覆盖：

- `/tasks` 里的 `Claude Code 当前模型` 仍存在
- `切换 Claude Code 当前模型` 仍可用
- `验证 Claude Code 当前模型` 仍可返回成功或可读错误

## 5. 自动化回归

必须继续通过：

- `cd projects/relayhub/dev-relay && npm test`
- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`

## 6. 通过标准

- 仓库内当前主路径表述已切到 `VS Code / Claude Code`
- 不再把 `Claude CLI` 单次 smoke 直接表述为最终使用面
- `Codex relay` 默认停用不影响 `Claude Code` 现有主路径
