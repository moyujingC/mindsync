# 05 单 Agent 设计

## 目标

学习如何把一个明确任务做成单智能体，而不是过早拆成多智能体。

## 关键问题

- 这个 Agent 的目标是什么？
- 它有哪些工具？
- 它如何判断证据是否足够？
- 它如何自检和结束？

## 来源

- [[../sources/building-with-llms-notes]]
- [[../sources/ai-product-strategy-notes]]

## Atom

- [[../../atoms/dev/context-engineering-beats-prompt-tweaking]]
- [[../../atoms/dev/decompose-complex-tasks-before-generation]]
- [[../../atoms/dev/evals-are-mandatory-for-ai-products]]
- [[../../atoms/dev/single-agent-before-multi-agent]]

## 概念页

- [[../dev/agent-loop]]
- [[../dev/single-agent-design]]
- [[../dev/tool-design]]
- [[../dev/state-machine]]
- [[../bridge/aimandala-agent-mapping]]

## 核心笔记

单智能体优先，是为了先把一个任务做清楚。一个单 Agent 至少要讲清目标、上下文、工具、状态、trace、eval 和 guardrails。

当这些还不清楚时，多智能体不会自动带来清晰结构，反而会增加 handoff、责任归属和调试成本。

一镜一梳第一版更适合把报告解读收束为 `MandalaInterpreterAgent`。它可以调用已有 workflow 和 runtime，但对外先表现为一个可解释的任务执行者。

## 练习

把一镜一梳报告解读先设计成 `MandalaInterpreterAgent`，不要先拆 VisionAgent、KnowledgeAgent、ReviewerAgent。
