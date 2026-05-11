# rationale（调用理由）

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-11
> source_of_truth：projects/research-center/kb/wiki/ai/rationale.md

## 当前结论

`rationale` 可以理解成 Agent 在调用工具前后，对“为什么这样做”的简短解释。

它的价值不在于把每一步都说得很漂亮，而在于为产品和工程团队提供一个低成本窗口，帮助理解 Agent 的真实意图、失败原因和上下文缺口。

## 适用对象

- 项目应用
- 自媒体分享
- 课程开发

## 核心结构

- 只看工具调用日志，通常只能看到“做了什么”。
- 加上 `rationale`，才能更接近“它为什么这么做”。
- 这使 `rationale` 成为 [[observability]] [observability](./observability.md) 的一部分，而不只是附加说明。
- 在 Agent 产品里，`rationale` 也能反过来指导工具设计和提示词设计。

## 依据

- sources：
  - [[Teddy Riker《为 Agent 设计产品》]] [Teddy Riker《为 Agent 设计产品》](../../sources/ai/2026-05-11-Teddy-Riker-为-Agent-设计产品-宝玉译.md)

## 边界

`rationale` 不是事实本身，而是 Agent 的自我解释。它有参考价值，但不能被直接当作绝对真实的因果说明。

## 待更新

- 后续补充 `rationale` 和 trace（执行轨迹）、feedback（反馈）之间的区别。
