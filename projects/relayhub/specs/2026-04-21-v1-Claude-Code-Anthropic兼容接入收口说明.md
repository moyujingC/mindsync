# RelayHub v1 Claude Code Anthropic 兼容接入收口说明

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-21
> source_of_truth：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/specs/2026-04-21-v1-Claude-Code-Anthropic兼容接入收口说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 补充背景

在本轮 `dev-relay` 落地后，已确认本机 `Claude Code` 当前并不是调用 OpenAI `chat/completions`，而是调用 Anthropic 兼容接口：

- `POST /v1/messages`
- `POST /v1/messages/count_tokens`

因此要让“Claude Code -> RelayHub -> 任务切模型”真正成立，还需要为 `dev-relay` 增加一层最小 Anthropic 兼容接入。

## 2. 本轮补充目标

在不改变 `control-plane` 数据模型、不新增控制面路由的前提下，为 `dev-relay` 补最小兼容能力：

- 接收 Claude Code 的 `messages` 请求
- 固定读取 `task-claude-code` 当前绑定入口
- 将 Anthropic 消息格式映射成上游 `chat/completions`
- 将上游返回再映射回 Anthropic 消息格式

## 3. 固定范围

新增最小兼容接口：

- `POST /v1/messages`
- `POST /v1/messages/count_tokens`

继续保留：

- `POST /chat/completions`
- `GET /health`

## 4. 映射原则

### 4.1 请求映射

Anthropic 请求中的：

- `system`
- `messages`
- `tools`
- `tool_choice`

映射到 OpenAI-compatible `chat/completions` 的：

- `messages`
- `tools`
- `tool_choice`

并由 relay 侧继续覆盖：

- `model = task-claude-code` 当前绑定入口的 `modelId`

### 4.2 返回映射

上游 `chat/completions` 的：

- 普通文本回复
- 工具调用（tool calls，工具调用）

映射回 Anthropic 的：

- `content: [{ type: "text" }]`
- `content: [{ type: "tool_use" }]`

### 4.3 计数接口

`/v1/messages/count_tokens` 本轮只提供最小可用语义：

- 返回一个可用的 `input_tokens`
- 不要求做到与 Anthropic 官方完全一致
- 目标是让 Claude Code 不因缺少该接口而直接失败

## 5. 当前不做

- 不新增真正的 Anthropic 上游
- 不做多任务选择
- 不做自动运行记录
- 不做复杂流式事件全量覆盖
- 不做正式生产级协议对齐

## 6. 成功标准

本轮成功标准不是“完全复刻 Anthropic API”，而是：

- Claude Code 本地能把请求打进 RelayHub
- RelayHub 能按 `task-claude-code` 当前绑定切上游
- 至少普通对话和最小工具调用链路可继续前进

