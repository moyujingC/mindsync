# RelayHub v1 VS Code Claude Code 环境注入模板化说明

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-27
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/specs/2026-04-27-v1-VS-Code-Claude-Code-环境注入模板化说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 本轮目标

把 `VS Code / Claude Code` 的本地宿主环境注入收成一套可提交模板，而不是继续只靠口头说明或临时手工操作。

当前固定认识是：

- `Claude Code` 走本地 `dev-relay` 的协议链路已经具备
- 真正还没收口的是后台宿主如何稳定继承这套环境
- 本轮不直接纳管 `.vscode/`
- 本轮采用“模板文件 + runbook”方案

## 2. 当前默认口径

环境真理源继续固定为：

- `projects/relayhub/dev-relay/run-claude-code-with-relay.sh`

模板中必须固定写清的默认值：

- `ANTHROPIC_BASE_URL=http://127.0.0.1:4319`
- `ANTHROPIC_API_KEY=relayhub-local-dev-relay`
- `ANTHROPIC_AUTH_TOKEN=relayhub-local-dev-relay`
- `ANTHROPIC_MODEL=relayhub-task-claude-code`
- `ANTHROPIC_DEFAULT_OPUS_MODEL=relayhub-task-claude-code`
- `ANTHROPIC_DEFAULT_SONNET_MODEL=relayhub-task-claude-code`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL=relayhub-task-claude-code`
- `RELAYHUB_DEV_RELAY_BASE_URL=http://127.0.0.1:4319`
- `RELAYHUB_CLAUDE_MODEL=relayhub-task-claude-code`

默认仍要求：

- `--setting-sources local`
- `Codex relay` 保持默认关闭

## 3. 模板文件策略

本轮新增的是可提交模板，而不是直接可生效的工作区文件。

模板策略固定为：

- 提交 `env` 模板
- 提交 `VS Code settings.json` 模板片段
- 提交本地 setup 示例脚本
- 所有模板都必须带 `template` 或 `example` 标识
- 模板只描述如何复制到本地 `.vscode/` 或本地环境
- 不提交真实 `.vscode/settings.json`
- 不修改根目录 `.gitignore`

## 4. 模板职责

### 4.1 env 模板

职责固定为：

- 列出完整 `ANTHROPIC_*`
- 列出 `RELAYHUB_*`
- 明确这是本地 relay 开发口径，不是生产环境配置

### 4.2 VS Code settings 模板

职责固定为：

- 作为复制到本地 `.vscode/settings.json` 的参考片段
- 明确这一步的目的，是让工作区终端或 Claude Code 宿主继承同一套环境
- 不承诺仓库内模板本身会自动生效

### 4.3 setup 示例脚本

职责固定为：

- 演示如何一次性加载模板环境
- 避免用户只改单个 `ANTHROPIC_BASE_URL`
- 继续复用 `run-claude-code-with-relay.sh` 作为真理源

## 5. 本轮不改

- 不新增 control-plane 路由
- 不新增 dev-relay 路由
- 不新增 Codex 对称模板
- 不把 `Paperclip claude_local` 并到本轮方案
- 不处理 release
