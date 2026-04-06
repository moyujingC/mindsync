# 外部链接摄取样例 05：Memory Update

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-05
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/research/reference-link-example/05-memory-update.md
> 项目：研究中心
> 阶段：knowledge-ingest
> depends_on：
> - /Users/xinran/Downloads/dev/mindsync/projects/research-center/research/reference-link-example/04-review-feedback.md

## 1. 新增 review_event

- `source_id`：`reference-link-example-01`
- `reviewed_at`：`2026-04-05`
- `value_type`：`hybrid`
- `system_guess`：本条可进一步升格为原则或表达模式
- `final_decision`：`revise`
- `keep`：
  - 写作质量关键在于判断
  - 先给场景，再给判断
  - 不适合直接照搬略满口气
- `remove`：
  - 直接升格为正式原则
  - 直接视为长期表达模式
- `rewrite_direction`：
  - 先保留为候选知识和候选表达模式

## 2. 更新后的稳定模式候选

- 创作者喜欢“具体场景 -> 判断收束”的结构
- 创作者不喜欢结论口气过满的表达
- 外部优质长文更适合作为候选层参考，而不是立即升格

## 3. 对 MEMORY.md 的更新建议

建议新增一条“当前稳定偏好”候选：

- 喜欢通过具体场景承载判断，不喜欢只给抽象结论

建议新增一条“当前常见不满意点”候选：

- 对外部文章常见的不满是结论太满、像在替读者下最后判决

## 4. 对后续 skill 的影响

以下 skill 后续运行时应读取本次更新：

- `insight-extraction`
- `expression-extraction`
- `knowledge-relink-maintenance`

## 5. 样例结论

这次样例说明：

- 外部链接完全可以进入与聊天记录相同的主链
- 但外部链接更容易同时产生观点候选和表达模式候选
- 系统仍应保持“先候选、后升格”的节奏
