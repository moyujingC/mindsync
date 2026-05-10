# Mandala Report Agent Path

## Definition

`Mandala Report Agent Path` 是一镜一梳把现有报告生成 workflow 先改造成 Agent 的路线。它的优先级高于解释 Agent，因为当前最需要先稳定的是 Lite / Pro 报告生成过程本身。

第二阶段才是 `MandalaInterpreterAgent`：它基于稳定的报告、证据链、trace 和 guardrails，回答用户对报告的追问。

## Why It Matters

最近一段时间围绕报告生成 workflow 的提交，反复在修同一类问题：

- 上下文容易丢
- 来源容易串
- stage 顺序容易乱
- debug / report / review 容易混
- 生成结果和 truth source 容易脱节

这些问题不是简单换 prompt 就能消掉，也不适合先用解释 Agent 兜底。更稳妥的顺序是：

1. 先把报告生成 workflow 变成受控的 Report Agent。
2. 再把报告解释层抽成 Interpreter Agent。

## Phase 1: Report Generation Agent

这个阶段的目标是把现有的 Lite / Pro 报告生成链路 Agent 化，而不是把所有东西改成自由对话。

### Responsibilities

- 读取记录、图片、知识包和 stage package
- 按固定 stage 组织报告生成
- 产出结构化中间结果
- 在每个关键步骤做证据、来源和边界检查
- 生成 Lite / Pro 报告草稿和最终质检结果

### First Class Inputs

- `stage package`
- `knowledge runtime`
- `trace`
- `report contract`
- `guardrails`
- `fixture / test sample`

### Failure Modes It Should Prevent

- 中间上下文丢失
- 直接拿 prompt 替代 stage 组织
- 证据链和结果脱节
- 诊断式或越界式输出混入报告
- 最后一步才发现缺字段或缺来源

## Phase 2: Report Interpretation Agent

只有在报告生成 Agent 稳定后，才做解释 Agent。

它的任务是：

- 解释已有报告
- 回指 stage refs 和证据链
- 回答用户对 Lite / Pro 的追问
- 遇到诊断、治疗或严重程度问题时拒绝或降级

它不应该重做报告生成，也不应该重算三圈。

## PM View

对用户来说，最先需要稳定的是“报告生成是否可信”。如果生成本身还在反复改，过早加解释层只会把复杂度往后推。

所以产品上应该先把报告生成 Agent 定义成主链，再把解释 Agent 作为后续交互层。

## Dev View

开发者实现时，应该把报告生成 Agent 当成一个受控 workflow agent：

1. 先把 stage packages 作为一等输入。
2. 再把 trace 和 guardrails 纳入每一步。
3. 再让 LLM 只负责每个 stage 内的局部决策。
4. 最后才接解释 Agent，读取稳定产物和 trace。

这比单纯把一个大 prompt 包成 Agent 更能减少历史错误。

## Related Atoms

- [[../../atoms/bridge/report-generation-agent-should-come-before-explanation-agent]]
- [[../../atoms/bridge/stage-packages-and-trace-should-be-first-class-agent-inputs]]
- [[../../atoms/bridge/interpreter-agent-explains-existing-evidence]]
- [[../../atoms/bridge/agent-design-should-encode-failure-handling]]

## Related Concepts

- [[./aimandala-agent-mapping]]
- [[./mandala-interpreter-agent-design]]
- [[./mandala-interpreter-agent-evals]]
- [[./mandala-interpreter-agent-examples]]
- [[./mandala-interpreter-agent-fixture-mapping]]
- [[../dev/agent-loop]]
- [[../dev/tool-design]]
- [[../dev/state-machine]]
- [[../dev/tracing]]
- [[../dev/guardrails]]
- [[../pm/ai-product-principles]]

## Open Questions

- 报告生成 Agent 是否应直接接管现有 `LayeredOrchestrator`，还是先包一层适配器。
- Lite 和 Pro 是否先共用一个 Agent，再按 stage 分支处理。

