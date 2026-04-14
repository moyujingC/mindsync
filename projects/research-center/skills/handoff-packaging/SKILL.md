---
name: handoff-packaging
description: 把阶段结论打包成可交给下一角色继续推进的 handoff artifact。
owner: CEO / Orchestrator
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - ceo
  - research_knowledge
  - product_spec
  - architect
  - content
  - test_qa
when_to_use: >
  当一个阶段已经产生结论，需要明确交给下一角色继续推进，而不是只留在聊天或模糊总结里时使用。
inputs:
  - 当前阶段结论
  - 项目锚点
  - 下一角色
outputs:
  - handoff 包
handoff_to:
  - 下一个 owner 角色
---

# Handoff Packaging

## 目标

把阶段成果收束成结构化 handoff，降低下游角色“重新理解任务”的成本。

## 适用场景

- 研究结论要交给 Product Spec Lead
- spec 要交给 Architect
- architecture 要交给 Engineer
- 实现结果要交给 Test / QA
- 研究或产品洞察要交给 Content Lead

## 不适用场景

- 当前阶段还没有形成有效结论
- 只是临时讨论，还不足以进入下一阶段
- 下游角色与当前角色实际上是同一阶段内协作，不需要正式交接

## 必读上下文

1. 当前项目 `PROJECT.md`
2. 当前阶段相关 artifact
3. `/Users/xinran/Downloads/dev/mindsync/DOCS_GOVERNANCE.md`

## 执行步骤

1. 写清当前阶段是什么。
2. 写清继承的项目锚点是什么。
3. 写清本轮已确认结论。
4. 写清仍未解决的问题。
5. 写清下游角色要产出什么，而不是只写“继续推进”。
6. 写清本轮允许改动和禁止改动的范围。

## 输出格式

建议基于：

- `templates/HANDOFF-模板.md`

默认至少包含：

- 背景
- 当前阶段
- 项目锚点
- 本轮结论
- 输入材料
- 明确产物
- 验收标准
- 允许变化范围
- 禁止改写范围

## 质量检查项

- 下游角色看完能否直接开工
- 是否明确了“做什么”和“不做什么”
- 是否有明确产物而不是泛泛描述
- 是否保留了项目锚点，避免局部实验被误解为全局重定义

## Handoff 规则

- 没有明确产物时，不算合格 handoff
- 只给摘要、不给约束时，不算合格 handoff
- 若当前阶段结论不足，应先补 artifact，再 handoff

## 示例调用

示例：

- 当前情况：
  - Claude Code 研究已经完成第一轮结论
- 目标：
  - 交给 `Product Spec Lead` 继续判断哪些能力该优先产品化

## 示例产物

最小结果应类似：

- 当前阶段：
  - research
- 已确认结论：
  - Claude Code 值得学的是 skill 协议和 coordinator 思路
- 下游角色：
  - `Product Spec Lead`
- 明确产物：
  - 第一批 skill roadmap
- 禁止改写范围：
  - 不直接改写公司蓝图和项目定位
