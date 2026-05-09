# Agent 状态应能解释下一步动作

## 断言

Agent 状态应该能解释下一步为什么是继续、重试、降级或人工介入。

## 类型

- pattern

## 适用对象

- dev

## 来源

- [[../../wiki/sources/building-with-llms-notes]]
- [[../../wiki/sources/ai-product-strategy-notes]]

## 备注

- 状态不是日志标签，而是决策依据。
- 好的状态机能把失败处理从临时 if else 变成可讨论的产品和技术边界。

## 相关概念页

- [[../../wiki/dev/state-machine]]
- [[../../wiki/dev/agent-loop]]

