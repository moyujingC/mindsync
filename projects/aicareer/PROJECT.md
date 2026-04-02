# 怀瑾握瑜项目工作区

> 状态：current
> 版本：0.5.0
> owner：CEO / Orchestrator
> last_updated：2026-04-03
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aicareer/PROJECT.md
> 公司侧入口：[/Users/xinran/Downloads/dev/mindsync/company/projects/怀瑾握瑜/PROJECT.md](/Users/xinran/Downloads/dev/mindsync/company/projects/怀瑾握瑜/PROJECT.md)
> 历史来源仓库：[/Users/xinran/Downloads/dev/ai-career](/Users/xinran/Downloads/dev/ai-career)

这是 `怀瑾握瑜` 在 Monorepo 中的正式项目工作区入口。

`怀瑾握瑜` 目前尚未进入代码实现阶段，因此最适合作为第一批完整跑通 `Harness Engineering + SDD + TDD` 的项目。

## 1. 项目是什么

`怀瑾握瑜` 面向复杂履历与中年转型人群，目标是帮助用户完成职业梳理、叙事重建、材料生成与长期职业资产管理。

当前阶段：

- 已有立项与可行性研究结论
- 尚未进入正式实现
- 现在进入 `spec -> architecture -> implementation-plan -> qa` 的标准流程

当前不做：

- 直接开始写代码
- 在没有正式 spec 的情况下扩展功能范围
- 把聊天记录当成项目正式定义

## 2. 固定必读

1. [本项目 PROJECT.md](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/PROJECT.md)
2. [公司侧项目入口](/Users/xinran/Downloads/dev/mindsync/company/projects/怀瑾握瑜/PROJECT.md)
3. [可行性研究报告](/Users/xinran/Downloads/dev/mindsync/company/projects/怀瑾握瑜/2026-04-02-可行性研究报告.md)
4. [任务状态纪要](/Users/xinran/Downloads/dev/mindsync/company/projects/怀瑾握瑜/2026-04-02-CMPA-任务状态纪要.md)
5. [当前产品 spec](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/specs/2026-04-02-mvp-spec.md)
6. [当前实现计划](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/tasks/2026-04-02-mvp-implementation-plan.md)
7. [当前验收清单](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/qa/2026-04-02-mvp-qa-checklist.md)
8. [当前模拟样本清单](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/fixtures/2026-04-03-mvp-sample-cases.md)
9. [当前评审结论](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/delivery/2026-04-03-mvp-review-memo.md)
10. [当前纸面验证报告](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/qa/2026-04-03-paper-validation-report.md)
11. [当前实现任务定义](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/tasks/2026-04-03-mvp-implementation-task.md)
12. [当前实现记录](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/delivery/2026-04-03-mvp-implementation-note.md)

## 3. 目录说明

- `specs/`
  - 正式产品 spec 和技术方案
- `decisions/`
  - ADR 与结构性决策
- `tasks/`
  - 实现计划和阶段任务
- `qa/`
  - 验收标准、测试清单、验证记录
- `fixtures/`
  - 纸面验证和后续测试样本
- `app/`
  - 实现入口和流程编排
- `domain/`
  - 领域模型和核心流程定义
- `tests/`
  - 自动化测试和脚本化验证
- `data/`
  - 实现阶段样本和示例输出
- `delivery/`
  - 交付说明、发布记录、复盘
- `notes/`
  - 临时笔记，不替代正式 artifact

## 4. 当前阶段

当前正式阶段是：

- `mvp implementation started`

进入下一个阶段前，至少需要补齐：

- 更完整的主流程对象化
- 下一轮实现范围定义
- 更明确的长期交互入口

## 5. 当前下一步

1. 继续细化 `exploration -> structuring -> review` 的领域边界。
2. 在现有 CLI 基础上决定是否再做最小 Web 入口。
3. 保持 QA 与 spec 同步，不在实现阶段临时扩范围。
