---
name: review-feedback-to-memory
description: 把创作者的 review 反馈写回偏好记忆，并判断哪些反馈已形成稳定模式。
owner: Research & Knowledge Lead
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - research_knowledge
  - ceo
when_to_use: >
  当创作者已经对参考材料拆解结果给出 approve、revise 或 reject 反馈，需要把这些反馈正式写回偏好记忆时使用。
inputs:
  - reference analysis
  - creator review feedback
  - current preference memory
outputs:
  - updated preference memory
  - structured review event
handoff_to:
  - Research & Knowledge Lead
  - Content Lead
---

# Review Feedback To Memory

## 目标

把“这次 review 提了什么意见”转成系统可持续使用的偏好记忆，而不是让反馈只停留在聊天记录里。

## 适用场景

- 创作者已对某次参考材料拆解给出明确反馈
- 需要把反馈写入 `MEMORY.md`
- 需要更新 `review-patterns.yaml`
- 需要判断某条反馈是否已升级为稳定偏好

## 不适用场景

- 还没有正式 review 结果
- 当前只有系统自己的猜测，没有创作者确认
- 当前任务只是初步拆解，还没进入 review 阶段

## 必读上下文

1. 当前参考材料任务文档
2. 当前 reference analysis 结果
3. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/kb/preference-memory/MEMORY.md`
4. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/kb/preference-memory/review-patterns.yaml`
5. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-05-参考材料摄取与偏好记忆系统-SPEC.md`

## 执行步骤

1. 先确认本次 review 针对的是哪一份 reference analysis。
2. 把创作者反馈拆成：
   - 保留什么
   - 删除什么
   - 如何改写
   - 是否通过
3. 生成一条新的 `review_event`。
4. 判断该反馈是一次性意见，还是已经重复出现的稳定偏好。
5. 更新 `review-patterns.yaml`。
6. 如有必要，同步更新 `MEMORY.md` 中的稳定偏好、常见不满意点或 hard constraints。
7. 写清本次更新对后续哪些 skill 生效。

## 输出格式

建议基于：

- `templates/review-event-template.yaml`

最小结果至少包含：

- 一条 `review_event`
- 如适用，一条新的 `stable_pattern` 或 `hard_constraint`
- 对 `MEMORY.md` 的必要更新说明

## 质量检查项

- 是否明确本次反馈作用于哪份材料
- 是否区分了单次反馈和稳定偏好
- 是否避免把系统猜测误写成创作者偏好
- 是否保留了足够来源，便于后续回溯
- 是否写清哪些下游 skill 应读取这次更新

## Handoff 规则

- 更新完成后，应默认供以下 skill 读取：
  - `reference-discovery`
  - `insight-extraction`
  - `expression-extraction`
- 如果当前反馈只是一时偏好，不应直接升级为 hard constraint
- 如果当前反馈与既有记忆冲突，应先记录冲突，再等待下一轮确认，不静默覆盖
