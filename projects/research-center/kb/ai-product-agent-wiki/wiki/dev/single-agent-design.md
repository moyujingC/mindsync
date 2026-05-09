# Single Agent Design

## Definition

Single agent design 是先把一个清楚任务封装成单智能体，让它拥有明确目标、有限工具、状态机、trace 和 eval。

## Why It Matters

很多系统并不需要一开始就多智能体。先做好单智能体，可以把目标、上下文、工具、失败处理和评测标准跑通。

## PM View

产品侧要先确认这个 Agent 解决的任务是什么。

一个好的单智能体任务通常具备：

- 用户目标明确
- 输入边界明确
- 输出形态明确
- 失败体验可设计
- 质量标准可评测

如果这些还不清楚，拆成多个 Agent 只会让问题更难定位。

## Dev View

单智能体设计可以按下面顺序写：

1. Goal：它为用户完成什么任务。
2. Context：它需要哪些上下文。
3. Tools：它能调用哪些工具。
4. State：它如何推进、重试、降级和结束。
5. Trace：它记录哪些关键事件。
6. Evals：它如何被验证。
7. Guardrails：它不能越过哪些边界。

一镜一梳可以先把报告解读收束为 `MandalaInterpreterAgent`，等单 Agent 跑稳后再考虑拆分。

## Related Atoms

- [[../../atoms/dev/single-agent-before-multi-agent]]
- [[../../atoms/dev/tools-should-be-few-clear-and-structured]]
- [[../../atoms/dev/agent-state-explains-next-action]]

## Related Sources

- [[../sources/building-with-llms-notes]]
- [[../sources/ai-product-strategy-notes]]

## Open Questions

- `MandalaInterpreterAgent` 的第一版是否只负责报告解释，不负责原始三圈识别。

