# 先单智能体，后多智能体

## 断言

在职责边界还不清楚时，应优先设计单智能体，而不是过早拆成多智能体。

## 类型

- decision

## 适用范围

- dev

## 来源

- [[../../wiki/sources/building-with-llms-notes]]
- [[../../wiki/sources/ai-product-strategy-notes]]

## 备注

- 单智能体更容易定义目标、工具、状态、trace 和 eval。
- 过早多智能体会放大 handoff、责任归属、成本和调试复杂度。

## 相关概念

- [[../../wiki/dev/single-agent-design]]
- [[../../wiki/dev/multi-agent-design]]
