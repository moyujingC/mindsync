# stage package 和 trace 应是一等 Agent 输入

## 断言

报告生成 Agent 应把 stage packages、trace 和 knowledge runtime 当作一等输入，而不是把 prompt 当成唯一中心。

## 类型

- pattern

## 适用范围

- bridge

## 来源

- [[../../wiki/bridge/mandala-report-agent-path]]

## 备注

- 这样可以减少上下文丢失、来源串用、stage 顺序错乱和 debug/report/review 混在一起的问题。
- Agent 的价值在于让中间过程显式化，而不是只换一个更大的 prompt。

## 相关概念

- [[../../wiki/bridge/mandala-report-agent-path]]
- [[../../wiki/dev/tool-design]]
- [[../../wiki/dev/tracing]]
