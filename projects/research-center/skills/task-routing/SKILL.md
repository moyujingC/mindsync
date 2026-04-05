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

1. 先读取当前任务自身输入，而不是先凭上一个任务的上下文猜测：
   - issue 标题
   - issue 描述
   - 当前 project / goal
   - 已有 handoff 或评论
2. 判断任务属于哪个项目或公司目标。
3. 判断当前是 business / product / research / architecture / implementation / qa / content 哪条流。
4. 判断当前阶段是什么。
5. 判断谁是主责角色。
6. 判断需要什么 artifact 才能继续。

## 补充规则

### 1. 默认把 issue 描述当成有效输入

如果 issue 描述已经包含以下四项中的至少三项，默认视为足够进入路由：

- 任务对象
- 输入材料
- 关注问题
- 希望产物

此时不得再回退给用户要求“请提供具体任务内容”。

### 2. 只有在会改变路由结果时才允许追问

只有当缺失信息会直接影响以下判断时，才允许继续澄清：

- 主责角色是谁
- 工作流类型是什么
- 下一步 artifact 是什么

如果只是“结论尚未形成”，但任务对象已清楚，仍应继续路由，不应退回。

### 3. 禁止跨任务串文档

当前任务的主上下文必须来自当前 issue 自身。

不得因为上一个任务正在处理某个项目，就把那个项目文档自动带到当前任务里。

如果当前任务没有显式引用某份文档或某个项目，不应主动把它当成本轮主输入。

### 4. 参考材料任务的默认路由

如果任务描述中已出现：

- 外部链接
- 聊天记录
- AI 输出文档
- 用户明确认同/关注的观点

则默认优先判断其是否属于：

- `研究沉淀工作流`
- 或“参考材料摄取任务”

而不是先要求用户再次解释任务内容。

## 输出格式

建议基于：

- `/Users/xinran/Downloads/dev/mindsync/projects/research-center/skills/task-routing/templates/任务路由模板.md`

## 质量检查项

- 是否优先消费了当前 issue 自带描述
- 是否写清主责角色
- 是否写清下一步产物
- 是否避免“一件事同时交给所有人”
- 是否避免把上一个任务的项目文档串到当前任务里

## 示例调用

示例：

- 输入：
  - “我想研究本机 Paperclip 公司样本，最后给墨予镜补一批 skill。”

## 示例产物

最小结果应类似：

- 工作流类型：
  - research
- 当前阶段：
  - problem-framing / research brief
- 主责角色：
  - `Research & Knowledge Lead`
- 下一步产物：
  - 研究 brief
  - 研究结论文档
