# 04 Evals Guardrails Tracing

## Goal

把 Agent 从“能跑”提升到“可验证、可追踪、可控”。

## Key Questions

- 最小评测样本是什么？
- 评测对象是最终输出、工具调用，还是状态决策？
- 哪些风险需要 guardrails？
- trace 是否能解释 Agent 为什么这样做？

## Sources

- [[../sources/building-with-llms-notes]]
- [[../sources/ai-product-strategy-notes]]

## Atoms

- [[../../atoms/dev/evals-are-mandatory-for-ai-products]]
- [[../../atoms/bridge/agent-design-should-encode-failure-handling]]

## Concepts

- [[../dev/agent-loop]]
- [[../pm/ai-product-principles]]

## Practice

为一镜一梳定义三类评测：报告文本质量、证据消费正确性、风险/安全边界。

