# RelayHub v1 VS Code Claude Code 本机直接可用收口 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-27
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/qa/2026-04-27-v1-VS-Code-Claude-Code-本机直接可用收口-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 验证目标

确认当前这台机器上的 `VS Code / Claude Code` 已完成本地接入收口，可直接走本地 relay 主路径。

## 2. 文档与配置验收

至少覆盖：

- 新一轮 `spec / task / qa / delivery` artifact 已建立
- worktree 根 `.vscode/settings.json` 已落地
- 用户级 `~/.claude/settings.json` 中冲突 `env.ANTHROPIC_*` 已处理
- runbook 已明确本机启动顺序与本地文件落地步骤

## 3. 本机验证

至少覆盖：

- `control-plane` 已启动
- `dev-relay` 已启动
- 检查脚本能识别 `~/.claude/settings.json.env.ANTHROPIC_BASE_URL=https://aitechflux.com/v1`
- 修正后再次运行检查脚本，返回通过结论
- 运行 `local-claude-code-cli-smoke.sh` 可自然完成
- `task-claude-code` 绑定可真实跟随变化

## 4. 自动化回归

必须继续通过：

- `cd projects/relayhub/dev-relay && npm test`
- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`
