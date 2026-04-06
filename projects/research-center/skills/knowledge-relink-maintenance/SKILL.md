---
name: knowledge-relink-maintenance
description: 对知识库和偏好记忆执行每日去重、重链、聚类、升格与归档建议整理。
owner: Research & Knowledge Lead
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - research_knowledge
  - ceo
when_to_use: >
  当需要以 routine 或手动维护方式，对参考材料系统中的知识条目和偏好记忆做周期性整理时使用。
inputs:
  - knowledge base
  - preference memory
  - recent review events
outputs:
  - maintenance report
  - relink recommendations
  - promotion candidates
handoff_to:
  - Research & Knowledge Lead
  - CEO
  - Content Lead
---

# Knowledge Relink Maintenance

## 目标

让知识库不是静态堆积，而是通过周期性整理持续变得更清晰、更可检索、更符合创作者偏好。

## 适用场景

- 每日 routine 触发的知识整理
- 一段时间积累了多条 review 反馈，需要抽稳定模式
- 需要对知识库做去重、重链和升格候选判断
- 需要输出待人工确认的归档或原则候选

## 不适用场景

- 当前还没有形成基本知识条目或 review 事件
- 当前任务是单条材料拆解，不是库级维护
- 当前需要的是即时问答，而不是周期性维护

## 必读上下文

1. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/kb/README.md`
2. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/kb/preference-memory/MEMORY.md`
3. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/kb/preference-memory/review-patterns.yaml`
4. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-05-参考材料摄取与偏好记忆系统-SPEC.md`
5. 最近一轮新增的知识条目与 review 事件

## 执行步骤

1. 扫描近期新增的知识条目和 review 事件。
2. 对相似条目做去重建议，不静默删除。
3. 对新条目与旧条目做重链建议。
4. 聚类重复出现的主题、表达特征和修正模式。
5. 判断哪些内容可从：
   - 素材级
   - 候选级
   - 原则级
   继续升格。
6. 判断哪些内容应降级为归档或低优先级参考。
7. 输出维护报告，明确哪些可自动更新，哪些必须等待人工确认。

## 输出格式

建议基于：

- `/Users/xinran/Downloads/dev/mindsync/projects/research-center/skills/knowledge-relink-maintenance/templates/maintenance-report-template.md`

最小结果至少包含：

- 本次扫描范围
- 新增 review 模式
- 去重建议
- 重链建议
- 升格候选
- 归档建议
- 需人工确认事项

## 质量检查项

- 是否区分了“自动建议”和“需要人工确认”
- 是否避免把一条偶发样本过早升格为原则
- 是否显式引用了偏好记忆而不是只看知识条目
- 是否保留了来源和时间范围，便于后续回溯

## Handoff 规则

- 维护报告默认交给 `Research & Knowledge Lead`
- 若涉及表达模式升格候选，可 handoff 给 `Content Lead`
- 若涉及流程或 routine 调整，可 handoff 给 `CEO / Orchestrator`
- 未经人工确认，不自动删除正式知识条目
