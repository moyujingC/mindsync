# 怀瑾握瑜 MVP 第一版实现任务定义

> 状态：current
> 版本：0.2.0
> owner：Engineer
> last_updated：2026-04-03
> source_of_truth：projects/aicareer/tasks/2026-04-03-mvp-implementation-task.md
> 项目：aicareer
> 阶段：implementation
> depends_on：projects/aicareer/qa/2026-04-03-paper-validation-report.md
> reviewers：CEO / Orchestrator, Architect, Test / QA

这份文档定义 `aicareer` 第一版正式实现任务。

## 1. 任务目标

实现一条最小可运行主路径，使系统能够基于结构化输入生成第一版 `career_asset` Markdown 输出。

## 2. 本轮范围

本轮只覆盖：

1. `intake`
2. `exploration`
3. `structuring`
4. `export`

`review` 在第一版中先用文档化反馈和手工修订承接，不做复杂交互编辑器。

## 3. 预期产物

1. 一个明确的流程入口
2. 一组最小领域数据结构
3. 一个可生成 Markdown `career_asset` 的主流程
4. 至少一组自动化测试或脚本化验证

## 4. 代码目录边界

- `app/`
  - 负责主流程入口和 orchestration
- `domain/`
  - 负责 profile、timeline、narrative、career_asset 等领域结构
- `tests/`
  - 负责最小回归验证
- `data/`
  - 放模拟样本和示例输出

## 5. 实现拆解

1. 建立项目代码目录骨架
2. 定义领域模型
3. 定义主流程输入输出协议
4. 实现 `career_asset` Markdown 生成
5. 用至少 1 个模拟样本做回归验证

## 6. 不做范围

- 不做完整 UI
- 不做长期记忆
- 不做多导出格式
- 不做多用户协作
- 不做外部平台接入

## 7. 验收标准

1. 代码目录与 ADR-0002 一致
2. 可以从结构化输入生成 Markdown `career_asset`
3. 输出至少包含目标、时间线、叙事主线、待补信息四部分
4. 至少有一条自动化或脚本化验证路径

## 8. 风险

1. 如果第一版把 `review` 做得太重，会偏离 MVP
2. 如果领域模型定义过大，会延迟开工
3. 如果没有最小测试路径，后续很快失控

## 9. 当前实现结果

当前已落地：

1. `app/generate-career-asset.js`
2. `domain/career-asset.js`
3. `domain/types.js`
4. `data/sample-profile-01.json`
5. `tests/career-asset.test.js`
