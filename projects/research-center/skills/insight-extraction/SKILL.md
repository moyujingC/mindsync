---
name: insight-extraction
description: 从参考材料中提炼信息、观点、框架和方法，形成可审阅的认知层分析卡。
owner: Research & Knowledge Lead
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - research_knowledge
  - ceo
when_to_use: >
  当参考材料的核心价值在于信息、观点、框架或方法，需要先形成认知层拆解，再决定是否入库或 handoff 时使用。
inputs:
  - reference intake
  - source material
  - preference memory
outputs:
  - reference analysis card
handoff_to:
  - Research & Knowledge Lead
  - Content Lead
  - CEO
---

# Insight Extraction

## 目标

把“这份材料说了什么”收束成“有哪些值得保留的信息、观点、框架和方法”，而不是停留在摘要层。

## 适用场景

- `value_type` 为 `insight`
- `value_type` 为 `hybrid` 且当前先做知识层拆解
- 需要判断哪些内容值得进入知识库
- 需要给 `Content Lead` 或创作者提供认知层基础输入

## 不适用场景

- 当前更看重的是表达风格、语气或结构
- 当前还没有明确 intake
- 当前任务已经进入正式 review 反馈写回阶段

## 必读上下文

1. 当前 `reference intake`
2. 原始参考材料
3. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/kb/preference-memory/MEMORY.md`
4. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/kb/preference-memory/review-patterns.yaml`
5. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-05-参考材料摄取与偏好记忆系统-SPEC.md`

## 执行步骤

1. 先读取偏好记忆，确认当前有哪些稳定偏好和 hard constraints。
2. 区分材料中的：
   - 事实信息
   - 具体观点
   - 框架结构
   - 方法启发
3. 写清哪些点值得保留，为什么值得保留。
4. 写清哪些点不适合保留，为什么不适合。
5. 如果材料是 `chat_log` 或 `ai_output`，额外提炼：
   - 创作者已显露的判断
   - 系统输出中仍然偏 AI 化的部分
6. 写成可供创作者 review 的分析卡。

## 输出格式

建议基于：

- `/Users/xinran/Downloads/dev/mindsync/projects/research-center/skills/insight-extraction/templates/reference-analysis-card.md`

最小结果至少包含：

- 材料摘要
- 核心信息点
- 核心观点
- 框架或方法
- 可迁移点
- 不可迁移点
- 风险提醒
- 是否建议入知识库

## 质量检查项

- 是否先读取了偏好记忆
- 是否区分了信息、观点、框架和方法
- 是否避免把抽象空话包装成 insight
- 是否保留了不适合照搬的边界
- 是否足够支撑后续 review

## Handoff 规则

- 若下一步是创作者 review，应直接输出可审阅分析卡
- 若下一步还需要表达层判断，可继续 handoff 给 `Content Lead`
- 若当前已足够稳定，可在 review 后进入 `knowledge-ingest`
