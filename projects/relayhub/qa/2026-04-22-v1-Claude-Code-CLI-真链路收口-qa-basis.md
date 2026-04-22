# RelayHub v1 Claude Code CLI 真链路收口 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-22
> source_of_truth：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/qa/2026-04-22-v1-Claude-Code-CLI-真链路收口-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 验证目标

确认本机 `claude` 命令已能通过 RelayHub 本地 `dev-relay` 发起真实请求，并稳定命中 `task-claude-code` 当前绑定入口。

## 2. 自动化验证

至少覆盖：

- `stream=true` 时 relay 返回 Anthropic SSE
- relay 对上游固定使用非流式 `chat/completions`
- 既有错误语义不回归

## 3. 手工 / CLI 验证

至少覆盖：

- `task-claude-code` 绑定到 `preset-aitechflux-relay`
- `AITechFlux` 处于 `active`
- 运行：
  - `./run-claude-code-with-relay.sh --bare -p 'Reply with exactly relayhub cli smoke ok'`
- 成功标准：
  - 命令自然完成并退出
  - 结果不是本地报错或挂起
  - CLI 实际命中本地 relay，而不是被用户级 Claude 设置覆盖
- 再切换 `task-claude-code.defaultModelEntryId`
- 再次运行真实 `claude` 请求
- 确认后续请求目标跟随变化

## 4. 通过标准

- 本地 CLI 主链路成立
- 用户级 Claude 配置不再覆盖 RelayHub 本地启动口径
- RelayHub 可以作为 Claude Code 的本地中转入口使用

## 5. 当前实测结论

- 已通过
- 实测根因已确认：
  - `~/.claude/settings.json` 中的用户级 `ANTHROPIC_BASE_URL` 会覆盖本轮联调配置
- 实测收口方式已确认：
  - `run-claude-code-with-relay.sh` 默认追加 `--setting-sources local`
- 真实 CLI smoke 已完成：
  - `bash projects/relayhub/dev-relay/local-claude-code-cli-smoke.sh`
  - 命令自然完成并退出
  - 返回文本包含 `relayhub cli smoke ok`
