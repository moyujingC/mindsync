# 状态机（State Machine）

## 定义

State machine（状态机）是用有限状态描述 Agent 当前处境和下一步选择的方式。它回答的问题是：Agent 现在在哪里，为什么走到这里，接下来允许做什么。

## 为什么重要

没有状态机的 Agent 容易变成一串临时判断：失败了就再试一次，看起来不行就结束。这样很难解释，也很难稳定改进。

状态机让继续、重试、降级、人工介入和结束都变成明确路径。

## PM 视角

状态机不是纯技术细节，它承接产品边界。

例如：

- 证据不足时，是继续查询、给低置信度结果，还是请用户补充信息？
- 涉及高风险建议时，是直接阻断，还是要求人工复核？
- 用户等待很久时，是继续跑，还是先给阶段结果？

这些都需要产品判断，再落到状态设计。

## Dev 视角

一个最小 Agent 状态机可以包含：

1. collecting_context
2. planning
3. calling_tool
4. inspecting_result
5. retrying
6. degraded
7. needs_manual_review
8. finalizing
9. completed
10. failed

每个状态至少要定义：

- 进入条件
- 可执行动作
- 成功出口
- 失败出口
- trace 记录字段

## 相关原子

- [[../../atoms/dev/agent-state-explains-next-action]]
- [[../../atoms/bridge/agent-design-should-encode-failure-handling]]

## 相关来源

- [[../sources/building-with-llms-notes]]
- [[../sources/ai-product-strategy-notes]]

## 待解问题

- `MandalaInterpreterAgent` 的状态是否应该和现有 `LayeredOrchestrator` 阶段一一对应。
