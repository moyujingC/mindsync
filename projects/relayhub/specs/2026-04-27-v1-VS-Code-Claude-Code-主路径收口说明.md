# RelayHub v1 VS Code Claude Code 主路径收口说明

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-27
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/specs/2026-04-27-v1-VS-Code-Claude-Code-主路径收口说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 本轮目标

把 `RelayHub` 当前阶段的唯一默认开发主路径正式收口为：

1. `VS Code` 里的 `Claude Code`
2. 通过本地 `dev-relay` 使用
3. 固定读取 `task-claude-code` 当前绑定

本轮不再把 `Codex` 作为当前主开发线路，也不把 `Paperclip` 的 `claude_local` 纳入这条主路径。

## 2. 当前默认口径

- `Codex relay` 默认关闭
  - 默认行为为直接返回 `codex_relay_disabled`
  - 仅在显式设置 `RELAYHUB_ENABLE_CODEX_RELAY=1` 时恢复
- `Claude Code` 当前唯一主路径是本地 `dev-relay`
- `Paperclip claude_local` 继续维持独立链路
  - 不通过当前 `RelayHub`
  - 不属于本轮验收范围

## 3. 接口与运行约束

本轮不新增新的对外 API 路由。

继续固定使用：

- `POST /chat/completions`
- `POST /v1/messages`
- `POST /v1/messages/count_tokens`

继续固定默认值：

- relay 地址：`http://127.0.0.1:4319`
- relay 模型名：`relayhub-task-claude-code`
- 任务绑定来源：`task-claude-code.defaultModelEntryId`

## 4. 本地宿主收口语义

本轮把 `run-claude-code-with-relay.sh` 从“CLI smoke 脚本”提升为“本机 Claude Code 统一启动入口”。

它的正式职责固定为：

- 导出完整 `ANTHROPIC_*` 环境变量
- 默认附带 `--setting-sources local`
- 屏蔽 `~/.claude/settings.json` 对本地 relay 的覆盖
- 固定把 `Claude Code` 指向本地 `dev-relay`

已有 `CLI` smoke 结果只作为底层验证依据，不再单独等同于“VS Code 主路径已稳定”。

## 5. 本轮不改

- 不改 `Paperclip` 的 `claude_local`
- 不改 release 部署口径
- 不新增 `Codex` 对称页面能力
- 不删除现有 `Claude Code` 任务页切模型与验证能力
