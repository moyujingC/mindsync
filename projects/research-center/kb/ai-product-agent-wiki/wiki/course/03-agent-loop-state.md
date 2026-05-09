# 03 Agent Loop And State

## Goal

掌握 Agent loop 的最小运行结构：目标、上下文、工具、观察、状态、下一步决策。

## Key Questions

- 当前 Agent 处于什么状态？
- 上一步工具调用成功了吗？
- 下一步是继续、重试、降级、人工介入，还是结束？
- 状态是否能被记录和恢复？

## Sources

- [[../sources/building-with-llms-notes]]
- [[../sources/ai-product-strategy-notes]]

## Atoms

- [[../../atoms/dev/decompose-complex-tasks-before-generation]]
- [[../../atoms/bridge/agent-design-should-encode-failure-handling]]

## Concepts

- [[../dev/agent-loop]]

## Practice

为 `MandalaInterpreterAgent` 草拟状态：collecting_evidence、drafting、reviewing、finalizing、completed、needs_manual_review。

