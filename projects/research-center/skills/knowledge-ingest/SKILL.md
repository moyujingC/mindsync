---
name: knowledge-ingest
description: 把研究结论转成结构化长期知识条目，避免研究停留在聊天和散笔记中。
owner: Research & Knowledge Lead
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - research_knowledge
  - ceo
when_to_use: >
  当研究、拆解或方法总结已经形成稳定结论，并且已经完成核查与创作者 review，需要判断哪些内容值得正式进入长期知识库时使用。
inputs:
  - 研究结论
  - fact-check-note
  - machine-review-note
  - review-note
  - 入库前检查清单
  - 模式抽象
  - 复用判断
outputs:
  - 知识入库条目
handoff_to:
  - Research & Knowledge Lead
---

# Knowledge Ingest

## 目标

把“这次研究有价值”收束成“哪些内容值得长期保留，以及应该以什么形式保留”。

## 适用场景

- 研究对象已经完成第一轮拆解
- 已经有可复用模式、方法或判断
- 某项结论可能会被多个 Agent 反复用到
- 当前内容已经完成核查
- 当前内容已经过创作者 / 用户 review

## 不适用场景

- 研究还停留在资料收集阶段
- 当前只有零散观察，没有稳定结论
- 只是项目局部状态更新，不具备长期复用价值
- 核查尚未完成
- review 还没通过

## 必读上下文

1. 当前研究任务文档
2. 当前研究结论文档
3. `fact-check-note`
4. `machine-review-note`
5. `review-note`
6. 入库前检查清单
7. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/PROJECT.md`

## 执行步骤

1. 先检查 `fact-check-note` 是否完整。
2. 再检查 `machine-review-note` 的 `final_decision` 是否为 `pass`。
3. 再检查 `review-note` 的 `final_decision` 是否为 `approve_for_ingest`。
4. 再核对入库前检查清单是否允许进入 `knowledge-ingest`。
5. 只有当前四项都满足时，才继续判断哪些结论具备长期复用价值。
6. 区分哪些是事实、哪些是模式、哪些是启发。
7. 判断更适合做：
   - 方法条目
   - 模式条目
   - 案例条目
   - 观点条目
8. 写清来源、适用范围和不适用范围。
9. 记录后续可能的维护责任。

## 输出格式

建议基于：

- `/Users/xinran/Downloads/dev/mindsync/projects/research-center/skills/knowledge-ingest/templates/知识条目-模板.md`
- `/Users/xinran/Downloads/dev/mindsync/projects/research-center/templates/知识入库前检查清单.md`

## 质量检查项

- 是否明确为什么值得长期保留
- 是否明确可复用范围
- 是否避免把一次性状态记成长期知识
- 是否保留来源路径
- 是否保留机器预审依据
- 是否保留核查与 review 依据
- 是否存在明确的 `approve_for_ingest`

## Handoff 规则

- 入库后应回链到原始研究文档
- 入库后应回链到 `machine-review-note`
- 入库后应回链到 `fact-check-note` 与 review 结论
- 如果条目仍高度依赖上下文，应先保留在研究文档，不强行入库
- 如果 `machine-review-note` 不是 `pass`，不得产出知识条目
- 如果 `review-note` 不是 `approve_for_ingest`，不得产出知识条目

## 示例调用

示例：

- 输入：
  - “Claude Code 研究里有哪些结论值得正式进入长期知识库？”

## 示例产物

最小结果应类似：

- 条目类型：
  - 方法条目
- 可保留内容：
  - skill 作为工作流单元
  - coordinator 先综合再派发
- 原始来源：
  - Claude Code 研究结论文档
