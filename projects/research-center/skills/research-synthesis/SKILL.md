---
name: research-synthesis
description: 把研究事实、模式、判断和建议收束成可 handoff 的综合结论，避免研究停留在材料堆和局部观察里。
owner: Research & Knowledge Lead
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - research_knowledge
  - ceo
  - product_spec
  - architect
when_to_use: >
  当研究已经完成一轮事实收集与拆解，需要把材料收束成结构化综合结论，供知识入库、产品判断或跨角色 handoff 使用时调用。
inputs:
  - 研究材料
  - 事实观察
  - 初步模式
outputs:
  - 研究综合结论
handoff_to:
  - Research & Knowledge Lead
  - Product Spec Lead
  - Architect
  - CEO
---

# Research Synthesis

## 目标

把“研究看了很多”转成“有哪些稳定事实、有哪些可复用模式、有哪些对下游有意义的判断”。

## 适用场景

- 已有研究材料和拆解记录，但还没有形成综合结论
- 需要把研究输出给产品、架构、商业或内容角色
- 需要先做综合判断，再决定是否入库或 handoff

## 不适用场景

- 当前还停留在研究立题阶段
- 当前只有链接或素材清单，没有足够事实基础
- 当前任务的重点已经是知识入库或商业判断

## 特别规则

### 1. 当前 issue 的研究对象不可被项目样例覆盖

如果你是在 Paperclip 的正式 issue 中执行 synthesis：

- 当前 issue 的研究对象、问题、评论纠偏、已有 issue documents 是最高优先级
- `PROJECT.md` 的“当前下一步”、历史样例研究、已有 handoff 文件都不能替代当前 issue 的研究对象

如果你发现项目目录中存在：

- 首批样例研究
- 历史研究综合结论
- 现成 handoff 产物

这些内容只能作为格式和方法参考，不能直接当作本轮任务的研究主题继续写下去。

### 2. 缺少 issue 上下文时不要自动补成通用样例任务

如果当前 run 无法明确确认具体 issue，只能：

- 做最小范围的上下文识别
- 明确指出当前上下文不足以继续正式 synthesis

不能：

- 自行挑选一个开源项目作为研究对象
- 自行补做“研究中心首批样例任务”
- 输出与当前 issue 无关的综合结论、知识入库或 handoff

## 必读上下文

1. 当前 issue 的 title / description / comments / issue documents
2. 当前研究任务或 brief
3. 当前研究材料与拆解文档
4. `/Users/xinran/Downloads/dev/mindsync/projects/research-center/PROJECT.md`

## 执行步骤

1. 先整理稳定事实，不把猜测写成事实。
2. 再抽模式，说明哪些是可迁移做法。
3. 再写判断，区分适合借鉴与不适合照搬。
4. 明确对谁有用：
   - 产品
   - 架构
   - 商业
   - 内容
   - 知识库
5. 写出下一步建议与 handoff 去向。

## 输出格式

建议基于：

- `/Users/xinran/Downloads/dev/mindsync/projects/research-center/skills/research-synthesis/templates/研究综合结论-模板.md`

至少写清：

- 研究对象
- 核心事实
- 模式抽象
- 对 `墨予镜` 的判断
- 不适合照搬的部分
- 下一步建议

## 质量检查项

- 是否区分了事实、模式和判断
- 是否给出“适合借鉴 / 不适合照搬”的边界
- 是否明确服务对象
- 是否能支撑下游直接继续推进
- 当前综合结论是否仍然紧扣当前 issue，而不是被项目级样例任务带偏

## Handoff 规则

- 综合结论完成后，可继续进入：
  - `knowledge-ingest`
  - `insight-handoff`
  - `product-framing-spec`
  - `architecture-boundary-plan`
- 如果输出仍只是阅读笔记，不算合格 synthesis
