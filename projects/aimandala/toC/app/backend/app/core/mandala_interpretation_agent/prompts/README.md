# Mandala Prompt Index

## Vision
- `vision/observe_visual.md`: Qwen/DashScope 视觉模型使用，只输出画面整体观察、三圈观察和圈内视觉单元。
- `vision/observe.md`: 历史完整基础层 prompt，保留为人工参考，不作为当前运行入口。

## Foundation
- `foundation/analyze_from_visual.md`: DeepSeek v4 文本模型使用，基于 `visual_observation` 生成圈内五行识别、圈内关系和三圈能量流动。

## Thesis
- `thesis/system.md`: stage-10 主轴选择的 system prompt。
- `thesis/select.md`: stage-10 主轴选择 prompt。

## Report
- `report/system.md`: 最终报告生成的 system prompt。
- `report/write.md`: 最终报告生成 prompt。
- `report/rewrite_system.md`: 报告结构修正的 system prompt。
- `report/rewrite_user.md`: 报告结构修正的 user prompt。
- `report/structure_lite.md`: Lite 报告结构模板。
- `report/structure_pro.md`: Pro 报告结构模板。
- `report/config.json`: report_mode 到结构模板的映射。

## Shared JSON
- `../../llm/prompts/json/object_system.md`: 通用 JSON 输出 system prompt。
- `../../llm/prompts/json/schema_user.md`: 通用 JSON schema user prompt。

## API Fallback
- `../../api/prompts/fallback/seeded_report_lite.md`: API seeded Lite 文案。
- `../../api/prompts/fallback/seeded_report_pro.md`: API seeded Pro 文案。
