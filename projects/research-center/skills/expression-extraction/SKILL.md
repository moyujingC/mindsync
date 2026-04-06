---
name: expression-extraction
description: 从参考材料中提炼表达风格、结构、语气和调性，形成可审阅的表达层分析卡。
owner: Content Lead
status: draft
version: 0.1.0
skill_type: role-specific
applies_to:
  - content
  - ceo
  - research_knowledge
when_to_use: >
  当参考材料的核心价值在于表达方式、结构、节奏或调性，需要先形成表达层拆解，再决定是否沉淀为表达模式时使用。
inputs:
  - reference intake
  - source material
  - preference memory
outputs:
  - expression analysis card
handoff_to:
  - Content Lead
  - Research & Knowledge Lead
  - CEO
---

# Expression Extraction

## 目标

把“这份材料为什么好读、好看、好用”拆成可复用的表达层特征，而不是只写“风格不错”。

## 适用场景

- `value_type` 为 `expression`
- `value_type` 为 `hybrid` 且当前进入表达层拆解
- 需要判断某种表达方式是否适合沉淀为表达模式
- 需要给创作者提供“该借什么、不该借什么”的表达层 review 输入

## 不适用场景

- 当前更看重的是信息、观点或方法本身
- 当前没有明确 intake
- 当前任务已进入正式入库或 review 反馈回写

## 必读上下文

1. 当前 `reference intake`
2. 原始参考材料
3. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/kb/preference-memory/MEMORY.md`
4. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/kb/preference-memory/review-patterns.yaml`
5. `/Users/xinran/Downloads/dev/mindsync/company/内容矩阵.md`

## 执行步骤

1. 先读取偏好记忆，确认当前有哪些表达偏好、常见不满意点和 hard constraints。
2. 拆解材料中的：
   - 结构
   - 语气
   - 节奏
   - 调性
   - 开头/展开/结尾方式
3. 写清哪些表达特征值得借。
4. 写清哪些表达特征不应照搬。
5. 如果材料是 `ai_output`，额外指出：
   - 哪些地方仍有明显 AI 味
   - 哪些地方已经接近创作者需要的表达
6. 写成可供创作者 review 的表达分析卡。

## 输出格式

建议基于：

- `/Users/xinran/Downloads/dev/mindsync/projects/research-center/skills/expression-extraction/templates/expression-analysis-card.md`

最小结果至少包含：

- 材料摘要
- 结构特征
- 语气特征
- 节奏特征
- 调性特征
- 值得借的部分
- 不应照搬的部分
- 是否建议沉淀为表达模式

## 质量检查项

- 是否先读取了偏好记忆
- 是否把表达拆成具体维度，而不是泛泛评价
- 是否明确“值得借 / 不应照搬”的边界
- 是否避免替创作者虚构人设或口吻
- 是否能直接支持后续 review

## Handoff 规则

- 若当前只是表达参考，不必强行进入知识库
- 若多次出现相似表达特征，可在 review 后交给 `Research` 做表达模式入库
- 若表达拆解仍依赖未确认事实，应先回退，不直接升格为稳定模式
