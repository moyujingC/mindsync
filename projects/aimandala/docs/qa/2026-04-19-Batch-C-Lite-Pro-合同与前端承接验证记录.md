# 一镜一梳：Batch C Lite / Pro 合同与前端承接验证记录

> 状态：working
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：verification
> source_of_truth：projects/aimandala/docs/qa/2026-04-19-Batch-C-Lite-Pro-合同与前端承接验证记录.md
> depends_on：projects/aimandala/docs/tasks/2026-04-19-Batch-C-Lite-Pro-报告合同与前端承接重构实施计划.md
> reviewers：Engineer, Product Spec Lead, Test / QA

## 1. 验证目标

本记录验证：

1. Lite / Pro 的对外正式合同是否已切到新的产品区块字段
2. `General` 与主题版是否共用同一合同 shape
3. 前端结果页是否已按新字段承接
4. debug 是否已支持按产品区块下钻 trace

## 2. 必查项

1. Lite contract 必有：
   - `topic_context`
   - `current_reading`
   - `visual_basis`
   - `pattern_interpretation`
   - `life_connection`
   - `lite_healing_guidance`
   - `pro_report_entry`
2. Pro contract 必有：
   - `topic_context`
   - `deep_impression`
   - `evidence_digest`
   - `imbalance_diagnosis`
   - `root_cause_chain`
   - `deep_structure_interpretation`
   - `healing_plan`
3. `topic_context.orientation` 必存在，且 `General` 允许更简
4. `pro_teaser` 不再是正式 Lite API 主结果字段
5. debug 必能看到：
   - `topic_context_trace`
   - 区块级 `final / narrative_trace / evidence_trace / prompt_trace / quality_trace`
   - `internal_compatibility`

## 3. 自动化命令

1. `pytest projects/aimandala/toC/app/backend/tests/unit/test_report_contracts.py projects/aimandala/toC/app/backend/tests/unit/test_api_v2_report_contracts.py projects/aimandala/toC/app/backend/tests/unit/test_pipeline_orchestrator.py projects/aimandala/toC/app/backend/tests/unit/test_api_health.py -q`
2. `cd projects/aimandala/toC/app/frontend && npm test -- --run shared/core/report-structure.test.ts shared/ui/shared-ui.test.tsx mobile-web/controller.test.ts mobile-web/app.test.tsx mobile-web/browser-debug-panel.test.tsx`

## 4. 当前结果

待 Batch C 实现与自动化执行后回填。

## 5. 放行条件

1. 后端新合同测试通过
2. 前端共享类型和结果页测试通过
3. debug 区块钻取可见且与合同字段对齐
4. `General` 与主题版只在内容上不同，不在结构上分叉
