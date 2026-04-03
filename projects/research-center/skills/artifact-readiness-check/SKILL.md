---
name: artifact-readiness-check
description: 检查当前阶段是否具备进入下一阶段的最小 artifact 和最小语义完整度。
owner: CEO / Orchestrator
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - ceo
  - product_spec
  - research_knowledge
  - architect
  - test_qa
when_to_use: >
  当任务准备从一个阶段进入下一个阶段，需要先判断 artifact 是否足够成立时使用。
inputs:
  - 当前阶段产物
  - 下一阶段目标
outputs:
  - readiness 判断
handoff_to:
  - 当前 owner
---

# Artifact Readiness Check

## 目标

判断当前是否真的能进入下一阶段，而不是靠感觉推进。

## 执行步骤

1. 写清当前阶段和下一阶段。
2. 对照当前阶段最小 artifact 要求。
3. 判断是否缺失关键字段。
4. 判断下游是否能基于当前产物直接推进。

## 输出格式

- 是否 ready：
  - 是 / 否
- 缺失项：
- 补齐建议：

## 示例调用

示例：

- 输入：
  - “这份研究结论能不能直接 handoff 给 Product Spec Lead？”

## 示例产物

最小结果应类似：

- 是否 ready：
  - 否
- 缺失项：
  - 服务对象不明确
  - 下一步产物未定义
- 补齐建议：
  - 先补 handoff 包
