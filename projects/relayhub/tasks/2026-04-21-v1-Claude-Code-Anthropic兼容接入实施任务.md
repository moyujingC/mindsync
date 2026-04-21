# RelayHub v1 Claude Code Anthropic 兼容接入实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-21
> source_of_truth：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/tasks/2026-04-21-v1-Claude-Code-Anthropic兼容接入实施任务.md
> 项目：RelayHub
> 阶段：task

## 1. 实施目标

让本机 Claude Code 能通过 RelayHub `dev-relay` 调用当前任务绑定入口。

## 2. 实施内容

- 为 `dev-relay` 新增 `POST /v1/messages`
- 为 `dev-relay` 新增 `POST /v1/messages/count_tokens`
- 保持 `task-claude-code` 固定绑定解析不变
- 将 Anthropic 请求映射为上游 `chat/completions`
- 将上游普通文本和工具调用结果映射回 Anthropic 响应

## 3. 测试要求

新增失败优先测试至少覆盖：

- `messages` 请求能转发到已绑定入口
- `system + messages` 能正确映射为上游消息
- `tools` 能正确映射为上游 function tools
- 上游 tool calls 能映射回 Anthropic `tool_use`
- `count_tokens` 返回最小可用结果

## 4. 回归要求

必须继续通过：

- `cd projects/relayhub/dev-relay && npm test`
- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`

