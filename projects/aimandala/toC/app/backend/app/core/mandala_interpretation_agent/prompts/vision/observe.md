请把这张曼陀罗原画作拆成可供后续解读使用的视觉证据。

输入说明：
- 如果只提供一张图，它就是用户原画作。
- 如果同时提供两张图，第一张是用户原画作，第二张是三圈标记图。
- 第二张图只用于辅助确认内圈、中圈、外圈边界；不要把第二张图中的标记线颜色、线条粗细或覆盖痕迹写成画作内容。

观察目标：
- 先确认画面的整体结构和三圈边界，再按内圈、中圈、外圈逐层记录可见内容。
- 优先记录画面中直接可指认的事实：颜色、形状、大小、密度、重复、留白、相邻关系、包围关系、切分关系。
- 每个视觉单元都要写出能在画面上直接找到的依据。
- 如果某处颜色、边界或圈层归属不稳定，放入 `uncertainties`。

边界处理：
- 只观察用户原画作；三圈标记图只用于确认圈层边界，不作为画作内容。
- 模板自带黑色线稿不作为画作元素，除非用户明显主动填涂或加粗。
- 画作外边以内的留白要记录；如果留白切分、包围或隔开其他元素，单独记为 `blank_space`，并标注 `metal_candidate=true`。
- 模板线、标记线或其他非画作内容要写入 `excluded_marks`。

输出要求：
- 必须包含 `global_visual_summary`、`circles.inner`、`circles.middle`、`circles.outer`、`evidence_summary`、`excluded_marks`、`uncertainties`。
- 每个圈至少输出 1 个 `visual_units`。
- 每个 `visual_units` 必须包含：
  `id`、`position`、`source_type`、`include_in_interpretation`、`exclude_reason`、`color`、`color_confidence`、`shape`、`size_tendency`、`adjacency`、`is_blank_space`、`metal_candidate`、`visible_evidence`、`confidence`。
- `source_type` 只能使用：`user_painted`、`blank_space`、`template_line`、`therapist_marker`、`uncertain`。
- 只有 `user_painted` 和 `blank_space` 通常可以设置 `include_in_interpretation=true`。
- 如果发现模板线、三圈标记线或太不确定的内容，要写入 `excluded_marks` 或 `uncertainties`。

三圈边界：{circle_boundaries_json}
