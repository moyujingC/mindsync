# RelayHub v1 VS Code Claude Code 本机直接可用收口说明

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-27
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/specs/2026-04-27-v1-VS-Code-Claude-Code-本机直接可用收口说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 本轮目标

本轮不再以治理文档为主，而是优先把当前这台 Mac 上的 `VS Code / Claude Code` 收成“今天可以直接用”的状态。

## 2. 当前阻塞点

当前已确认的本机阻塞点如下：

- `claude` 命令已安装
- 本地 `control-plane` 与 `dev-relay` 尚未启动
- worktree 根还没有 `.vscode/settings.json`
- `~/.claude/settings.json` 中的 `env.ANTHROPIC_*` 仍会把 Claude 指向 `https://aitechflux.com/v1`
- 现有检查脚本此前只检查顶层键，未覆盖 `env` 内嵌冲突

## 3. 当前正式默认口径

本轮正式默认口径固定为：

- worktree 根：`/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev`
- worktree 根 `.vscode/settings.json` 是唯一默认本地工作区配置入口
- 用户级 `~/.claude/settings.json` 不应再保留会覆盖 relay 主路径的 `env.ANTHROPIC_*`
- `task-claude-code` 当前默认绑定应保持在可真实调用的入口

## 4. 本轮收口范围

本轮允许直接处理：

- worktree 根本地 `.vscode/settings.json`
- 用户级 `~/.claude/settings.json` 的冲突 `env.ANTHROPIC_*`
- 本地 `control-plane` 与 `dev-relay` 启动
- 本地 CLI smoke 与本地配置检查

本轮不处理：

- release
- `Paperclip claude_local`
- `Codex relay` 恢复主路径
