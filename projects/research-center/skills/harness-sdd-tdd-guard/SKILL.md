---
name: harness-sdd-tdd-guard
description: 在需求讨论、开发、重构、验收和交付过程中，统一判断当前阶段、检查最小 artifact 闭环，并在缺失时先补最小 spec/task/qa/delivery，而不是直接跳进代码或直接宣布完成。
owner: CEO / Orchestrator
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - ceo
  - product_spec
  - architect
  - engineer
  - test_qa
when_to_use: >
  当任务涉及需求讨论、方案收束、实现、重构、验收、review、交付或阶段切换，
  且需要确保工作遵守 Harness Engineering、SDD、TDD 与 Docs As System 时使用。
inputs:
  - 当前任务描述
  - 项目入口与当前 artifact
  - 当前代码或交付状态
outputs:
  - 当前阶段判断
  - 最小 artifact 缺口清单
  - 下一步动作建议
handoff_to:
  - 当前阶段 owner
  - 下一阶段 owner
---

# Harness SDD TDD Guard

## 目标

让代理在日常聊天、需求讨论、下任务、实现、review 和 closeout 时，默认按最小闭环推进：

- 不跳过关键阶段
- 不让聊天记录代替正式 artifact
- 不在缺少前置依据时直接开工
- 不在没有验证和交付记录时直接宣布完成

## 适用场景

- 用户在讨论一个要做的新功能、新能力或新链路
- 用户要求“开始开发”“先改一下”“做个重构”
- 用户让代理 review 最近改动是否合规
- 用户说“做完了，帮我收尾”
- 某项工作准备从一个阶段进入下一阶段

## 不适用场景

- 纯 brainstorming，且明确还不进入定义或执行
- 纯闲聊
- 单纯解释已有文档，不涉及推进阶段

## 必读上下文

1. `/Users/xinran/Downloads/dev/mindsync/DOCS_GOVERNANCE.md`
2. `/Users/xinran/Downloads/dev/mindsync/company/研发原则.md`
3. 对应项目 `PROJECT.md`
4. 当前生效的 `spec / decisions / tasks / qa / delivery`

如任务属于具体角色，还应继续读取对应 `agents/<role>/AGENTS.md`。

## 先判断是否属于重要工作

满足任一项时，默认视为重要工作：

- 新功能或新能力
- 主链路行为变化
- 架构、边界、目录结构变化
- 接口合同、数据结构、运行时语义变化
- 大型 refactor
- 调试台、workbench、fixture、eval、部署链路等能力建设

如果不是重要工作，可以简化执行，但仍应避免制造不可追溯变更。

## 执行步骤

1. 判断当前所处阶段：
   - brainstorming
   - problem-framing
   - spec
   - architecture
   - implementation-plan
   - implementation
   - verification
   - delivery
2. 判断是否属于重要工作。
3. 对照当前阶段检查最小 artifact 是否齐全。
4. 如果缺少关键 artifact，先补最小 artifact 或显式退回对应 owner。
5. 如果已进入实现，先写清：
   - 目标行为
   - 验收标准
   - 边界情况
   - 验证方式
6. 如果已完成实现，检查是否已补：
   - `qa`
   - `delivery`
   - 残留风险
   - handoff 对象

## 各阶段最小要求

### 1. problem-framing / spec

至少写清：

- 在解决什么问题
- 目标用户或对象是谁
- 本轮做什么
- 本轮不做什么
- 验收标准

如问题仍模糊，优先转给：

- `product-framing-spec`

### 2. architecture / implementation-plan

至少写清：

- 边界和模块责任
- 本轮允许改动范围
- 本轮不处理范围
- 任务拆解
- 验收输入来自哪些 spec / qa basis

如不确定是否可进入下一阶段，优先使用：

- `artifact-readiness-check`

### 3. implementation

进入实现前，至少写清：

- 目标行为
- 验收标准
- 边界情况
- 验证方式

如果以上内容缺失，不应直接开工。

### 4. verification

至少写清：

- 跑了哪些测试或人工验证
- 结果是什么
- 发现了哪些风险或回归点
- 是否允许进入下一阶段

如当前对象进入质量门，优先使用：

- `qa-gate-review`

### 5. delivery

至少写清：

- 本轮交付了什么
- 依据了哪些 artifact
- 已完成哪些验证
- 还有哪些残留风险
- 下一阶段交给谁

## 缺失 artifact 时的默认动作

- 缺 `spec`：先收束问题定义，不直接实现
- 缺 `task`：先补执行计划，不直接大改
- 缺 `qa basis`：先写验收与验证口径
- 缺 `qa`：不直接宣称完成
- 缺 `delivery`：不直接把窗口结束当成正式交付

## 输出格式

最小输出建议包括：

- 当前阶段：
- 是否属于重要工作：
- 当前已存在 artifact：
- 缺失项：
- 默认下一步：
- 如果可以继续实现，当前验收口径：
- 如果不能继续，退回给谁：

## 推荐模板

当需要直接补最小 artifact 时，优先复用：

- `templates/最小任务模板.md`
- `templates/最小QA模板.md`
- `templates/最小交付模板.md`

如果当前任务更适合进入正式产品定义、阶段就绪判断或质量门评审，继续转用：

- `product-framing-spec`
- `artifact-readiness-check`
- `qa-gate-review`

## 质量检查项

- 是否把聊天理解成正式 artifact 了
- 是否在没有 `spec / task / qa basis` 时直接进入实现
- 是否在没有 `qa / delivery` 时直接宣布完成
- 是否把局部实验静默升级成全局重定义
- 是否给下游留下了可 handoff 的唯一入口
