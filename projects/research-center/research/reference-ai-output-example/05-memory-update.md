# AI 输出文档摄取样例 05：Memory Update

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-05
> source_of_truth：projects/research-center/research/reference-ai-output-example/05-memory-update.md
> 项目：研究中心
> 阶段：knowledge-ingest
> depends_on：
> - projects/research-center/research/reference-ai-output-example/04-review-feedback.md

## 1. 新增 review_event

- `source_id`：`reference-ai-output-example-01`
- `reviewed_at`：`2026-04-05`
- `value_type`：`hybrid`
- `system_guess`：本条更适合作为 AI 输出审阅模式和反例记忆
- `final_decision`：`approve`
- `keep`：
  - 完整性不等于成熟度
  - review 应作为学习信号
  - 太均匀、太标准是 AI 味信号
- `remove`：
  - 无
- `rewrite_direction`：
  - 将相关结论写入偏好记忆和 anti_pattern 候选

## 2. 更新后的稳定模式候选

- 创作者不喜欢：
  - 太均匀
  - 太标准
  - 像完整答卷的 AI 输出
- 创作者更接受：
  - 有取舍感
  - 有判断感
  - 明确哪些还只是候选

## 3. 对 MEMORY.md 的更新建议

建议新增一条“当前常见不满意点”：

- 不喜欢太均匀、太标准、像完整答卷的 AI 输出

建议新增一条“当前稳定偏好”：

- 喜欢系统更早指出“这只是顺滑，不是成熟”

## 4. 对后续 skill 的影响

以下 skill 后续运行时应读取本次更新：

- `insight-extraction`
- `expression-extraction`
- `review-feedback-to-memory`
- `knowledge-relink-maintenance`

## 5. 样例结论

这次样例说明：

- AI 输出文档是非常关键的一类训练材料
- 它不仅能产出知识候选，更能产出高价值的反例和偏好记忆
- 这类输入对系统“越来越像你”尤其重要
