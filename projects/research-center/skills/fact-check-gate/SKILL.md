---
name: fact-check-gate
description: 对包含事实主张的草案执行来源覆盖检查、风险标记与放行判断。
owner: Research & Knowledge Lead
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - research_knowledge
  - business
  - product_spec
  - ceo
  - content
when_to_use: >
  当草案包含数字、案例、市场判断、机构结论等事实主张，且准备进入 review、handoff、知识库或决策时使用。
inputs:
  - 草案
  - 原始来源材料
  - 如有，综合结论或上游摘要
outputs:
  - fact-check-note
  - 放行结论
handoff_to:
  - Research & Knowledge Lead
  - CEO
  - Product Spec Lead
  - Business Lead
  - Content Lead
---

# Fact Check Gate

## 目标

在草案进入下一阶段前，先确认关键事实主张是否有来源覆盖，避免高风险内容继续向下游流动。

## 适用场景

- 研究草案准备进入 review
- 商业报告准备进入判断或 handoff
- 竞品调查准备进入 spec 或 strategy
- 内容稿准备进入 review 或发布
- 任意事实型 artifact 准备进入知识库

## 不适用场景

- brainstorming
- 没有形成正式草案
- 只有观点，没有事实主张

## 必读上下文

1. 当前项目 `PROJECT.md`
2. 当前草案
3. 原始来源材料
4. 如有，已有综合结论

## 执行步骤

1. 拆分草案中的关键事实主张。
2. 判断每条主张是否有足够来源覆盖。
3. 标记高风险句子、硬数字和可疑引用。
4. 输出 `fact-check-note`。
5. 给出放行结论：
   - `pass`
   - `pass_with_conditions`
   - `fail`
6. 若不是 `pass`，明确退回修改方向。

## 输出格式

建议基于：

- `projects/research-center/templates/事实核查笔记模板.md`
- `templates/事实核查质量门-快速检查清单.md`

## 质量检查项

- 是否逐条拆分了关键事实主张
- 是否标记了高风险数字和引用
- 是否给出明确放行结论
- 是否写清退回条件

## Handoff 规则

- `fail` 时不得进入 review、handoff 或知识库
- `pass_with_conditions` 时必须先完成修改
- 只有 `pass` 才能无阻塞进入下一阶段
