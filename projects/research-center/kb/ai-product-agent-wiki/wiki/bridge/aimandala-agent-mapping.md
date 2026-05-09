# Aimandala Agent Mapping

## Definition

一镜一梳当前已经有 workflow、知识运行时和报告生成层；后续如果要加 Agent，最自然的方向是把这些能力组织成单智能体工作流，再逐步抽象出可复用的 atoms。

## Why It Matters

它可以把项目实践和知识库学习接起来，避免学习内容和真实项目脱节。

## PM View

要先判断哪些环节需要 AI 决策，哪些只是固定流程。

产品上更稳妥的起点不是“做多智能体”，而是先定义一镜一梳为什么需要一个解读 Agent：

- 它是否减少用户理解报告的成本？
- 它是否能解释证据和不确定性？
- 它失败时是否能给出清楚体验？
- 它是否能把高风险建议留给人工或保守输出？

## Dev View

可以先把现有 orchestrator 当作基础编排层，再逐步补 agent trace、state 和 review 机制。

第一版映射可以是：

- `LayeredOrchestrator` -> 底层 workflow / 编排层
- knowledge runtime -> Agent 工具
- LLM report runtime -> 草稿生成工具
- safety wrapper -> guardrail / review 工具
- trace 记录 -> Agent 可解释性基础
- eval set -> 报告质量、证据使用和风险边界验证

## Related Atoms

- [[../../atoms/bridge/llm-wiki-separates-learning-from-company-knowledge]]
- [[../../atoms/dev/single-agent-before-multi-agent]]
- [[../../atoms/dev/trace-enables-agent-explainability]]
- [[../../atoms/bridge/guardrails-belong-to-product-and-technical-boundaries]]

## Related Sources

- [[../sources/karpathy-llm-wiki]]
- [[../sources/ai-product-strategy-notes]]
- [[../sources/building-with-llms-notes]]

## Open Questions

- 哪些报告生成步骤值得独立成 agent 的职责边界。
