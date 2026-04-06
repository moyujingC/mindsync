---
name: reference-intake-routing
description: 把参考材料输入收束成标准 intake，并按价值类型路由到合适角色。
owner: CEO / Orchestrator
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - ceo
  - research_knowledge
when_to_use: >
  当接收到链接、外部文本、AI 输出、聊天记录或内部草稿，需要先判断它为什么值得处理、该走哪条流以及下一步该交给谁时使用。
inputs:
  - source material
  - creator note
  - current project anchor
outputs:
  - reference intake
  - routing decision
handoff_to:
  - Research & Knowledge Lead
  - Content Lead
---

# Reference Intake Routing

## 目标

把“我丢给系统一份材料”收束成稳定的 intake artifact，避免后续角色每次都从零理解输入。

## 适用场景

- 创作者主动提供参考材料
- CEO 需要把材料标准化后再交给下游
- 需要先判断这是 `insight`、`expression` 还是 `hybrid`
- 需要明确先交给 `Research`、`Content` 还是两者串行

## 不适用场景

- 材料已经完成 intake，当前阶段是拆解或 review
- 当前任务重点已经是正式入库
- 当前输入根本不是参考材料，而是产品、架构或实现任务

## 必读上下文

1. 当前项目 `PROJECT.md`
2. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-05-参考材料摄取与偏好记忆系统-SPEC.md`
3. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/kb/preference-memory/MEMORY.md`

## 执行步骤

1. 先判断材料类型：
   - `external_link`
   - `external_text`
   - `ai_output`
   - `chat_log`
   - `internal_draft`
2. 再判断创作者为什么在意这份材料。
3. 判断价值类型：
   - `insight`
   - `expression`
   - `hybrid`
4. 写清本轮最希望提炼什么，而不是泛泛写“帮我分析”。
5. 判断下一步主责角色：
   - `insight` 先给 `Research & Knowledge Lead`
   - `expression` 先给 `Content Lead`
   - `hybrid` 先给 `Research` 再交 `Content`，或按任务语境另行说明
6. 写清本轮禁止越界的部分。

## 输出格式

建议基于：

- `/Users/xinran/Downloads/dev/mindsync/projects/research-center/skills/reference-intake-routing/templates/reference-intake-template.md`

最小结果至少包含：

- 输入材料类型
- 原始材料位置或正文
- 创作者原始判断
- 价值类型
- 提炼重点
- 下一角色
- 禁止越界项

## 质量检查项

- 是否先判断“为什么值得处理”，而不是先按平台分流
- 是否明确 `insight` / `expression` / `hybrid`
- 是否写清下一角色
- 是否避免一份 intake 同时把所有人都拉进来

## Handoff 规则

- intake 完成后，应交给明确的下一角色继续，不停留在 CEO
- 若是 `hybrid`，应写清先后顺序，而不是让两个角色平行各做各的
- 如果创作者已给出强约束，应在 intake 中显式保留，不可在后续阶段静默丢失
