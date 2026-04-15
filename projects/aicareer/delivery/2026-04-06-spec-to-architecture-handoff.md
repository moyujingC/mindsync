# HANDOFF: 产品Spec → 架构设计

## 1. 背景

- 任务背景：`怀瑾握瑜` MVP 产品定义已完成，需要转入技术架构设计阶段
- 所属项目：怀瑾握瑜（aicareer）
- 当前阶段：spec 完成，进入 architecture 阶段

## 2. 继承锚点

- 不变的项目锚点：
  - 面向35+中年转型或再就业人群，有复杂履历、空档期、跨行业经历或角色断裂
  - 核心价值是帮助用户完成职业梳理、叙事重建、材料生成与长期职业资产管理
  - 不是一次性简历生成工具，不是泛化的AI转型助手
- 本轮任务级别：
  - 执行落地 - MVP第一版技术架构设计

## 3. 本轮已确认结论

1. ✅ MVP 核心范围已明确：5步用户流程（intake → exploration → structuring → review → export）
2. ✅ 核心输出已明确定义：profile、timeline_summary、narrative_draft、follow_up_questions
3. ✅ 核心领域实体字段已定义，提供数据结构设计基础
4. ✅ 对话交互规则已明确：提问策略、边界规则、用户控制权
5. ✅ 敏感数据处理规则已明确：加密存储、用户控制权、隐私保护要求
6. ✅ 本轮不做范围已明确：不做简历模板市场、一键投递、会员体系等7类功能

## 4. 当前输入材料

- 产品Spec：/Users/xinran/Downloads/dev/mindsync/projects/aicareer/specs/MVP产品规范.md
- 就绪度检查报告：/Users/xinran/Downloads/dev/mindsync/projects/aicareer/qa/2026-04-06-spec-to-architecture-readiness-check.md
- 项目定义：/Users/xinran/Downloads/dev/mindsync/projects/aicareer/PROJECT.md
- 可行性研究报告：/Users/xinran/Downloads/dev/mindsync/company/projects/怀瑾握瑜/2026-04-02-可行性研究报告.md

## 5. 下游任务定义

- 建议交给谁：Architect
- 需要产出什么：
  1. MVP 技术架构方案（领域模型、流程编排、系统边界、技术选型）
  2. 数据结构设计（对应核心领域实体）
  3. 对话流程编排设计
  4. 安全架构设计（敏感数据处理相关）
  5. 实现计划拆解
- 验收标准：
  1. 架构方案完全覆盖产品Spec定义的所有功能需求
  2. 明确各模块职责与交互边界
  3. 满足敏感数据处理的安全约束
  4. 提供可执行的实现任务拆解
  5. 明确技术风险与应对方案

## 6. 范围约束

- 本轮允许变化：
  - 技术选型、模块划分、实现方式的技术决策
  - 交互流程的技术合理性优化（需与产品确认后调整）
  - 数据结构的技术优化（不改变核心字段定义）
- 本轮禁止改写：
  - 项目核心定位与目标用户群体
  - 产品Spec定义的核心功能范围与主路径
  - 核心输出的业务含义与字段要求
  - 敏感数据处理的安全规则
  - 本轮明确不做的功能范围

## 7. 未解决问题

1. 对话流程的具体prompt模板设计（可在架构阶段同步细化）
2. 第一版是先做CLI还是Web入口（可在架构方案中提供选项评估）
3. 用户身份验证的具体实现方式（MVP阶段可简化，不做复杂账号体系）
