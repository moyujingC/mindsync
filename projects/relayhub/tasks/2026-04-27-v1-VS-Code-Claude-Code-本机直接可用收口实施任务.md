# RelayHub v1 VS Code Claude Code 本机直接可用收口实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-27
> source_of_truth：projects/relayhub/tasks/2026-04-27-v1-VS-Code-Claude-Code-本机直接可用收口实施任务.md
> 项目：RelayHub
> 阶段：task

## 1. 实施目标

把当前这台机器上的 `VS Code / Claude Code` 从“底层链路已具备”推进到“本机今天可直接使用”。

## 2. 实施内容

- 新增一轮 `spec / task / qa / delivery` artifact，主题明确为“本机直接可用收口”
- 修正本地配置检查脚本，补上 `~/.claude/settings.json.env` 冲突识别
- 在 worktree 根落地本地 `.vscode/settings.json`
- 备份并处理用户级 `~/.claude/settings.json` 中的冲突 `env.ANTHROPIC_*`
- 启动本地 `control-plane` 与 `dev-relay`
- 运行本地 smoke，确认 Claude 主链路可用

## 3. 测试要求

至少覆盖：

- 检查脚本识别 `env.ANTHROPIC_*` 冲突
- worktree 根 `.vscode/settings.json` 已落地
- 用户级冲突移除后，检查脚本可通过
- 本地服务启动后，CLI smoke 可完成

## 4. 回归要求

必须继续通过：

- `cd projects/relayhub/dev-relay && npm test`
- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`
