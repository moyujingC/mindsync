# RelayHub v1 Claude Code Anthropic 兼容接入 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-21
> source_of_truth：projects/relayhub/qa/2026-04-21-v1-Claude-Code-Anthropic兼容接入-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 验证目标

确认 `dev-relay` 已具备让本机 Claude Code 继续前进的最小 Anthropic 兼容能力。

## 2. 自动化验证

至少覆盖：

- `POST /v1/messages` 普通文本转发成功
- `system` 与 `messages` 正确映射
- `tools` 正确映射到上游函数工具
- 上游工具调用结果映射回 `tool_use`
- `POST /v1/messages/count_tokens` 返回可用结构

## 3. 通过标准

- Claude Code 不再因为缺少 `/v1/messages/count_tokens` 直接失败
- Claude Code 请求可通过 RelayHub 跟随任务绑定切换上游
- 任务切换后，后续 `messages` 请求目标同步变化

