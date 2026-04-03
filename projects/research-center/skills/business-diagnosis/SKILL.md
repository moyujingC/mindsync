---
name: business-diagnosis
description: 先消解问题，再判断价值、用户、场景、约束和验证优先级。
owner: Business Lead
status: draft
version: 0.1.0
skill_type: role-specific
applies_to:
  - business
  - ceo
when_to_use: >
  当任务本质上是在判断值不值得做、服务谁、先验证什么时使用。
inputs:
  - 模糊方向
  - 商业问题
outputs:
  - 商业诊断
handoff_to:
  - product_spec
  - ceo
---

# Business Diagnosis

## 目标

先把模糊商业问题拆清楚，再讨论解决方案。

## 执行步骤

1. 先拆模糊概念。
2. 再明确用户、场景、价值。
3. 再看现实约束和验证优先级。
4. 最后判断是否值得进入产品定义。

## 输出格式

建议基于：

- `/Users/xinran/Downloads/dev/mindsync/projects/research-center/skills/business-diagnosis/templates/商业诊断模板.md`

## 示例调用

示例：

- 输入：
  - “中年转型这个方向到底值不值得做成产品？”

## 示例产物

最小结果应类似：

- 用户：
  - 中年转型人群
- 场景：
  - 求职 / 转型支持
- 当前约束：
  - 先验证付费意愿，不直接扩成完整产品
- 建议：
  - 先做最小验证动作
