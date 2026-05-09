# 06 Multi Agent Design

## Goal

理解什么时候才需要多智能体，以及多智能体会带来哪些协调成本。

## Key Questions

- 是否真的存在不同职责、不同模型或并行任务？
- 多 Agent 之间如何 handoff？
- 谁负责最终判断？
- 多 Agent 是否增加了延迟、成本和不可解释性？

## Sources

- [[../sources/ai-product-strategy-notes]]
- [[../sources/building-with-llms-notes]]

## Atoms

- [[../../atoms/pm/define-human-ai-boundary]]
- [[../../atoms/dev/decompose-complex-tasks-before-generation]]
- [[../../atoms/bridge/agent-design-should-encode-failure-handling]]

## Concepts

- [[../pm/ai-product-principles]]
- [[../dev/agent-loop]]

## Practice

只在一镜一梳出现明确分工后，再考虑拆出 VisionAgent、KnowledgeAgent、InterpreterAgent、ReviewerAgent。

