---
name: external-knowledge-intake
description: 将外部链接、文本、图片和网页收藏内容收束为可召回、可追溯、可继续处理的外部素材输入。
owner: Research & Knowledge Lead / Engineer
status: draft
version: 0.1.0
skill_type: external
applies_to:
  - research_knowledge
  - content
  - engineer
when_to_use: >
  当任务目标是采集、保存、召回、整理外部素材，并为研究、内容或工程任务提供可追溯输入时使用。
inputs:
  - external link
  - external text
  - image
  - creator note
  - current project anchor
outputs:
  - external source pack
  - retrieval result
  - intake note
handoff_to:
  - Research & Knowledge Lead
  - Content Lead
  - Engineer
---

# External Knowledge Intake

## 目标

把外部平台或临时输入收束成稳定的“外部采集层”输入，而不是让后续角色直接卡在平台访问、素材丢失或原文不可追溯上。

## 适用场景

- 抖音、小红书、网页、图片等外部内容需要先保存
- 已经保存过的外部素材需要再次搜索、召回或查看原文
- 需要给研究、内容或工程任务补一份可追溯 source pack
- 需要对临时外部素材做基础标签、知识库归类或整理

## 不适用场景

- 当前目标已经是正式 spec、qa、delivery 或长期知识沉淀
- 材料已经收束成 `mindsync` 内正式 artifact
- 当前任务重点是对素材做综合判断、观点提炼或内容转译，而不是先完成采集与召回

## 必读上下文

1. 当前项目 `PROJECT.md`
2. 当前任务上下文
3. 当前默认底层实现说明：`getnote`

## 执行步骤

1. 先判断当前目标是采集、召回、管理还是原文回看。
2. 若是首次接收外部素材，优先完成保存，保留原始链接、平台和最小上下文。
3. 若是继续处理历史素材，优先做搜索或列表召回，而不是要求用户重复提供原文。
4. 若需要整理外部素材，补充知识库选择、标签和基础归类。
5. 若素材将进入下游流程，输出最小 source pack，至少包含原始来源、召回方式和下一步建议。
6. 明确区分：
   - 原始采集内容仍在外部采集层
   - 正式结论必须回写 `mindsync`

## 输出格式

最小结果至少包含：

- 原始来源链接或来源说明
- 当前使用动作：
  - 保存
  - 搜索
  - 列表查看
  - 标签/知识库整理
- 召回结果或保存结果
- 若要进入下游，给出下一角色和建议动作

## 质量检查项

- 是否保留原始来源与平台信息
- 是否明确当前是在“外部采集层”而不是正式知识库
- 是否能让下游角色继续处理，而不是只留下一个平台链接
- 是否写清当前默认底层实现依赖 `getnote`

## Handoff 规则

- 需要形成研究判断时，交给 `Research & Knowledge Lead`
- 需要形成内容素材池或表达样本时，交给 `Content Lead`
- 需要接脚本、API 或自动化链路时，交给 `Engineer`
- 正式 spec / qa / delivery / kb 不在本 skill 内完成，必须回写 `mindsync`

## 当前默认实现

当前业务层统一入口为 `external-knowledge-intake`。

当前默认底层工具实现为 `getnote`，负责：

- 保存链接、文本、图片
- 搜索与召回笔记
- 查看最近笔记与原文
- 管理知识库与标签
- 处理 `GETNOTE_*` 环境变量与 API 配置

若未来更换底层工具，应保持本 skill 的业务边界、输入输出和 handoff 规则不变，仅替换底层实现说明。
