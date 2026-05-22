# foundation_image_reading 输入对照测试计划

> 状态：draft
> 版本：0.1.0
> date：2026-05-21
> owner：CEO / Knowledge Base

本文用于规划 11 个完整案例的基础层图像解读输入对照测试。

## 目标

验证视觉模型能否一次完成基础层图像解读：

1. 画面观察。
2. 圈内五行识别。
3. 圈内五行关系。
4. 三圈能量流动。
5. 证据链接。

测试只评估基础层输出，不评估财富、关系、身体、心理或疗愈报告内容。

## 输入

每个案例输入两张图：

- 用户原画作：`assets/case-xxx-mandala.*`
- 三圈标记图：`assets/case-xxx-mandala-3q.*`

三圈标记图只用于确认边界。标记线颜色、线条粗细和覆盖痕迹不属于画作内容。

## 输出

每个案例输出：

- `foundation_image_reading.json`
- `case-xxx-review.md`
- `env_check.json`

输出结构必须遵循：

- [../../50-结构化知识单元/16-foundation-image-reading-schema.yaml](../../50-结构化知识单元/16-foundation-image-reading-schema.yaml)

## 评估重点

- 是否准确描述整体画面感和三圈内容。
- 是否按视觉单元识别五行，而不是给整圈贴标签。
- 是否把留白识别为画作内容，并在五行中按金处理。
- 是否记录同圈元素之间的相邻、隔开、包围、切分、无根等关系。
- 是否只用三圈结构判断跨圈能量流动，不使用跨圈五行生克。
- 是否每条基础层判断都有视觉证据。
- 是否没有混入财富、关系、身体、心理或疗愈建议。

## 模型要求

- 必须使用真实视觉模型。
- 视觉模型优先使用 Qwen/DashScope。
- 文字整理如需使用文本模型，优先使用 DeepSeek v4。
- 输出必须记录模型名称、base_url、时间和关键参数。

## 人工审核

人工审核使用：

- [03-foundation-image-reading审核表模板.md](03-foundation-image-reading审核表模板.md)

审核结果应优先反写到：

- `foundation_image_reading` prompt。
- `16-foundation-image-reading-schema.yaml`。
- `05-foundation-image-reading黄金样例集/`。
