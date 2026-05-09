# Agent Loop

## Definition

Agent loop 是智能体完成任务时反复执行的基本循环：理解目标、整理上下文、调用工具、观察结果、更新状态，并决定继续、重试、降级或结束。

## Why It Matters

没有 loop 的 AI 更像一次模型调用；有 loop 的 AI 才能处理多步骤任务和不确定结果。

## PM View

产品经理不需要实现 loop，但需要知道 loop 会影响成本、延迟、可靠性和用户等待体验。每多一轮工具调用或模型判断，都要有明确产品价值。

## Dev View

最小可用 agent loop 可以包含：

1. collect_context
2. plan_next_step
3. call_tool_or_model
4. inspect_result
5. update_state
6. finish_or_retry

实现时要特别关注：

- 上下文是否足够
- 工具失败如何分类
- 是否需要人工介入
- 最终输出如何评测

## Related Atoms

- [[../../atoms/dev/context-engineering-beats-prompt-tweaking]]
- [[../../atoms/dev/decompose-complex-tasks-before-generation]]
- [[../../atoms/dev/evals-are-mandatory-for-ai-products]]
- [[../../atoms/bridge/agent-design-should-encode-failure-handling]]

## Related Sources

- [[../sources/building-with-llms-notes]]
- [[../sources/ai-product-strategy-notes]]

## Open Questions

- 一镜一梳的 `LayeredOrchestrator` 应该保留为 workflow，还是包进 `MandalaInterpreterAgent` 的 loop。

