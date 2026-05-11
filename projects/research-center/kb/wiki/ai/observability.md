# observability（可观测性）

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-11
> source_of_truth：projects/research-center/kb/wiki/ai/observability.md

## 当前结论

在 Agent 产品里，observability（可观测性）不只是传统意义上的日志、报错和性能指标，还包括 Agent 做了什么、为什么这么做、卡在了哪里、最后有没有完成任务。

如果没有这层可观测性，团队通常只能看到“工具被调用了”，却不知道 Agent 为何失败，也不知道产品应该怎么改。

## 适用对象

- 项目应用
- 自媒体分享
- 课程开发

## 核心结构

- 传统软件可观测性更关注系统状态。
- Agent 可观测性还要关注任务状态和意图状态。
- 因此它天然会和 [[rationale]] [rationale](./rationale.md)、feedback（反馈）、tool usage（工具使用）一起出现。
- 它的目标不是“记录更多东西”，而是支持更快诊断和更快迭代。

## 依据

- sources：
  - [[Teddy Riker《为 Agent 设计产品》]] [Teddy Riker《为 Agent 设计产品》](../../sources/ai/2026-05-11-Teddy-Riker-为-Agent-设计产品-宝玉译.md)

## 边界

这页当前聚焦 Agent 产品设计，不展开基础设施监控或传统 APM（应用性能监控）实现。

## 待更新

- 后续补充 Agent 评测、回放、轨迹分析等更完整的观测框架。
