# Aimandala Agent Mapping

## Definition

一镜一梳当前已经有 workflow、知识运行时和报告生成层；后续如果要加 Agent，最自然的方向是把这些能力组织成单智能体工作流，再逐步抽象出可复用的 atoms。

## Why It Matters

它可以把项目实践和知识库学习接起来，避免学习内容和真实项目脱节。

## PM View

要先判断哪些环节需要 AI 决策，哪些只是固定流程。

## Dev View

可以先把现有 orchestrator 当作基础编排层，再逐步补 agent trace、state 和 review 机制。

## Related Atoms

- [[../../atoms/bridge/llm-wiki-separates-learning-from-company-knowledge]]

## Related Sources

- [[../sources/karpathy-llm-wiki]]

## Open Questions

- 哪些报告生成步骤值得独立成 agent 的职责边界。

