# RelayHub v1 Claude Code CLI 真链路收口实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-22
> source_of_truth：projects/relayhub/tasks/2026-04-22-v1-Claude-Code-CLI-真链路收口实施任务.md
> 项目：RelayHub
> 阶段：task

## 1. 实施目标

让本机 `claude` 命令通过 RelayHub 本地 `dev-relay` 稳定完成一次真实请求，并形成可复用的本地启动口径。

## 2. 实施内容

- 收紧 `run-claude-code-with-relay.sh`：
  - 默认启用本地隔离设置
  - 避免 `~/.claude/settings.json` 覆盖 RelayHub 本地 `4319`
- 保持 `dev-relay` 当前 Anthropic 兼容与本地 SSE 能力，不新增新路由
- 新增一条 CLI 真链路 smoke 脚本，用于：
  - 绑定 `task-claude-code -> preset-aitechflux-relay`
  - 调用 `run-claude-code-with-relay.sh --bare -p`
  - 作为本轮正式本地验收入口
- 新增本轮 spec / qa / delivery artifact

## 3. 测试要求

至少覆盖：

- `run-claude-code-with-relay.sh` 默认附带本地设置隔离
- `claude` CLI 在隔离设置下会命中 `http://127.0.0.1:4319`
- 真实 CLI 请求在 `AITechFlux` 绑定下自然完成返回
- 切换 `task-claude-code.defaultModelEntryId` 后，后续 relay 目标跟随变化

## 4. 回归要求

必须继续通过：

- `cd projects/relayhub/dev-relay && npm test`
- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`
