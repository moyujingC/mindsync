# 07 产品视角

## 目标

从 AI 产品经理视角理解 Agent：不是看起来高级，而是能解决真实用户问题。

## 关键问题

- Agent 为用户减少了什么成本？
- 哪些体验需要让用户知道 AI 正在做什么？
- 失败时如何解释？
- 质量、成本、延迟如何取舍？

## 来源

- [[../sources/ai-product-strategy-notes]]
- [[../sources/building-with-llms-notes]]

## 原子

- [[../../atoms/pm/start-with-problem-not-ai]]
- [[../../atoms/pm/define-human-ai-boundary]]
- [[../../atoms/dev/evals-are-mandatory-for-ai-products]]
- [[../../atoms/bridge/guardrails-belong-to-product-and-technical-boundaries]]

## 概念

- [[../pm/ai-product-principles]]
- [[../bridge/pm-to-agent-architecture]]
- [[../dev/evals]]
- [[../dev/guardrails]]

## 核心笔记

AI 产品经理看 Agent，不是看架构是否高级，而是看它是否减少用户成本、扩大可完成任务范围，并且在失败时仍然可解释。

产品判断要进入技术结构。用户任务会变成 Agent goal，人机边界会变成状态和人工复核，失败体验会变成 retry、fallback 和 degraded state，质量标准会变成 eval set。

对一镜一梳来说，是否需要解读 Agent，取决于它能否让用户更低成本地理解报告，而不是只生成更长的文本。

## 练习

为一镜一梳写出“为什么需要解读 Agent，而不是只需要报告生成 prompt”的产品判断。
