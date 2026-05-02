# RelayHub v1 Claude Code Anthropic 兼容接入交付说明

## Summary

本轮补充交付把 `dev-relay` 从仅有 OpenAI `chat/completions` 兼容，推进到可承接 Claude Code 当前 `Anthropic messages` 调用形态的最小兼容层。

## Delivery Notes

- 新增 `POST /v1/messages`
- 新增 `POST /v1/messages/count_tokens`
- 继续固定读取 `task-claude-code` 当前绑定入口
- 不新增 control-plane 路由
- 继续由 RelayHub 任务库负责切模型

