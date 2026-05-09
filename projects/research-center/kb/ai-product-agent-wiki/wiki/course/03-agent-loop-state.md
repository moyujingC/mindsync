# 03 Agent Loop And State

## Goal

掌握 Agent loop 的最小运行结构：目标、上下文、工具、观察、状态、下一步决策。

## Key Questions

- 当前 Agent 处于什么状态？
- 上一步工具调用成功了吗？
- 下一步是继续、重试、降级、人工介入，还是结束？
- 状态是否能被记录和恢复？

## Sources

- [[../sources/building-with-llms-notes]]
- [[../sources/ai-product-strategy-notes]]

## Atoms

- [[../../atoms/dev/decompose-complex-tasks-before-generation]]
- [[../../atoms/dev/agent-state-explains-next-action]]
- [[../../atoms/bridge/agent-design-should-encode-failure-handling]]

## Concepts

- [[../dev/agent-loop]]
- [[../dev/state-machine]]

## Core Notes

Agent loop 负责循环执行，state machine（状态机）负责说明循环走到哪里。一个 Agent 不是每一步都自由发挥，而是在有限状态里判断下一步：继续、重试、降级、人工介入或结束。

状态要能解释动作。比如工具失败后，不能只写 `failed`，还要区分是输入缺失、工具超时、无证据、风险阻断，还是模型输出不合格。不同失败类型对应不同下一步。

对产品来说，状态机也是体验设计。证据不足、风险过高、用户等待过久、结果置信度低，这些都不是纯技术问题，而是产品需要决定如何面对用户。

## Practice

为 `MandalaInterpreterAgent` 草拟状态：collecting_evidence、drafting、reviewing、finalizing、completed、needs_manual_review。
