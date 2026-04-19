# 一镜一梳：Batch C Lite / Pro 报告合同与前端承接重构实施计划

> 状态：current
> 版本：0.1.0
> owner：Engineer / Product Spec Lead
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：implementation-plan
> source_of_truth：projects/aimandala/docs/tasks/2026-04-19-Batch-C-Lite-Pro-报告合同与前端承接重构实施计划.md
> depends_on：projects/aimandala/docs/specs/2026-04-18-报告链路保真重构总规格.md
> depends_on：projects/aimandala/docs/specs/2026-04-18-Lite-Pro-报告定位与内容边界.md
> depends_on：projects/aimandala/docs/architecture/2026-04-18-报告链路保真重构技术方案.md
> depends_on：projects/aimandala/docs/qa/2026-04-18-报告链路保真重构验证基线.md
> reviewers：CEO / Orchestrator, Product Spec Lead, Engineer, Test / QA

## 1. 本批目标

本批只做 `Report Contract -> frontend consumption -> debug drilldown`，不回头重做 `Runtime Evidence` 和 `Narrative Plan`。

目标固定为：

1. 把 Lite / Pro 的对外正式合同改成产品区块字段
2. 把 `Lite / Pro` 固定为报告模式，把 `General / 主题` 固定为议题 SKU
3. 让 `General` 与主题版共用同一合同 shape
4. 把内部写作骨架、兼容派生字段退到 debug / compatibility 层
5. 同轮收口后端合同、前端类型、结果页与 debug 面板

## 2. 本批覆盖范围

本批覆盖：

1. `report_contracts`
2. `structured_report_schema`
3. `routes_v2` 和 API 类型输出
4. frontend shared api types
5. report structure / shared ui / mobile-web 结果页消费
6. browser debug panel 的区块钻取承接

本批不覆盖：

1. `Layer0Assembler`
2. `ImbalanceService`
3. `NarrativeContextService`
4. `ReportPromptPreviewBuilder`
5. fixture 重建与 `toc-mvp` 样本换新
6. 支付、定价或购买链路重做

## 3. 正式合同方向

### 3.1 顶层议题上下文

Lite / Pro 都必须输出：

- `topic_context`
  - `topic`
  - `topic_label`
  - `report_mode`
  - `orientation`

其中 `orientation` 固定为：

- `intro`
- `focus`
- `key_terms`

### 3.2 Lite 正式合同

Lite 只保留这些对外产品区块：

1. `topic_context`
2. `current_reading`
3. `visual_basis`
4. `pattern_interpretation`
5. `life_connection`
6. `lite_healing_guidance`
7. `pro_report_entry`

旧写作骨架字段如 `story`、`theme_insights`、`three_awareness`、`experiment_rendered`、`pro_teaser` 不再作为 canonical 对外字段。

### 3.3 Pro 正式合同

Pro 只保留这些对外产品区块：

1. `topic_context`
2. `deep_impression`
3. `evidence_digest`
4. `imbalance_diagnosis`
5. `root_cause_chain`
6. `deep_structure_interpretation`
7. `healing_plan`

旧字段如 `core_insight_table`、`three_circles_detailed`、`micro_analysis_detailed`、`imbalance_confirmed`、`root_cause`、`healing_suggestions` 退到内部装配层与 debug trace。

## 4. Debug 与兼容策略

本批 debug 固定改成“产品区块钻取”模型。

每个产品区块都应可下钻查看：

1. `final`
2. `narrative_trace`
3. `evidence_trace`
4. `prompt_trace`
5. `quality_trace`

顶层还要暴露：

1. `topic_context_trace`
2. `internal_compatibility`

兼容策略固定为：

1. `can_upgrade / upgrade_price` 暂保留兼容壳
2. `pro_teaser` 只允许保留在 compatibility / legacy projection 层
3. 前端结果页不再把旧字段当作正式主消费入口

## 5. 风险与回退边界

1. 本批允许重写主合同，但不改顶层 API `version`
2. 若旧数据记录仍缺新字段，允许在 contract assembler 内做短期派生
3. 若前端 debug 未同步，新合同不得判定放行
4. 若发现 `General` 与主题版需要不同价格或不同结构，视为 MVP 之外的新产品决策，不在本批临时扩展

## 6. 自动化与通过条件

本批至少执行：

1. 后端：
   - `test_report_contracts.py`
   - `test_api_v2_report_contracts.py`
   - `test_pipeline_orchestrator.py`
   - `test_api_health.py`
2. 前端：
   - `shared/core/report-structure.test.ts`
   - `shared/ui/shared-ui.test.tsx`
   - `mobile-web/controller.test.ts`
   - `mobile-web/app.test.tsx`
   - `mobile-web/browser-debug-panel.test.tsx`

通过条件固定为：

1. `General Lite` 与 `主题 Lite` 使用同一 Lite shape
2. `General Pro` 与 `主题 Pro` 使用同一 Pro shape
3. Lite 页面已消费 `topic_context`、`lite_healing_guidance` 与 `pro_report_entry`
4. Pro 页面已消费新的深度区块字段
5. debug 面板能按产品区块下钻 trace
6. 自动化测试通过并回写 QA / Delivery
