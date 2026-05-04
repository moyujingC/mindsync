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

## 特别规则

### 0. 当前 issue 高于项目级默认待办

如果你是在 Paperclip 的正式 issue / heartbeat 中使用本 skill，则：

- 当前 issue 的 title、description、comments、documents 是主上下文
- `PROJECT.md`、历史样例任务、目录里的现成 brief 只能作为背景和模板参考
- 不能因为 `PROJECT.md` 写了“优先完成某个样例”，就把当前 issue 改写成那个样例任务

如果当前上下文不能唯一确定本轮 issue，则：

- 不应擅自创建新的样例 brief
- 不应默认执行项目目录里的通用研究计划
- 只允许做最小范围的上下文确认与风险提示

### 1. brief 不是默认终点

除非任务明确只要求“先出一份 brief”，否则：

- `research brief` 只是研究启动 artifact
- 写完 brief 后，默认应继续进入正式研究
- 不应把任务直接推进为“等待 CEO 审批后再继续”

如果当前 issue 已经足够具体，且用户已表达“继续推进”，那么正确动作是：

- 保持任务在研究流里继续前进
- 基于 brief 继续开展 research / synthesis / knowledge ingest

如果当前 issue 已经存在 `research-brief` 文档，则默认说明：

- brief 已经完成
- 当前不应再次调用本 skill 来向用户补需求

此时应直接切换到：

- `research-synthesis`
- 或正式研究执行

### 2. 不要把下游应用场景误写成主项目

当前任务的主上下文必须来自当前 issue 自身：

- project
- title
- description
- 评论补充

如果任务属于 `研究中心`，而描述里只是顺带提到某个产品、账号或业务线作为应用示例，那么：

- 可以把它写成潜在应用对象
- 不应把它提升为本轮主项目
- 不应让预期交付物默认围绕该下游项目展开

## 必读上下文

开始前优先读取：

1. 当前 issue 的 title / description / comments / issue documents
2. `projects/research-center/PROJECT.md`
3. `company/projects/研究中心/PROJECT.md`
4. `company/projects/研究中心/研究方向与任务模型.md`
5. 如果任务已挂到具体项目，还要读对应项目 `PROJECT.md`

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

- `templates/研究任务-brief-模板.md`

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
- 是否把 `brief` 误当成了任务终点
- 是否把被顺带提到的下游项目误写成了本轮主项目

## Handoff 规则

- 如果输出仍停留在“值得看看”，不能直接进入深度研究
- 如果已经具备对象、问题、范围和交付定义，可 handoff 给 `Research & Knowledge Lead`
- 如果任务本质是产品定义而不是外部研究，应回退给 `Product Spec Lead`
- 如果当前任务主责仍是 `Research & Knowledge Lead`，且 brief 已经成形，默认应继续研究，而不是先回 CEO 审批

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
