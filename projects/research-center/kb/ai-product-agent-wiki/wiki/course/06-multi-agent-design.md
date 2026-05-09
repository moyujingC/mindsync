# 06 多 Agent 设计

## 目标

理解什么时候才需要多智能体，以及多智能体会带来哪些协调成本。

## 关键问题

- 是否真的存在不同职责、不同模型或并行任务？
- 多 Agent 之间如何 handoff？
- 谁负责最终判断？
- 多 Agent 是否增加了延迟、成本和不可解释性？

## 来源

- [[../sources/ai-product-strategy-notes]]
- [[../sources/building-with-llms-notes]]

## Atom

- [[../../atoms/pm/define-human-ai-boundary]]
- [[../../atoms/dev/decompose-complex-tasks-before-generation]]
- [[../../atoms/dev/single-agent-before-multi-agent]]
- [[../../atoms/dev/multi-agent-needs-clear-reason]]
- [[../../atoms/bridge/agent-design-should-encode-failure-handling]]

## 概念页

- [[../pm/ai-product-principles]]
- [[../dev/agent-loop]]
- [[../dev/multi-agent-design]]
- [[../dev/single-agent-design]]

## 核心笔记

多智能体不是 Agent 系统的默认答案。只有当职责、模型能力、工具权限或并行性真的不同，拆分才有意义。

拆分后要定义 handoff（交接）格式。每个 Agent 输出什么、谁消费、谁做最终判断、失败时谁负责降级，都必须明确。

多 Agent 的 eval 也更复杂。除了评每个 Agent，还要评整体链路：交接是否丢信息、最终决策是否可追踪、成本和延迟是否仍可接受。

## 练习

只在一镜一梳出现明确分工后，再考虑拆出 VisionAgent、KnowledgeAgent、InterpreterAgent、ReviewerAgent。
