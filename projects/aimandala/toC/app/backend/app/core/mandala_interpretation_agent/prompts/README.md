# Mandala Prompt Index

## Vision
- `vision/user.md`: stage-03 视觉识别输入，要求只输出视觉证据 JSON。

## Thesis
- `thesis/system.md`: stage-10 主轴选择的 system prompt。
- `thesis/user.md`: stage-10 主轴选择的 user prompt。

## Report
- `report/system.md`: 最终报告生成的 system prompt。
- `report/user.md`: 最终报告生成的 user prompt。
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
