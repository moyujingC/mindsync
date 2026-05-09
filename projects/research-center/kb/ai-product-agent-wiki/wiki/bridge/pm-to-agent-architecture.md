# 从产品判断到 Agent 架构

## 定义

PM to Agent Architecture 是把产品判断翻译成 Agent 技术结构的过程。用户问题、人机边界、失败体验和质量标准，最终要落到工具、状态、trace、eval 和 guardrails。

## 为什么重要

AI 产品常见问题不是模型不会写，而是产品判断没有进入系统结构。结果是：失败只靠文案兜底，风险只靠最后检查，质量只靠主观感觉。

## 产品经理视角

产品经理可以用下面的映射检查 Agent 设计：

- 用户任务 -> Agent goal
- 用户输入 -> context schema
- 产品能力 -> tool list
- 人机边界 -> state and human review
- 失败体验 -> retry, fallback, degraded state
- 质量标准 -> eval set
- 风险边界 -> guardrails
- 可解释性 -> trace

## 开发视角

开发者要把产品语言变成可执行结构。

例如，“证据不足时不要强行下结论”要落成：

- trace 记录证据数量和质量
- eval 覆盖证据不足样本
- state machine 进入 insufficient_evidence
- output guardrail 要求声明不确定性
- 必要时触发 needs_manual_review

## 相关 Atom

- [[../../atoms/bridge/guardrails-belong-to-product-and-technical-boundaries]]
- [[../../atoms/bridge/agent-design-should-encode-failure-handling]]
- [[../../atoms/dev/agent-state-explains-next-action]]

## 相关来源

- [[../sources/ai-product-strategy-notes]]
- [[../sources/building-with-llms-notes]]

## 待澄清问题

- 一镜一梳的产品边界是否要先写成独立 PM spec，再回写到 Agent 架构页。

