---
name: task-routing
description: 判断任务属于哪条工作流、哪个角色主责、当前阶段和下一步应该产出什么。
owner: CEO / Orchestrator
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - ceo
when_to_use: >
  当接到一个新任务、模糊方向或临时需求，需要先判断任务类型、当前阶段和下一步 owner 时使用。
inputs:
  - 用户需求
  - 当前项目锚点
outputs:
  - 路由结论
  - 下一步任务定义
handoff_to:
  - business
  - product_spec
  - research_knowledge
  - architect
  - engineer
  - test_qa
  - content
---

# Task Routing

## 目标

在任务一进来时先做分流，避免问题还没分清就直接滑向实现、研究或内容生产。

## 执行步骤

1. 判断任务属于哪个项目或公司目标。
2. 判断当前是 business / product / research / architecture / implementation / qa / content 哪条流。
3. 判断当前阶段是什么。
4. 判断谁是主责角色。
5. 判断需要什么 artifact 才能继续。

## 输出格式

建议基于：

- `/Users/xinran/Downloads/dev/mindsync/projects/research-center/skills/task-routing/templates/任务路由模板.md`

## 质量检查项

- 是否写清主责角色
- 是否写清下一步产物
- 是否避免“一件事同时交给所有人”

