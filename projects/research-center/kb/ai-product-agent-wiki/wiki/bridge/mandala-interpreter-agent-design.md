# MandalaInterpreterAgent Design

## Definition

`MandalaInterpreterAgent` 是一镜一梳报告链路之上的解读 Agent。它的第一版目标不是生成 Lite / Pro 报告，也不是重新识别三圈，而是帮助用户看懂已经生成的报告、证据链和不确定性。

## Why It Matters

一镜一梳已经有 To C MVP 主路径、Lite / Pro 报告生成和 16 阶段解读流程。如果直接把这些能力拆成多 Agent，容易把已有 workflow 搞复杂。

这也是为什么解释 Agent 更适合作为第二阶段：先把报告生成 Workflow Agent 化，等生成链路稳定后，再在其产物之上做解释层。

更稳妥的做法是先做一个单 Agent：它只消费现有报告链路的事实，把复杂的解读过程翻译成用户能理解的话，并在证据不足、边界不清或风险较高时进入降级或人工介入。

## Scope

### Goal

帮助用户理解 Lite / Pro 报告：

- 解释报告为什么这样说
- 摘要关键证据
- 说明哪些判断来自已有 stage
- 表达不确定性和建议边界
- 在需要时标记人工介入

### Inputs

- 用户上传图片与补充描述
- 人工确认后的三圈边界
- 用户选择的报告层级：Lite 或 Pro
- `school_interpretation_chain`
- stage 09-16 的过程引用
- Lite / Pro 报告草稿或最终报告
- 最终报告质检结果

### Outputs

- 用户可读解释
- 证据摘要
- 不确定性说明
- 后续轻量建议
- 降级原因
- 人工介入标记

### Non-goals

- 不替代三圈人工确认
- 不重跑视觉识别
- 不生成 Lite / Pro 报告正文
- 不发明 stage 09-12 之外的新判断
- 不越过 Lite / Pro 报告本身的建议边界
- 不把心理觉察内容说成诊断结论

## Tools

### `read_interpretation_context`

读取用户输入、主题、报告层级和三圈确认结果。

结构化输出应包含：

- `interpretation_id`
- `user_goal`
- `report_tier`
- `circle_confirmation`
- `user_description`
- `created_at`

### `read_school_interpretation_chain`

读取逐圈流派判断链。

结构化输出应包含每一圈的：

- 圈层：`inner / middle / outer`
- 中文圈层标签
- 元素
- 色阶
- 状态：`太过 / 正常 / 不足 / 未判定`
- 主题解释
- 现实表现
- 疗愈方向
- 来源路径与查询键

### `read_report_stage_refs`

读取 stage 09-16 的过程引用和最终报告质检结果。

重点读取：

- `stage-09-evidence-consolidation`
- `stage-10-core-thesis-selection`
- `stage-11-user-facing-framing`
- `stage-12-healing-direction-and-report-branching`
- `stage-13-lite-draft`
- `stage-14-pro-draft`
- `stage-15-visual-assets`
- `stage-16-final-report`

### `summarize_evidence_for_user`

把证据链转成通俗解释。

它只能改写表达方式，不能新增解释来源。输出中要保留简化证据引用，让用户知道这段解释来自哪类证据。

### `check_guardrails`

检查解释是否越过边界。

重点检查：

- 是否新增底层判断
- 是否把可能性说成确定结论
- 是否给出诊断或治疗承诺
- 是否跳过证据不足说明
- 是否需要人工复核

## State Machine

### `collecting_context`

读取用户输入、三圈确认、报告层级和报告上下文。

进入下一步条件：最小上下文齐全。

失败出口：

- 缺少三圈确认：`degraded`
- 缺少报告层级：`degraded`

### `checking_evidence`

读取 `school_interpretation_chain` 和 stage refs，判断证据是否足够支撑解释。

进入下一步条件：关键证据链可追溯。

失败出口：

- 缺少关键 stage refs：`degraded`
- 证据冲突或质检不通过：`needs_manual_review`

### `explaining_report`

把已有报告和证据链转成用户可读解释。

进入下一步条件：解释内容都能回指已有报告或 stage refs。

失败出口：

- 解释无法回指证据：回到 `checking_evidence`

### `checking_boundaries`

执行 guardrails 检查。

进入下一步条件：没有越过建议边界，且不需要人工复核。

失败出口：

- 高风险或边界不清：`needs_manual_review`
- 轻微证据不足但可解释：`degraded`

### `needs_manual_review`

标记需要人工介入。

触发条件包括：

- stage refs 冲突
- 最终质检不通过
- 用户问题要求诊断或治疗承诺
- Agent 无法判断解释是否越界

### `completed`

输出用户可读解释、证据摘要、不确定性和轻量建议。

### `degraded`

输出保守解释。

适用场景：

- 缺少部分非关键证据
- 只能解释报告正文，不能解释完整过程链
- 可视化资产失败但已有 fallback text

## Trace

Trace 应记录能复盘决策的关键事件，而不是只保存最终文本。

最小字段：

- `task_id`
- `interpretation_id`
- `user_goal`
- `report_tier`
- `state_from`
- `state_to`
- `tool_name`
- `tool_input_summary`
- `tool_output_summary`
- `stage_refs_used`
- `decision_reason`
- `guardrail_result`
- `fallback_taken`
- `manual_review_reason`

对一镜一梳来说，stage refs 是 trace 的事实锚点。没有 stage refs，Agent 只能解释“自己说了什么”，不能解释“项目链路为什么得出这个判断”。

## Evals

第一批 eval 可以覆盖四类样本：

1. 典型 Lite 报告：解释是否简洁、温和、能回到画面依据。
2. 典型 Pro 报告：解释是否能展开逐圈证据、机制和疗愈路径。
3. 证据不足样本：是否说明不确定性，而不是强行给结论。
4. 边界风险样本：是否拒绝诊断承诺，必要时进入人工介入。

抽象样本见 [[./mandala-interpreter-agent-evals]]。

评测维度：

- 最终解释是否解决用户问题
- 证据引用是否正确
- 是否新增底层判断
- 是否正确表达不确定性
- 是否触发应有 guardrails
- 是否记录可复盘 trace

## Guardrails

`MandalaInterpreterAgent` 的护栏应放在解释前、中、后，而不是只在最终输出后检查。

### Product Boundary

- 一镜一梳是个人觉察和轻疗愈产品，不是诊断工具。
- Agent 只能解释已有报告，不能做新的心理判断。
- 建议应保持轻量、可执行、非医疗化。

### Technical Boundary

- 工具不能绕过人工三圈确认。
- 解释必须能回指报告、`school_interpretation_chain` 或 stage refs。
- 如果 stage refs 缺失或冲突，不能输出完整解释。
- 如果用户问题要求确定性诊断，必须降级或人工介入。

## PM View

PM 应把这个 Agent 当作“报告理解助手”，而不是新的报告生成产品。

它的价值是降低用户理解成本：

- 把术语翻译成人话
- 解释证据从哪里来
- 告诉用户哪些部分是确定的，哪些只是可能性
- 帮用户找到下一步轻量行动

## Dev View

开发者实现时应先保持单 Agent，不拆 `VisionAgent`、`KnowledgeAgent` 或 `ReviewerAgent`。

最小实现顺序：

1. 先把 context、school chain 和 stage refs 作为只读工具。
2. 再补 trace 字段。
3. 再补 guardrails 检查。
4. 最后用固定样本做 eval。

## Related Atoms

- [[../../atoms/bridge/interpreter-agent-explains-existing-evidence]]
- [[../../atoms/bridge/stage-refs-anchor-agent-trace]]
- [[../../atoms/bridge/mandala-agent-evals-must-cover-boundaries]]
- [[../../atoms/bridge/mandala-agent-evals-check-traceability]]
- [[../../atoms/dev/single-agent-before-multi-agent]]
- [[../../atoms/dev/trace-enables-agent-explainability]]
- [[../../atoms/bridge/guardrails-belong-to-product-and-technical-boundaries]]

## Related Concepts

- [[./aimandala-agent-mapping]]
- [[./mandala-interpreter-agent-evals]]
- [[./mandala-interpreter-agent-examples]]
- [[./pm-to-agent-architecture]]
- [[../dev/single-agent-design]]
- [[../dev/tool-design]]
- [[../dev/state-machine]]
- [[../dev/tracing]]
- [[../dev/evals]]
- [[../dev/guardrails]]

## Related Project Facts

- 一镜一梳 To C MVP 当前主路径：上传、人工三圈确认、Lite / Pro 选择、生成、查看报告。
- Lite / Pro 流派保真报告生成要求保留 `school_interpretation_chain`。
- 16 阶段流程中，stage 09-16 覆盖证据整合、主轴选择、用户表达框架、Lite / Pro 分流、报告草稿、可视化资产和最终质检。

## Open Questions

- 用户侧是否需要展示简化 trace，还是先只在内部用于解释和复盘。
- `MandalaInterpreterAgent` 是否应该在报告生成 Agent 稳定后再单独落地。
