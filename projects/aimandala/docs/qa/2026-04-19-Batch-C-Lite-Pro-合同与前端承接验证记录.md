# 一镜一梳：Batch C Lite / Pro 合同与前端承接验证记录

> 状态：passed
> 版本：1.0.0
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

截至 2026-04-19，本批验证结果：

1. TDD 红灯验证：
   - `test_api_v2_report_contracts.py` 先失败于 `product_block_debug.lite` 缺少完整产品区块 trace。
   - `browser-debug-panel.test.tsx` 先失败于面板未渲染 `Topic Context Trace / Product Block Debug / Internal Compatibility`。
2. TDD 转绿验证：
   - `pytest projects/aimandala/toC/app/backend/tests/unit/test_api_v2_report_contracts.py -q`
   - 结果：`3 passed`
   - `cd projects/aimandala/toC/app/frontend && npm test -- --run mobile-web/browser-debug-panel.test.tsx`
   - 结果：`1 passed file, 3 passed tests`
3. 全量目标验证：
   - `pytest projects/aimandala/toC/app/backend/tests/unit/test_report_contracts.py projects/aimandala/toC/app/backend/tests/unit/test_api_v2_report_contracts.py projects/aimandala/toC/app/backend/tests/unit/test_pipeline_orchestrator.py projects/aimandala/toC/app/backend/tests/unit/test_api_health.py -q`
   - 结果：`89 passed`
   - `cd projects/aimandala/toC/app/frontend && npm test -- --run shared/core/flow.test.ts shared/core/report-structure.test.ts shared/ui/shared-ui.test.tsx mobile-web/controller.test.ts mobile-web/app.test.tsx mobile-web/browser-debug-panel.test.tsx`
   - 结果：`6 passed files, 26 passed tests`
   - `git diff --check`
   - 结果：通过

已确认：

1. Lite 正式合同只暴露产品区块字段，旧 `pro_teaser` 仅保留在 debug / compatibility 层。
2. Pro 正式合同只暴露产品区块字段，旧 `healing_suggestions` 仅作为内部来源和 debug compatibility 信息存在。
3. debug 已能按产品区块展示 `final / narrative_trace / evidence_trace / prompt_trace / quality_trace`。
4. `General` 与主题版使用同一 Lite / Pro shape，差异收束到 `topic_context` 与内容。

## 5. 放行条件

1. 后端新合同测试通过
2. 前端共享类型和结果页测试通过
3. debug 区块钻取可见且与合同字段对齐
4. `General` 与主题版只在内容上不同，不在结构上分叉

## 6. 残留观察项

1. `can_upgrade / upgrade_price` 仍是兼容壳字段，不再代表产品真相，后续可在兼容清理批次处理。
2. prompt schema 仍保持 `1.6`，其内部字段名仍会出现旧写作骨架；本批只保证对外主合同和 debug trace 已切到产品区块模型。
3. 测试运行可能写动 `projects/aimandala/toC/app/backend/data/interpretations/legacy-route-record.json` 的末尾换行；该文件不纳入本批提交。
