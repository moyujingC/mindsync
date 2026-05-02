# RelayHub v1 Claude Code CLI 真链路收口说明

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-22
> source_of_truth：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/specs/2026-04-22-v1-Claude-Code-CLI-真链路收口说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 本轮目标

本轮把 `Claude Code CLI` 通过本地 `RelayHub dev-relay` 的真实调用链路正式打通。

当前固定链路为：

1. 本地 `claude` 命令通过 `run-claude-code-with-relay.sh` 发请求
2. 请求进入 `dev-relay` 的 Anthropic 兼容接口
3. `dev-relay` 固定读取 `task-claude-code` 当前绑定入口
4. 当前绑定为 `AITechFlux` 时，真实请求可完成返回
5. 再切换 `task-claude-code.defaultModelEntryId` 后，后续请求跟随变化

## 2. 当前根因与收口方向

已确认当前 CLI 还未稳定走本地 relay 的主要原因不是 relay 转发逻辑本身，而是本机 `Claude` 用户级配置会覆盖本轮联调环境。

当前已确认：

- `~/.claude/settings.json` 中存在用户级：
  - `ANTHROPIC_BASE_URL=https://aitechflux.com`
  - 以及相关 `ANTHROPIC_*` 模型默认值
- 若直接运行 `claude --bare`，CLI 仍可能优先使用用户级设置，而不是 RelayHub 本地 `4319`
- 因此本轮必须把“本地隔离启动”升格为正式能力，而不是靠手工切环境变量碰运气

## 3. 正式接口与协议口径

本轮不新增新的 relay 路由。

继续固定使用：

- `GET /health`
- `POST /chat/completions`
- `POST /v1/messages`
- `POST /v1/messages/count_tokens`

其中 `POST /v1/messages` 的 v1 口径固定为：

- 对上游 OpenAI-compatible 一律走非流式 `chat/completions`
- relay 本地负责把结果转成 Anthropic SSE
- 至少覆盖：
  - `message_start`
  - `content_block_start`
  - `content_block_delta`
  - `content_block_stop`
  - `message_delta`
  - `message_stop`

## 4. 本地启动口径

`run-claude-code-with-relay.sh` 成为唯一推荐的本地 Claude Code 启动入口。

脚本职责固定为：

- 设置：
  - `ANTHROPIC_BASE_URL=http://127.0.0.1:4319`
  - `ANTHROPIC_API_KEY=relayhub-local-dev-relay`
  - `ANTHROPIC_AUTH_TOKEN=relayhub-local-dev-relay`
  - `ANTHROPIC_MODEL=relayhub-task-claude-code`
- 默认通过 `--setting-sources local` 屏蔽用户级 Claude 设置覆盖
- 保留一个显式开关，允许后续排障时关闭该隔离，但默认必须开启

## 5. 验收口径

本轮成功标准固定为：

- `claude` 请求确实打到本地 relay，而不是直接打用户级配置里的上游
- 当前绑定 `AITechFlux` 时，真实 CLI 请求自然完成并退出
- 返回结果不是本地报错或挂起
- 再切换 `task-claude-code.defaultModelEntryId` 后，后续 CLI 请求目标跟随变化

本轮不要求：

- release 机器联调
- 页面内一键切任务
- 自动写运行记录
- 模型测评或推荐
