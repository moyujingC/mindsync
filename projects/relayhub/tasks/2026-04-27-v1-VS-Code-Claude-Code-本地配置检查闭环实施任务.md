# RelayHub v1 VS Code Claude Code 本地配置检查闭环实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-27
> source_of_truth：projects/relayhub/tasks/2026-04-27-v1-VS-Code-Claude-Code-本地配置检查闭环实施任务.md
> 项目：RelayHub
> 阶段：task

## 1. 实施目标

补一个只读本地检查脚本，把 `VS Code / Claude Code` 的环境配置问题从“猜测哪里没配好”收成“明确告诉用户哪一层偏了”。

## 2. 实施内容

- 新增一轮 `spec / task / qa / delivery` artifact，主题明确为“本地配置检查闭环”
- 在 `projects/relayhub/dev-relay` 新增只读检查脚本：
  - 默认检查 worktree 根 `.vscode/settings.json`
  - 默认检查当前 shell 环境
  - 默认检查用户级 `~/.claude/settings.json`
  - 支持通过 `--workspace-root <path>` 显式覆盖工作区根
- 检查脚本必须复用现有模板作为期望值来源
- 更新现有 runbook，把检查脚本接入推荐步骤
- 在 `specs/README.md`、`tasks/README.md`、`qa/README.md`、`delivery/README.md` 增加新入口

## 3. 测试要求

至少覆盖：

- 未配置 `.vscode/settings.json` 时返回明确提示
- `.vscode/settings.json` 缺字段时返回明确提示
- shell 环境偏离模板时返回具体差异
- `~/.claude/settings.json` 有冲突项时返回明确覆盖风险
- 三层都对齐时返回整体通过结论

## 4. 回归要求

必须继续通过：

- `cd projects/relayhub/dev-relay && npm test`
- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`
