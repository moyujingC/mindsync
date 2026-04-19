# 一镜一梳：Batch G Golden 偏差回灌修复实施计划

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：implementation-plan
> source_of_truth：projects/aimandala/docs/tasks/2026-04-19-Batch-G-golden-偏差回灌修复实施计划.md
> depends_on：projects/aimandala/docs/specs/2026-04-19-报告内容偏差回灌修复规格.md
> depends_on：projects/aimandala/docs/delivery/2026-04-19-Batch-F-golden-审阅交付记录.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本批目标

本批目标是关闭 Batch F 登记的 5 个 golden 偏差：

1. `BATCH-F-002-PRO-FAIL-001`：Pro `healing_plan` raw payload 泄漏。
2. `BATCH-F-002-LITE-FAIL-001`：显式 Lite debug fidelity 被 Pro draft 污染。
3. `BATCH-F-001-LITE-DRIFT-001`：Lite 逐圈深浅状态压缩不足。
4. `BATCH-F-002-PRO-FAIL-002`：Pro 逐圈深浅状态展开不足。
5. `BATCH-F-002-LITE-FAIL-002`：主题 Lite 逐圈深浅状态压缩不足。

本批不改 Lite / Pro 对外字段 shape，不改前端消费合同，不重做 shape recognition。

## 2. 实施顺序

本批按 4 个提交收口：

1. Batch G `Spec / Task / QA / Delivery` 文档。
2. `healing_plan` raw payload sanitization 与测试。
3. debug fidelity mode scope 与测试。
4. 逐圈深浅压缩、golden 重导、eval summary 与 QA / Delivery 回填。

## 3. 具体改动

### 3.1 Report Contract Sanitization

修改 `projects/aimandala/toC/app/backend/app/core/pipeline/report_contracts.py`：

1. 强化 `_sanitize_text()`，识别 Python dict、JSON-like、截断 dict 片段。
2. `healing_plan` 每个 typed 字段都必须通过清洗。
3. 清洗后为空时，从 Pro 已有正式区块和 narrative plan 重建用户可读内容。
4. 增加单测覆盖 `": '金色', 'middle': '红色', 'outer': '土色'}"`。

### 3.2 Debug Trace Scoping

修改 `projects/aimandala/toC/app/backend/app/core/pipeline/report_knowledge_debug.py`：

1. `algorithm_fidelity_trace` 明确记录当前 `scope`。
2. Lite scope 只扫描 Lite 输出和 Lite narrative plan。
3. Pro scope 扫描 Pro 输出和 Pro draft。
4. 可保留 all scope 作为内部审计，但 golden 默认按请求版本计算。

### 3.3 Narrative Compression Fidelity

修改 `narrative_context_service.py` 与必要的 contract/debug 装配：

1. 从 `per_circle_color_analysis.*.state_basis` 生成稳定的人可读逐圈摘要。
2. Lite `visual_basis` 注入简洁逐圈深浅依据。
3. Pro `evidence_digest` 注入更完整逐圈证据摘要。
4. debug 产品区块 trace 暴露 `color_analysis_refs` 与摘要。

## 4. 验收门槛

本批只有同时满足以下条件才算通过：

1. `test_report_contracts.py` 与 `test_api_v2_report_contracts.py` 通过。
2. `test_knowledge_runtime_v21.py` 通过。
3. `test_knowledge_workbench_v22.py` 通过。
4. `validate_fixtures.py` 通过。
5. `001-lite / 002-pro / 002-lite` golden 已重导。
6. eval summary 中 `raw_payload_leak_found_count = 0` 且 `algorithm_fidelity_fail_count = 0`。
7. QA / Delivery 明确记录偏差关闭情况和剩余风险。
