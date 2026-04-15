# 怀瑾握瑜项目工作区

> 状态：current
> 版本：0.5.1
> owner：CEO / Orchestrator
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aicareer/PROJECT.md
> 公司侧入口：[/Users/xinran/Downloads/dev/mindsync/company/projects/怀瑾握瑜/PROJECT.md](/Users/xinran/Downloads/dev/mindsync/company/projects/怀瑾握瑜/PROJECT.md)
> 历史来源仓库：[/Users/xinran/Downloads/dev/ai-career](/Users/xinran/Downloads/dev/ai-career)

这是 `怀瑾握瑜` 在 Monorepo 中的正式项目工作区入口。

`怀瑾握瑜` 目前尚未进入代码实现阶段，因此最适合作为第一批完整跑通 `Harness Engineering + SDD + TDD` 的项目。

## 1. 项目是什么

`怀瑾握瑜` 当前的主假设是：面向复杂履历与中年转型人群，帮助用户完成职业梳理、叙事重建、材料生成与长期职业资产管理。

这个主假设仍可被论证、挑战或推翻；
但任何下游角色都不能在没有显式回应上游分析的情况下，直接遗忘这一判断并改写方向。

当前阶段：

- 已有立项与可行性研究结论
- 尚未进入正式实现
- 现在进入 `spec -> architecture -> implementation-plan -> qa` 的标准流程

当前不做：

- 直接开始写代码
- 在没有正式 spec 的情况下扩展功能范围
- 把聊天记录当成项目正式定义

## 2. 当前阶段

当前正式阶段是：

- `spec / architecture / implementation-plan` 已形成最小闭环
- 项目仍处于“验证问题与主流程”的早期阶段
- 尚未进入稳定发布或长期运行阶段

进入下一个阶段前，至少需要补齐：

- 更完整的主流程对象化
- 下一轮实现范围定义
- 更明确的长期交互入口

## 3. 长期 canonical 入口

当前长期真理源默认从这些目录入口进入：

- [specs/README.md](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/specs/README.md)

## 4. 当前窗口入口

当前执行窗口默认从这些入口进入：

- [tasks/2026-04-02-mvp-implementation-plan.md](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/tasks/2026-04-02-mvp-implementation-plan.md)
- [qa/README.md](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/qa/README.md)
- [delivery/README.md](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/delivery/README.md)

## 5. 历史资料入口

如需追溯窗口背景与阶段产物，可查：

- [2026-04-03-窗口工作总结.md](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/delivery/2026-04-03-窗口工作总结.md)
- [2026-04-03-career-asset-sample.md](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/delivery/2026-04-03-career-asset-sample.md)
- [历史来源仓库](/Users/xinran/Downloads/dev/ai-career)

这些材料主要用于追溯，不承担当前默认入口职责。

## 6. 当前下一步

1. 继续细化 `exploration -> structuring -> review` 的领域边界。
2. 在现有 CLI 基础上决定是否再做最小 Web 入口。
3. 保持 QA 与 spec 同步，不在实现阶段临时扩范围。
