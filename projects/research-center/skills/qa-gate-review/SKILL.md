---
name: qa-gate-review
description: 在交付进入下一阶段前，统一检查验收标准、风险点、回归点和退回条件。
owner: Test / QA
status: draft
version: 0.1.0
skill_type: role-specific
applies_to:
  - test_qa
  - ceo
when_to_use: >
  当某项实现、spec、架构方案或交付物需要通过质量门再进入下一阶段时使用。
inputs:
  - spec
  - architecture 或实现结果
  - 当前交付物
outputs:
  - qa review
  - 验收结论
handoff_to:
  - Engineer
  - Architect
  - CEO
---

# QA Gate Review

## 目标

明确当前交付物是否达到进入下一阶段的最低质量门，而不是只给模糊“看起来差不多”的反馈。

## 适用场景

- 实现完成后要进入验收
- 架构方案需要先暴露高风险点
- spec 准备 handoff 前需要检查是否可验证

## 不适用场景

- 任务还没有明确验收对象
- 当前阶段仍处于 brainstorming

## 必读上下文

1. 当前项目 `PROJECT.md`
2. 当前生效 spec
3. 相关 architecture / decisions
4. 当前实现或交付物

## 执行步骤

1. 明确本次 review 的对象是什么。
2. 写清对应的验收标准。
3. 检查关键路径和边界情况。
4. 明确当前风险和回归点。
5. 给出：
   - 可通过
   - 有条件通过
   - 不通过

## 输出格式

建议基于：

- `templates/QA-评审模板.md`

## 质量检查项

- 是否明确原始期望是什么
- 是否明确当前验证对象
- 是否指出具体风险，而不是泛泛说“需要测试”
- 是否写清退回条件

## Handoff 规则

- 不通过时必须明确退回给谁
- 不应只给问题列表，还要标注优先级或阻塞性

## 示例调用

示例：

- 输入：
  - “这份产品 spec 能不能进入 architecture 阶段？”

## 示例产物

最小结果应类似：

- 评审对象：
  - 某项目 spec
- 结论：
  - 有条件通过
- 缺失项：
  - 验收标准不完整
  - 边界情况未写清
- 退回建议：
  - 回到 `Product Spec Lead` 补齐
