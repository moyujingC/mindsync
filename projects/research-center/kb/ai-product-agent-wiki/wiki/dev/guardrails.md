# Guardrails

## Definition

Guardrails（护栏）是一组限制和检查，用来确保 Agent 不越过产品承诺、权限范围、安全边界和质量底线。

## Why It Matters

AI 系统会在不确定上下文里生成内容和做决策。没有 guardrails，产品容易把“模型可能说什么”误当成“产品可以承诺什么”。

## PM View

PM 要定义 guardrails 的产品边界：

- 哪些问题不能回答？
- 哪些建议必须声明不确定性？
- 哪些场景必须人工复核？
- 哪些失败应该向用户解释，哪些应该静默重试？
- 产品承诺到哪里为止？

## Dev View

技术实现上，guardrails 可以放在多个位置：

- 输入前置校验
- 工具权限限制
- 检索结果过滤
- 状态机阻断
- 输出安全检查
- 人工介入节点
- 降级和 fallback 策略

不要只把 guardrails 放在最终输出后面。越晚检查，越难解释，也越难节省成本。

## Related Atoms

- [[../../atoms/bridge/guardrails-belong-to-product-and-technical-boundaries]]
- [[../../atoms/bridge/agent-design-should-encode-failure-handling]]

## Related Sources

- [[../sources/ai-product-strategy-notes]]
- [[../sources/building-with-llms-notes]]

## Open Questions

- 一镜一梳里“解释命盘”和“人生建议”的边界应该如何分层表达。

