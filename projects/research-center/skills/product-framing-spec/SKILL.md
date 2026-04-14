---
name: product-framing-spec
description: 把模糊方向、研究输入和业务判断收束成可 handoff 的产品 framing / spec。
owner: Product Spec Lead
status: draft
version: 0.1.0
skill_type: role-specific
applies_to:
  - product_spec
  - ceo
when_to_use: >
  当任务已经进入产品定义阶段，需要把模糊问题、研究输入或业务判断转成明确范围和 spec 时使用。
inputs:
  - 项目锚点
  - 研究输入或业务判断
  - 当前问题
outputs:
  - 产品 framing
  - spec 草案
handoff_to:
  - Architect
  - Content Lead
---

# Product Framing Spec

## 目标

把“一个方向”变成“一个有范围、有取舍、有验收标准的产品定义”。

## 适用场景

- CEO 转来一个还没定义清楚的方向
- 已经有研究结论，但还没转成产品判断
- 某个项目要进入 `spec` 阶段
- 某个局部实验需要被明确成不改写全局定位的 spec

## 不适用场景

- 当前任务本质上还是外部研究
- 当前任务已经进入 architecture 或 implementation
- 当前还没有任何项目锚点

## 必读上下文

1. `/Users/xinran/Downloads/dev/mindsync/DOCS_GOVERNANCE.md`
2. 对应项目 `PROJECT.md`
3. 公司侧项目入口
4. 上游研究 / 业务输入 / 任务纪要

## 执行步骤

1. 先写清用户是谁。
2. 再写清用户当前卡在哪里。
3. 明确本轮要解决的问题是什么。
4. 明确本轮做什么、不做什么。
5. 比较可选方案及代价。
6. 给出当前阶段最合理范围。
7. 写清验收标准。

## 输出格式

建议基于：

- `templates/产品定义-SPEC-模板.md`
- `templates/产品定义-SPEC-快速检查清单.md`

至少写清：

- 问题定义
- 用户场景
- 本轮范围
- 不做范围
- 方案比较
- 验收标准
- 下一阶段 handoff

## 质量检查项

- 是否明确了真实用户和真实场景
- 是否把“想法”收束成“问题定义”
- 是否明确不做什么
- 是否明确下一步该交给谁
- 是否避免把局部实验误写成全产品重定义

## Handoff 规则

- 满足基本结构后，才可交给 `Architect`
- 如果更适合先做内容验证，可 handoff 给 `Content Lead`
- 如果缺少行业事实或竞品输入，应先回退到研究阶段

## 示例调用

示例：

- 输入：
  - “我们要不要先做一批通用 skill，而不是继续补角色 prompt？”
- 上游材料：
  - Claude Code 研究结论
  - 当前公司角色定义

## 示例产物

最小结果应类似：

- 用户场景：
  - 多个 Agent 缺少稳定方法
- 本轮目标：
  - 先补第一批 P0 skill
- 不做范围：
  - 不做完整运行时 marketplace
- 下一步：
  - handoff 给 `Architect` 或继续输出协议草案
