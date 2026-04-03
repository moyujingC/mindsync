---
name: research-brief
description: 把研究任务收束成正式 brief，明确对象、问题、范围、服务对象和交付物。
owner: Research & Knowledge Lead
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - research_knowledge
  - ceo
  - product_spec
when_to_use: >
  当任务需要先明确研究对象、研究问题、研究边界、服务对象和预期交付物时使用。
inputs:
  - 任务背景
  - 研究对象
  - 服务对象
  - 当前疑问或目标
outputs:
  - 研究 brief
handoff_to:
  - Research & Knowledge Lead
---

# Research Brief

## 目标

把一个模糊研究需求收束成可执行的正式研究 brief，避免研究一开始就滑向资料堆积或无边界泛读。

## 适用场景

- CEO 刚派来一个研究方向，但还没有明确研究范围
- Product Spec Lead 发现缺少上游研究输入
- 研究中心要决定某个对象值不值得深挖
- 内容研究需要先明确专业问题而不是直接拆内容形式

## 不适用场景

- 已经有明确研究任务文档且范围稳定
- 当前任务的重点已经进入 synthesis、知识入库或 handoff
- 这是一次纯临时笔记，不准备进入正式 artifact

## 必读上下文

开始前优先读取：

1. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/PROJECT.md`
2. `/Users/xinran/Downloads/dev/mindsync/company/projects/研究中心/PROJECT.md`
3. `/Users/xinran/Downloads/dev/mindsync/company/projects/研究中心/2026-04-04-研究方向与任务模型.md`
4. 如果任务已挂到具体项目，还要读对应项目 `PROJECT.md`

## 执行步骤

1. 明确研究对象是什么。
2. 写清研究要回答的核心问题，不超过 5 个。
3. 明确本次服务对象是产品、架构、商业、内容还是知识库。
4. 划定边界：
   - 这次要看什么
   - 这次不看什么
5. 明确预期交付物和完成标准。
6. 判断是否需要跨角色协作。

## 输出格式

默认输出为一份正式研究 brief，建议基于：

- `/Users/xinran/Downloads/dev/mindsync/projects/research-center/skills/research-brief/templates/研究任务-brief-模板.md`

至少写清：

- 任务名称
- 研究对象
- 研究问题
- 服务对象
- 研究范围
- 不在本轮处理的边界
- 预期交付物
- 完成标准

## 质量检查项

- 研究对象是否明确，而不是一个大主题
- 研究问题是否可回答，而不是泛泛口号
- 服务对象是否明确
- 是否写清了不看什么
- 是否明确完成后要交给谁

## Handoff 规则

- 如果输出仍停留在“值得看看”，不能直接进入深度研究
- 如果已经具备对象、问题、范围和交付定义，可 handoff 给 `Research & Knowledge Lead`
- 如果任务本质是产品定义而不是外部研究，应回退给 `Product Spec Lead`

## 示例调用

示例：

- 输入：
  - “研究一下 Claude Code 源码值不值得我们学，重点看 skill 和多 Agent，不要泛读全部代码。”
- 期望动作：
  - 先收束研究对象、研究问题、边界、服务对象和交付物

## 示例产物

最小结果应类似：

- 研究对象：
  - Claude Code 外部源码材料
- 研究问题：
  - skill 机制是什么
  - 多 Agent 编排有什么值得借鉴
- 服务对象：
  - 研究中心 / CEO / Product / Architect
- 交付物：
  - 研究结论
  - skill 启发
  - 入库建议
