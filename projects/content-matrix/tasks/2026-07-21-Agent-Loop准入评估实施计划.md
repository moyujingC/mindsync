> 状态：completed
> owner：Product Spec Lead / Engineering
> last_updated：2026-07-21
> source_of_truth：projects/content-matrix/tasks/2026-07-21-Agent-Loop准入评估实施计划.md

# Agent Loop 准入评估实施计划

## 目标

避免把“代码已完成”或单次发布误认为可以启用每周 Agent Loop。只在真实反馈确实改变下一轮研究时积累循环证据。

## 实施

1. 发布反馈模板增加“下一轮研究调整”：是否改变、调整类型和调整说明。
2. 发布反馈回写时保存该字段到研究请求台账。
3. `evaluate:agent-loop` 只读统计真实发布链接与明确调整的闭环。
4. 少于 3 个不同研究请求时报告阻塞；达到 3 个后只提示人工评估，不自动调度。

## 验收

- 未达到 3 轮时不能报告可评估。
- 三个不同研究请求均有真实链接和调整时报告可评估。
- 完整 `npm test` 通过。
