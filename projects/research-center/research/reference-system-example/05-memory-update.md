# 参考材料摄取样例 05：Memory Update

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-05
> source_of_truth：projects/research-center/research/reference-system-example/05-memory-update.md
> 项目：研究中心
> 阶段：knowledge-ingest
> depends_on：
> - projects/research-center/research/reference-system-example/04-review-feedback.md

这份文档演示 `review-feedback-to-memory` 在收到创作者反馈后的最小更新动作。

## 1. 新增 review_event

- `source_id`：`reference-system-example-01`
- `reviewed_at`：`2026-04-05`
- `value_type`：`hybrid`
- `system_guess`：本条可升格为 hard constraint
- `final_decision`：`revise`
- `keep`：
  - 先按价值类型分流
  - 聊天记录可成为知识候选
- `remove`：
  - 直接升格为既定 hard constraint
- `rewrite_direction`：
  - 先写成候选原则和候选约束

## 2. 更新后的稳定模式候选

- 创作者偏好系统先做清楚收束，但不喜欢过早定论
- 对系统级规则，更接受“candidate”语气，而不是一步写死

## 3. 对 MEMORY.md 的更新建议

建议补一条“当前稳定偏好”候选：

- 喜欢系统先清楚收束判断，但不喜欢在证据不足时提前升格为最终原则

建议补一条“当前 hard constraints”暂不更新说明：

- 当前不新增正式 hard constraint
- 保留为高优先级候选，等待后续更多 review 验证

## 4. 对后续 skill 的影响

以下 skill 后续运行时应读取本次更新：

- `reference-intake-routing`
- `insight-extraction`
- `expression-extraction`
- `review-feedback-to-memory`

## 5. 样例结论

这次样例说明：

- 系统可以从聊天记录中提炼规则
- 但升格为长期规则之前，仍需要创作者通过 review 控制节奏
