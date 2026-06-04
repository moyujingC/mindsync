# foundation_image_reading 黄金样例集

> 状态：draft
> 用途：基础层图像解读 prompt 调试、真实模型回归、人工审核

本目录是 11 个完整解读案例的基础层图像解读黄金样例入口。

当前目标结构只使用：

- `visual_observation`
- `element_sensing`
- `intra_circle_relations`
- `cross_circle_flow`
- `evidence_links`

处理边界：

- 基础层图像解读只完成“画面视觉语言 -> 曼陀罗基础层语言”。
- 可以识别五行、圈内五行关系和三圈能量流动。
- 不输出财富、关系、身体、心理或疗愈建议。
- 不生成 Lite / Pro 报告正文。

当前 11 个 JSON 的状态：

- `visual_observation` 已从前一轮人工校准视觉观察迁入。
- `element_sensing`、`intra_circle_relations`、`cross_circle_flow`、`evidence_links` 暂为空结构，等待使用真实 Qwen 视觉模型按新 prompt 重跑后补齐。

后续黄金样例应以真实模型输出 + 人工审核修正为准。

## 当前校准说明

- `case-001` 已按 2026-05-25 极简 `observe.md` 真实模型结果修正校准口径。
- 后续评估不再把“中圈必须只有粉色方块环”作为硬性基线；应结合三圈标记图、原图视觉连续性和人工复核结果判断。
- 历史回归输出保留原状，不作为本轮基线同步对象。
- 其它 case 仍保持原始样例状态，后续如进入同一轮人工校准，再逐个按各自审定结果更新。
