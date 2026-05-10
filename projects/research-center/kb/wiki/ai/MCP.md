# MCP（模型上下文协议）

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-11
> source_of_truth：projects/research-center/kb/wiki/ai/MCP.md

## 当前结论

MCP（Model Context Protocol，模型上下文协议）可以先通俗理解成：让大模型或 Agent 以统一方式连接外部工具、数据源和系统能力的一层标准接口。

但在当前知识页引用它时，重点不是“有没有 MCP”，而是“只有一个 MCP 入口仍然不够，Agent 还需要被正确引导、反馈和观测”。

## 适用对象

- 自己学习
- 项目应用
- 自媒体分享

## 核心结构

- MCP 解决的是“怎么接”。
- Agent 产品设计还要解决“怎么让它成功完成任务”。
- 所以 MCP 更像基础接线层，不等于完整的 Agent 体验设计。
- 这也是它经常和 [[Agent]] [Agent](./Agent.md)、[[rationale]] [rationale](./rationale.md)、[[observability]] [observability](./observability.md) 一起出现的原因。

## 依据

- sources：
  - [[Teddy Riker《为 Agent 设计产品》]] [Teddy Riker《为 Agent 设计产品》](../../sources/ai/2026-05-11-Teddy-Riker-为-Agent-设计产品-宝玉译.md)

## 边界

这页当前只收录产品和工程实践语境里的 MCP，不展开协议规范本身的细节。

## 待更新

- 后续可补 OpenAI、Anthropic、Claude Code、工具平台等具体实现案例。
