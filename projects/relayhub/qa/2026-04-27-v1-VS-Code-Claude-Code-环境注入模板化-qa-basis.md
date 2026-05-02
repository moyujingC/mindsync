# RelayHub v1 VS Code Claude Code 环境注入模板化 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-27
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/qa/2026-04-27-v1-VS-Code-Claude-Code-环境注入模板化-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 验证目标

确认 `VS Code / Claude Code` 的本地环境注入已经形成模板化入口，而不是继续只靠零散手工设置。

## 2. 文档与模板验收

至少覆盖：

- 新一轮 `spec / task / qa / delivery` artifact 已建立
- 新模板明确是复制到本地 `.vscode/` 或本地环境使用
- 模板不直接作为仓库自动生效配置
- 模板中不出现真实密钥
- runbook 明确区分：
  - 前台 CLI smoke
  - 后台 VS Code 宿主接入

## 3. 手工验证

至少覆盖：

- 先运行 `local-claude-code-cli-smoke.sh`
- 确认底层 relay 真链路正常
- 按模板把环境落到本地工作区
- 用 `VS Code / Claude Code` 发起一次真实请求
- 确认请求未被用户级 `~/.claude/settings.json` 覆盖
- 切换 `task-claude-code.defaultModelEntryId` 后再验证一次
- 确认后续请求目标跟随变化

## 4. 页面回归

至少覆盖：

- `/tasks` 中 `Claude Code 当前模型` 仍存在
- `切换 Claude Code 当前模型` 仍可用
- `验证 Claude Code 当前模型` 仍返回成功或可读错误

## 5. 自动化回归

必须继续通过：

- `cd projects/relayhub/dev-relay && npm test`
- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`
