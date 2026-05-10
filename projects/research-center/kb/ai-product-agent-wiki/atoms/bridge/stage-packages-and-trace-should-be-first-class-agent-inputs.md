# Stage Packages And Trace Should Be First Class Agent Inputs

## Claim

报告生成 Agent 应把 stage packages、trace 和 knowledge runtime 当作一等输入，而不是把 prompt 当成唯一中心。

## Type

- pattern

## Applies To

- bridge

## Source

- [[../../wiki/bridge/mandala-report-agent-path]]

## Notes

- 这样可以减少上下文丢失、来源串用、stage 顺序错乱和 debug/report/review 混在一起的问题。
- Agent 的价值在于让中间过程显式化，而不是只换一个更大的 prompt。

## Related Concepts

- [[../../wiki/bridge/mandala-report-agent-path]]
- [[../../wiki/dev/tool-design]]
- [[../../wiki/dev/tracing]]

