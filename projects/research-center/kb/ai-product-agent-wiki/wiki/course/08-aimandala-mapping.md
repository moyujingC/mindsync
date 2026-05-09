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

## Concepts

- [[../bridge/aimandala-agent-mapping]]
- [[../dev/agent-loop]]
- [[../pm/ai-product-principles]]

## Practice

把 `LayeredOrchestrator`、knowledge runtime、LLM report runtime 和 safety wrapper 映射到 `MandalaInterpreterAgent` 的目标、工具、状态和 trace。

