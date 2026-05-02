# RelayHub v1 VS Code Claude Code 本地配置检查闭环 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-27
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/qa/2026-04-27-v1-VS-Code-Claude-Code-本地配置检查闭环-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 验证目标

确认 `VS Code / Claude Code` 已具备一个只读本地配置检查入口，能明确指出工作区文件、shell 环境和用户级 Claude 配置三层问题。

## 2. 文档验收

至少覆盖：

- 新一轮 `spec / task / qa / delivery` artifact 已建立
- runbook 已新增检查脚本步骤
- 文档明确默认检查 worktree 根，不是 `projects/relayhub` 子目录

## 3. 手工验证

至少覆盖：

- 未配置 `.vscode/settings.json` 时运行检查脚本，返回缺失提示
- `.vscode/settings.json` 只配置部分字段时运行检查脚本，返回字段不完整提示
- 当前 shell 环境与模板不一致时运行检查脚本，返回具体差异
- `~/.claude/settings.json` 有冲突项时运行检查脚本，返回覆盖风险提示
- 三层配置都对齐时运行检查脚本，返回整体通过结论

## 4. 主链路验证

至少覆盖：

- 先运行 `local-claude-code-cli-smoke.sh`
- 再运行本地配置检查脚本
- 再用 `VS Code / Claude Code` 发起真实请求
- 切换 `task-claude-code.defaultModelEntryId` 后再次验证
- 确认后续请求目标跟随变化

## 5. 自动化回归

必须继续通过：

- `cd projects/relayhub/dev-relay && npm test`
- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`
