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
- [[../../atoms/bridge/interpreter-agent-explains-existing-evidence]]
- [[../../atoms/bridge/stage-refs-anchor-agent-trace]]
- [[../../atoms/bridge/mandala-agent-evals-must-cover-boundaries]]
- [[../../atoms/bridge/mandala-agent-evals-check-traceability]]
- [[../../atoms/dev/context-engineering-beats-prompt-tweaking]]
- [[../../atoms/dev/single-agent-before-multi-agent]]
- [[../../atoms/dev/trace-enables-agent-explainability]]

## Concepts

- [[../bridge/aimandala-agent-mapping]]
- [[../bridge/mandala-report-agent-path]]
- [[../bridge/mandala-interpreter-agent-design]]
- [[../bridge/mandala-interpreter-agent-evals]]
- [[../bridge/mandala-interpreter-agent-examples]]
- [[../bridge/mandala-interpreter-agent-fixture-mapping]]
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

可以先把 `LayeredOrchestrator` 看成底层编排，把 knowledge runtime、LLM report runtime 和 safety wrapper 看成工具或子能力，再先落 `MandalaReportAgent`，后落 `MandalaInterpreterAgent`。

`MandalaReportAgent` 应优先处理报告生成过程里的证据组织、stage 顺序、来源绑定和质检。`MandalaInterpreterAgent` 则放在第二阶段，解释已有报告和证据链。

它的 eval 样本应同时覆盖正常解释、证据不足和边界风险，避免只验证“回答顺不顺”，却没有验证“是否守住边界”。

用户解释样例应和 eval 样本分开维护：eval 定义通过标准，examples 展示通过时的可读形态，但不直接等于正式产品文案。

真实 fixture 可以作为项目事实锚点，但不应直接替代抽象 eval 口径。学习库只记录 fixture ID、资产类型和映射关系，不复制 golden 报告正文。

学习库里的结论先留在 research-center。只有当这些判断经过项目实践验证，才考虑提炼进公司级知识库。

## Practice

把 `LayeredOrchestrator`、knowledge runtime、LLM report runtime、safety wrapper 和 stage refs 先映射到 `MandalaReportAgent`，再映射到 `MandalaInterpreterAgent` 的目标、工具、状态、trace、eval 和 guardrails，并用抽象 eval 样本和用户解释样例检查正常、降级和人工介入路径。
