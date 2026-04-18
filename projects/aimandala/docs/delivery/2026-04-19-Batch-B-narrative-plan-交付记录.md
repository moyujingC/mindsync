# 一镜一梳：Batch B Narrative Plan 交付记录

> 状态：working
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：delivery
> source_of_truth：projects/aimandala/docs/delivery/2026-04-19-Batch-B-narrative-plan-交付记录.md
> depends_on：projects/aimandala/docs/tasks/2026-04-19-Batch-B-narrative-plan-与-prompt-skeleton-重构实施计划.md
> depends_on：projects/aimandala/docs/qa/2026-04-19-Batch-B-narrative-plan-验证记录.md
> depends_on：projects/aimandala/docs/delivery/2026-04-18-报告链路保真重构交付记录.md
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

## 1. 本批交付目标

Batch B 的交付目标不是改动前端或对外合同，而是把 backend 的 `Narrative Plan` 和 prompt upstream 正式收成 `evidence-first`。

本批固定交付点：

1. `narrative_plan` 在 Lite / Pro draft 上落地
2. `NarrativeContextService` 改成 plan-first
3. prompt skeleton 直接消费 `runtime_evidence + narrative_plan`
4. debug / orchestrator 可见 canonical `narrative_plans`

## 2. 本批不交付

本批不交付：

1. `report_contracts` 对外字段改版
2. 前端结果页承接
3. fixture 重建
4. Batch C 的 debug UI 展示变化

这些内容分别留给 Batch C、Batch D。

## 3. 实现窗口记录

### 3.1 提交 1

文档与治理：

1. Batch B Task 文档
2. Batch B QA 文档
3. Batch B Delivery 文档
4. README 入口挂接

### 3.2 提交 2

`narrative_plan` / resolver / persistence / 单测：

1. Lite / Pro draft 新增 `narrative_plan`
2. `NarrativeContextService` 新增 canonical builder
3. `ReportProjectionResolver` 改成 plan-aware resolver
4. `InterpretationStore` 新增持久化兼容
5. 对应单测改写并通过

### 3.3 提交 3

prompt skeleton / debug / 验证：

1. `ReportPromptPreviewBuilder` 输出 canonical skeleton
2. `report_lite_narrative_builder` / `report_pro_narrative_builder` 改成 plan-first 消费
3. `report_knowledge_debug.py` 新增 `narrative_plans`
4. Batch B QA / Delivery 回写真实验证结果

## 4. 验证结果

1. 自动化测试结果
   - 待实现后回填
2. 样本验证结果
   - 待实现后回填
3. 是否允许进入 Batch C
   - 待实现后回填

## 5. 当前风险

当前预设风险固定为：

1. projection 兼容壳仍需保留到 Batch C
2. `report_contracts` 仍消费旧 top-level draft 字段，需在 Batch C 继续收口
3. `three_awareness / experiment / pro_teaser` 仍以兼容字段形式存在，需在 Batch C / D 决定去留

## 6. 下一步

本批完成后，默认下一步为：

1. 回写总 Delivery 中的 Batch B 状态
2. 基于 canonical `narrative_plan` 进入 Batch C 合同与前端承接重构
