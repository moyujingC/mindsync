# 08 Aimandala Mapping

## Goal

把 Agent 学习内容映射回一镜一梳项目，形成可以指导产品和技术迭代的实践页。

## Key Questions

- 当前项目哪些部分已经是 workflow？
- 哪些部分可以被包装成单 Agent？
- 哪些 trace、eval、fallback 需要补？
- 哪些结论只属于项目，哪些未来可提炼到公司知识库？

## Sources

- [[../sources/karpathy-llm-wiki]]
- [[../sources/ai-product-strategy-notes]]
- [[../sources/building-with-llms-notes]]

## Atoms

- [[../../atoms/bridge/llm-wiki-separates-learning-from-company-knowledge]]
- [[../../atoms/bridge/agent-design-should-encode-failure-handling]]
- [[../../atoms/dev/context-engineering-beats-prompt-tweaking]]
- [[../../atoms/dev/single-agent-before-multi-agent]]
- [[../../atoms/dev/trace-enables-agent-explainability]]

## Concepts

- [[../bridge/aimandala-agent-mapping]]
- [[../bridge/pm-to-agent-architecture]]
- [[../dev/agent-loop]]
- [[../dev/tool-design]]
- [[../dev/state-machine]]
- [[../dev/evals]]
- [[../dev/tracing]]
- [[../dev/guardrails]]
- [[../pm/ai-product-principles]]

## Core Notes

一镜一梳当前更像 workflow 加 runtime。课程学习的目标不是立刻把它改成复杂多 Agent 系统，而是把 Agent 概念映射成可用的产品和技术检查表。

可以先把 `LayeredOrchestrator` 看成底层编排，把 knowledge runtime、LLM report runtime 和 safety wrapper 看成工具或子能力，再在上层定义 `MandalaInterpreterAgent` 的目标、状态、trace、eval 和 guardrails。

学习库里的结论先留在 research-center。只有当这些判断经过项目实践验证，才考虑提炼进公司级知识库。

## Practice

把 `LayeredOrchestrator`、knowledge runtime、LLM report runtime 和 safety wrapper 映射到 `MandalaInterpreterAgent` 的目标、工具、状态和 trace。
