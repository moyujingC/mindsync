# trace 是 Agent 可解释性的基础

## 断言

Trace 是 Agent 可解释性的基础，因为它记录目标、上下文、工具结果、状态变化和决策理由。

## 类型

- insight

## 适用范围

- dev

## 来源

- [[../../wiki/sources/building-with-llms-notes]]

## 备注

- 没有 trace，只能看最终输出，很难定位问题来自上下文、工具、模型还是状态判断。
- trace 不等于把所有 token 留下来，而是保留能复盘决策的关键事件。

## 相关概念

- [[../../wiki/dev/tracing]]
