# Tracing（追踪）

## 定义

Tracing（追踪）是记录 Agent 执行过程中的关键事件：目标、上下文、工具调用、工具结果、状态变化、模型判断和最终输出。

## 为什么重要

没有 trace，就只能看到结果。结果错了时，很难判断问题来自 prompt、上下文、工具、模型、状态机还是产品边界。

Trace 让 Agent 从黑盒变成可复盘系统。

## PM 视角

产品经理不一定看完整技术日志，但需要能看懂高层 trace：

- Agent 做了哪些步骤？
- 使用了哪些证据？
- 哪一步失败或降级？
- 为什么需要人工介入？
- 最终结果的置信度来自哪里？

这些信息可以转成用户侧解释、客服排障、质量复盘和产品迭代输入。

## Dev 视角

一个实用 trace 不必记录所有 token，但要记录能复盘决策的事件：

- task_id
- user_goal
- state_from / state_to
- tool_name
- tool_input_summary
- tool_output_summary
- decision_reason
- error_type
- fallback_taken
- eval_result

Trace 字段要稳定，否则后续很难做统计、回放和自动评测。

## 相关原子

- [[../../atoms/dev/trace-enables-agent-explainability]]
- [[../../atoms/dev/eval-tool-calls-and-decisions]]

## 相关来源

- [[../sources/building-with-llms-notes]]

## 待解问题

- 一镜一梳是否需要面向用户展示简化 trace，还是先只用于内部调试和质量复盘。
