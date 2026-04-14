---
name: architecture-boundary-plan
description: 把产品定义转成技术边界、模块划分、风险点和实现前提。
owner: Architect
status: draft
version: 0.1.0
skill_type: role-specific
applies_to:
  - architect
  - ceo
when_to_use: >
  当产品定义已经足够清楚，需要进入 architecture 阶段，明确实现边界和技术风险时使用。
inputs:
  - spec
  - 项目上下文
outputs:
  - architecture artifact
handoff_to:
  - engineer
  - test_qa
---

# Architecture Boundary Plan

## 目标

把产品范围转成技术结构，明确边界、风险和实现前提。

## 执行步骤

1. 明确当前要支撑的用户价值。
2. 划清模块边界和数据边界。
3. 写清不做范围。
4. 写清实现前必须暴露的风险。
5. 明确 handoff 给 Engineer / Test 的输入。

## 输出格式

建议基于：

- `templates/架构边界模板.md`
- `templates/架构边界-快速检查清单.md`

## 示例调用

示例：

- 输入：
  - “我们已经决定要做 skill 体系，下一步如何进入可实现的架构边界？”

## 示例产物

最小结果应类似：

- 模块边界：
  - skill 协议
  - skill 存储目录
  - 角色引用层
- 不做范围：
  - 远程 marketplace
- handoff：
  - 给 `Engineer` 做目录与接线实现
