# RelayHub v1 VS Code Claude Code 本地配置检查闭环说明

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-27
> source_of_truth：projects/relayhub/specs/2026-04-27-v1-VS-Code-Claude-Code-本地配置检查闭环说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 本轮目标

新增一个只读本地检查入口，专门判断：

1. `VS Code / Claude Code` 的本地配置是否按模板落对
2. 哪一层配置仍在干扰 `RelayHub dev-relay` 主路径

## 2. 当前默认检查口径

本轮默认检查范围固定为：

- worktree 根 `.vscode/settings.json`
- 当前 shell 环境
- 用户级 `~/.claude/settings.json`

默认工作区根固定为：

- `/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev`

本轮不默认检查：

- `projects/relayhub/.vscode/settings.json`
- release 环境
- `Paperclip claude_local`

## 3. 对照基线

检查脚本必须复用现有模板作为期望值来源：

- `projects/relayhub/dev-relay/claude-code-relay.env.example`
- `projects/relayhub/dev-relay/vscode-settings.template.json`

默认重点检查这些键：

- `RELAYHUB_DEV_RELAY_BASE_URL`
- `RELAYHUB_DEV_RELAY_AUTH_TOKEN`
- `RELAYHUB_CLAUDE_MODEL`
- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`

## 4. 诊断语义

检查脚本必须保持只读，不修改任何文件或环境变量。

输出语义固定为三类：

- `ok`
- `warning`
- `fix next`

并且必须明确指出问题层级：

- worktree 根 `.vscode/settings.json` 缺失
- `.vscode/settings.json` 字段不完整或值不一致
- 当前 shell 环境与模板不一致
- `~/.claude/settings.json` 存在会覆盖 relay 主路径的冲突项

当前已知优先检查的用户级冲突项固定为：

- `ANTHROPIC_BASE_URL`
- 相关 `ANTHROPIC_*` 默认模型值

## 5. 本轮不改

- 不自动写 `.vscode/settings.json`
- 不自动修改 `~/.claude/settings.json`
- 不新增 control-plane API
- 不新增 console 页面能力
- 不恢复 `Codex relay`
