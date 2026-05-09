# 05 Single Agent Design

## Goal

学习如何把一个明确任务做成单智能体，而不是过早拆成多智能体。

## Key Questions

- 这个 Agent 的目标是什么？
- 它有哪些工具？
- 它如何判断证据是否足够？
- 它如何自检和结束？

## Sources

- [[../sources/building-with-llms-notes]]
- [[../sources/ai-product-strategy-notes]]

## Atoms

- [[../../atoms/dev/context-engineering-beats-prompt-tweaking]]
- [[../../atoms/dev/decompose-complex-tasks-before-generation]]
- [[../../atoms/dev/evals-are-mandatory-for-ai-products]]

## Concepts

- [[../dev/agent-loop]]
- [[../bridge/aimandala-agent-mapping]]

## Practice

把一镜一梳报告解读先设计成 `MandalaInterpreterAgent`，不要先拆 VisionAgent、KnowledgeAgent、ReviewerAgent。

