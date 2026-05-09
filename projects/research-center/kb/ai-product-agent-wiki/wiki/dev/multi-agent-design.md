# 多 Agent 设计

## 定义

Multi agent design 是把一个系统拆成多个智能体，让它们按职责、模型能力、工具权限或并行任务协作。

## 为什么重要

多智能体可以让复杂系统更模块化，但也会带来 handoff、协调、成本、延迟和责任归属问题。

## 产品经理视角

产品经理要先问：多 Agent 是否让用户问题更好解决。

值得拆分的情况通常包括：

- 需要不同专业角色分别判断
- 需要不同模型能力，比如视觉、检索、写作、审核
- 有多个可以并行处理的独立任务
- 某些高风险判断必须由独立 reviewer 复核

不值得拆分的情况是：只是为了让架构看起来高级。

## 开发视角

多智能体至少要定义：

- 每个 Agent 的目标和非目标
- 每个 Agent 的工具权限
- handoff 输入输出格式
- 谁做最终决策
- 失败时谁负责降级或人工介入
- trace 如何串联成一次完整任务
- eval 是单 Agent 评，还是整体链路评

如果这些定义不清楚，先回到单智能体。

## 相关 Atom

- [[../../atoms/dev/single-agent-before-multi-agent]]
- [[../../atoms/dev/multi-agent-needs-clear-reason]]

## 相关来源

- [[../sources/building-with-llms-notes]]
- [[../sources/ai-product-strategy-notes]]

## 待澄清问题

- 一镜一梳未来是否需要独立 `ReviewerAgent`，取决于报告风险、质量标准和人工复核成本。

