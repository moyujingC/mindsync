# 04 Evals、Guardrails 与 Tracing

## 目标

把 Agent 从“能跑”提升到“可验证、可追踪、可控”。

## 关键问题

- 最小评测样本是什么？
- 评测对象是最终输出、工具调用，还是状态决策？
- 哪些风险需要 guardrails？
- trace 是否能解释 Agent 为什么这样做？

## 来源

- [[../sources/building-with-llms-notes]]
- [[../sources/ai-product-strategy-notes]]

## Atom

- [[../../atoms/dev/evals-are-mandatory-for-ai-products]]
- [[../../atoms/dev/eval-tool-calls-and-decisions]]
- [[../../atoms/dev/trace-enables-agent-explainability]]
- [[../../atoms/bridge/guardrails-belong-to-product-and-technical-boundaries]]
- [[../../atoms/bridge/agent-design-should-encode-failure-handling]]

## 概念页

- [[../dev/agent-loop]]
- [[../dev/evals]]
- [[../dev/tracing]]
- [[../dev/guardrails]]
- [[../pm/ai-product-principles]]

## 核心笔记

Agent 从“能跑”到“可靠”，要补三件事：evals（评测）、trace（追踪）和 guardrails（护栏）。

Evals 不只看最终文本，也看中间过程。工具有没有调对、证据有没有用对、状态有没有正确进入人工介入，都应该进入评测。

Trace 是复盘的依据。没有 trace，Agent 出错时只能猜；有 trace，才能定位问题来自上下文、工具、模型、状态机还是产品边界。

Guardrails 要同时存在于产品和技术里。产品侧定义不能承诺什么，技术侧把它落成输入校验、工具权限、状态阻断、输出检查和人工复核。

## 练习

为一镜一梳定义三类评测：报告文本质量、证据消费正确性、风险/安全边界。
