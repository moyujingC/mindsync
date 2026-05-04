# 一镜一梳：Batch G Golden 偏差回灌验证记录

> 状态：passed
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：verification
> source_of_truth：projects/aimandala/docs/qa/2026-04-19-Batch-G-golden-偏差回灌验证记录.md
> depends_on：projects/aimandala/docs/specs/2026-04-19-报告内容偏差回灌修复规格.md
> depends_on：projects/aimandala/docs/tasks/2026-04-19-Batch-G-golden-偏差回灌修复实施计划.md
> reviewers：Engineer, Test / QA

## 1. 验证目标

本记录用于验证 Batch G 是否关闭 Batch F 登记偏差：

1. Pro `healing_plan` raw payload 泄漏已关闭。
2. Lite debug fidelity 不再被 Pro draft 污染。
3. Lite / Pro 用户可读报告能稳定看到逐圈颜色、深浅或明暗、面积或填充依据。
4. golden 资产和 eval summary 已重导。

## 2. 计划验证命令

计划执行：

1. `pytest projects/aimandala/toC/app/backend/tests/unit/test_report_contracts.py projects/aimandala/toC/app/backend/tests/unit/test_api_v2_report_contracts.py -q`
2. `pytest projects/aimandala/toC/app/backend/tests/unit/test_knowledge_runtime_v21.py -q`
3. `pytest projects/aimandala/toC/app/backend/tests/unit/test_knowledge_workbench_v22.py -q`
4. `python3 projects/aimandala/scripts/validate_fixtures.py`
5. `python3 projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-001 --version lite`
6. `python3 projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-002 --version pro`
7. `python3 projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-002 --version lite`

## 3. 固定检查

固定检查：

1. `healing_plan` 不包含 raw dict、截断 dict、`{'inner'`、`'middle':`、`'outer':`。
2. `toc-mvp-fixture-002 / lite` 的 `algorithm_fidelity_trace.raw_payload_leak_found = false`。
3. `toc-mvp-fixture-002 / pro` 的 `algorithm_fidelity_trace.raw_payload_leak_found = false`。
4. Lite `visual_basis` 包含三圈逐圈颜色 / 深浅 / 填充依据。
5. Pro `evidence_digest` 包含三圈逐圈颜色 / 深浅 / 填充依据。
6. debug 产品区块 trace 可追到 `per_circle_color_analysis`。
7. 正式文档、fixture、golden 资产不出现机器绝对路径。

## 4. 当前结果

已完成验证，结果如下：

1. Pro `healing_plan` raw payload 泄漏已关闭。
   - `toc-mvp-fixture-002 / pro` 的正式 `structured.healing_plan` 不再包含 raw dict 或截断 dict 片段。
   - Pro draft 用户字段已过滤 runtime healing 中的 raw payload。
2. debug fidelity 已按报告模式收敛。
   - `toc-mvp-fixture-002 / lite` 的 `algorithm_fidelity_trace.scope = lite`。
   - Lite scope 不再扫描 Pro prompt preview 或 Pro draft 上游证据快照。
3. 逐圈深浅状态已进入用户可读报告。
   - `toc-mvp-fixture-001 / lite` 的 `visual_basis` 含内圈、中圈、外圈的深浅 / 填充 / 面积约值。
   - `toc-mvp-fixture-002 / lite` 的 `visual_basis` 含内圈、中圈、外圈的深浅 / 填充 / 面积约值。
   - `toc-mvp-fixture-002 / pro` 的 `evidence_digest` 含三圈深浅 / 填充 / 面积约值，并在关系解释之前呈现。
4. debug 产品区块 trace 已能追到 `method:per_circle_color_analysis` 与 `per_circle_color_summary`。

### 4.1 Golden 审阅结论

本批重导并更新三份 golden review：

1. `toc-mvp-fixture-001 / lite`
   - 结论：`pass`
   - 偏差数：0
   - 已关闭：`BATCH-F-001-LITE-DRIFT-001`
2. `toc-mvp-fixture-002 / pro`
   - 结论：`pass`
   - 偏差数：0
   - 已关闭：`BATCH-F-002-PRO-FAIL-001`
   - 已关闭：`BATCH-F-002-PRO-FAIL-002`
3. `toc-mvp-fixture-002 / lite`
   - 结论：`pass`
   - 偏差数：0
   - 已关闭：`BATCH-F-002-LITE-FAIL-001`
   - 已关闭：`BATCH-F-002-LITE-FAIL-002`

### 4.2 Eval Summary 结果

`current` 与 `candidate:test-v22` 的 `summary.json` 均已更新为：

1. `fixture_count = 4`
2. `algorithm_fidelity_fail_count = 0`
3. `legacy_semantics_found_count = 0`
4. `raw_payload_leak_found_count = 0`
5. `structured_missing_count = 0`
6. `regression_flag_count = 0`
7. `golden_reviewed_count = 3`
8. `golden_pass_count = 3`
9. `golden_pass_with_drift_count = 0`
10. `golden_fail_count = 0`
11. `open_deviation_count = 0`

### 4.3 自动化结果

已执行并通过：

1. `pytest projects/aimandala/toC/app/backend/tests/unit/test_report_contracts.py projects/aimandala/toC/app/backend/tests/unit/test_api_v2_report_contracts.py -q`
   - 结果：通过
2. `pytest projects/aimandala/toC/app/backend/tests/unit/test_knowledge_runtime_v21.py -q`
   - 结果：通过
3. `pytest projects/aimandala/toC/app/backend/tests/unit/test_knowledge_workbench_v22.py -q`
   - 结果：通过
4. `python3 projects/aimandala/scripts/validate_fixtures.py`
   - 结果：通过
5. `python3 projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-001 --version lite`
   - 结果：通过
6. `python3 projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-002 --version pro`
   - 结果：通过
7. `python3 projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-002 --version lite`
   - 结果：通过

静态检查：

1. golden 目录未发现 raw dict、旧升级语义或本机绝对路径。
2. `git diff --check` 通过。

## 5. 放行条件

本批放行条件：

1. 自动化测试通过。
2. golden 资产已重导。
3. eval summary 反映 `raw_payload_leak_found_count = 0` 与 `algorithm_fidelity_fail_count = 0`。
4. Batch F 的 5 个偏差均已关闭或明确降级为剩余 drift。

当前状态为 `passed`：Batch F 的 5 个开放偏差已全部关闭。
