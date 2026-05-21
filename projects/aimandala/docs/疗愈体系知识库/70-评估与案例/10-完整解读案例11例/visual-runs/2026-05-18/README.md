# stage-03 视觉识别审核运行索引

> 生成日期：2026-05-18
> 模型：qwen-vl-max-latest / DashScope；文字模型门禁：DeepSeek v4。
> 用途：只用于人工审核视觉识别，不代表最终五行解读或财富报告。

| 案例 | 模型 | 状态 | 内圈单元 | 中圈单元 | 外圈单元 | 排除项 | 不确定项 | 审核入口 |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| case-001 | qwen-vl-max-latest | success | 2 | 2 | 2 | 1 | 0 | [case-001/review.md](case-001/review.md) |
| case-002 | qwen-vl-max-latest | success | 1 | 3 | 1 | 1 | 0 | [case-002/review.md](case-002/review.md) |
| case-003 | qwen-vl-max-latest | success | 3 | 4 | 3 | 2 | 2 | [case-003/review.md](case-003/review.md) |
| case-004 | qwen-vl-max-latest | success | 3 | 2 | 3 | 1 | 0 | [case-004/review.md](case-004/review.md) |
| case-005 | qwen-vl-max-latest | success | 3 | 4 | 4 | 2 | 0 | [case-005/review.md](case-005/review.md) |
| case-006 | qwen-vl-max-latest | success | 3 | 4 | 3 | 1 | 2 | [case-006/review.md](case-006/review.md) |
| case-007 | qwen-vl-max-latest | success | 3 | 2 | 2 | 1 | 0 | [case-007/review.md](case-007/review.md) |
| case-008 | qwen-vl-max-latest | success | 3 | 1 | 2 | 1 | 0 | [case-008/review.md](case-008/review.md) |
| case-009 | qwen-vl-max-latest | success | 1 | 1 | 1 | 0 | 0 | [case-009/review.md](case-009/review.md) |
| case-010 | qwen-vl-max-latest | success | 3 | 4 | 3 | 1 | 0 | [case-010/review.md](case-010/review.md) |
| case-011 | qwen-vl-max-latest | success | 3 | 3 | 2 | 1 | 0 | [case-011/review.md](case-011/review.md) |

## 审核建议

- 先从 `case-001/review.md` 开始，对照原画作和三圈标记图。
- 重点检查：模板黑线是否排除、三圈标记线是否排除、圈内留白是否识别为金候选、关键颜色是否准确、元素相邻关系是否足够。
- `case-009` 每圈只有 1 个视觉单元，建议优先检查是否识别过粗。
- 人工审核结论只改 `review.md`，不要直接改 `stage03_visual_evidence.json`，保留模型原始输出用于复盘。
