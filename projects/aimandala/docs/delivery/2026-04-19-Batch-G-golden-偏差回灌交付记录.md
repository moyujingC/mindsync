# 一镜一梳：Batch G Golden 偏差回灌交付记录

> 状态：delivered
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：delivery
> source_of_truth：projects/aimandala/docs/delivery/2026-04-19-Batch-G-golden-偏差回灌交付记录.md
> depends_on：projects/aimandala/docs/tasks/2026-04-19-Batch-G-golden-偏差回灌修复实施计划.md
> depends_on：projects/aimandala/docs/qa/2026-04-19-Batch-G-golden-偏差回灌验证记录.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本批交付范围

本批交付范围固定为：

1. Batch G 文档 artifact。
2. Pro `healing_plan` raw payload sanitization。
3. mode-aware debug fidelity scope。
4. 逐圈深浅状态进入 Lite `visual_basis` 与 Pro `evidence_digest`。
5. `001-lite / 002-pro / 002-lite` golden 重导与 eval summary 更新。

## 2. 当前目标状态

本批完成后应满足：

1. Batch F 的 raw payload 泄漏不再出现在正式报告链路。
2. Lite 单模式审阅不再被 Pro draft 污染。
3. 用户可读报告能看到原始教程要求的逐圈颜色、深浅、面积或填充依据。
4. eval summary 不再记录 algorithm fidelity fail 或 raw payload leak。

## 3. 当前结果

本批已完成以下交付：

1. Batch G 文档 artifact：
   - `specs/2026-04-19-报告内容偏差回灌修复规格.md`
   - `tasks/2026-04-19-Batch-G-golden-偏差回灌修复实施计划.md`
   - `qa/2026-04-19-Batch-G-golden-偏差回灌验证记录.md`
   - `delivery/2026-04-19-Batch-G-golden-偏差回灌交付记录.md`
2. Pro `healing_plan` sanitization：
   - 对外 `structured.healing_plan` 不再泄漏 raw payload。
   - Pro draft 用户字段不再从 runtime healing 透传颜色 dict。
3. debug fidelity mode scope：
   - golden 导出和 workbench preview 按请求版本传入 `report_mode`。
   - Lite scope 不再被 Pro draft 或 Pro prompt preview 污染。
4. 逐圈深浅状态压缩：
   - Lite `visual_basis` 可读呈现三圈颜色、深浅、填充和面积依据。
   - Pro `evidence_digest` 可读呈现三圈颜色、深浅、填充和面积依据。
   - debug 产品区块 trace 暴露 `per_circle_color_summary`。
5. golden 与 eval 重导：
   - `toc-mvp-fixture-001 / lite`
   - `toc-mvp-fixture-002 / pro`
   - `toc-mvp-fixture-002 / lite`
   - `current` 与 `candidate:test-v22` eval summary

## 3.1 偏差关闭情况

本批关闭 Batch F 的 5 个偏差：

1. `BATCH-F-001-LITE-DRIFT-001`：已关闭。
2. `BATCH-F-002-PRO-FAIL-001`：已关闭。
3. `BATCH-F-002-PRO-FAIL-002`：已关闭。
4. `BATCH-F-002-LITE-FAIL-001`：已关闭。
5. `BATCH-F-002-LITE-FAIL-002`：已关闭。

## 3.2 当前指标

`current` 与 `candidate:test-v22` eval summary 均为：

1. `algorithm_fidelity_fail_count = 0`
2. `raw_payload_leak_found_count = 0`
3. `regression_flag_count = 0`
4. `golden_pass_count = 3`
5. `golden_fail_count = 0`
6. `open_deviation_count = 0`

## 4. 残留风险

本批不处理：

1. 新的 shape recognition fidelity。
2. Lite / Pro 对外字段 shape 重设计。
3. 前端结果页改版。
4. 价格或 SKU 模型调整。

## 5. 下一步 handoff

当前没有 Batch F 遗留偏差继续 handoff。

后续若人工审阅继续发现 shape fidelity、主题语言校准或 deeper narrative compression 问题，应另开 Batch H，不在 Batch G 中追补范围。
