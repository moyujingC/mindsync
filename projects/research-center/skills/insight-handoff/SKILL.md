---
name: insight-handoff
description: 把研究结论按下游角色需要的格式转成可执行输入。
owner: Research & Knowledge Lead
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - research_knowledge
  - ceo
when_to_use: >
  当研究已经形成结论，需要分别 handoff 给 Product、Architect、Content 或 Business 时使用。
inputs:
  - 研究结论
  - 下游角色
outputs:
  - 角色化 handoff
handoff_to:
  - product_spec
  - architect
  - content
  - business
---

# Insight Handoff

## 目标

避免把同一份研究摘要原样丢给所有人，而是按不同角色的使用方式做转译。

## 执行步骤

1. 写清研究结论是什么。
2. 明确下游是谁。
3. 针对下游角色改写成：
   - 产品判断输入
   - 技术抽象输入
   - 内容原材料
   - 商业判断输入

## 输出格式

- 研究结论摘要
- 面向下游角色的使用建议
- 下游下一步动作

