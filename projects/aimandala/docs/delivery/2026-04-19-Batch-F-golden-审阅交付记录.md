# 一镜一梳：Batch F Golden 审阅交付记录

> 状态：delivered_with_open_deviations
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：delivery
> source_of_truth：projects/aimandala/docs/delivery/2026-04-19-Batch-F-golden-审阅交付记录.md
> depends_on：projects/aimandala/docs/tasks/2026-04-19-Batch-F-固定样本人工-golden-审阅实施计划.md
> depends_on：projects/aimandala/docs/qa/2026-04-19-Batch-F-golden-审阅记录.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本批交付范围

本批交付覆盖：

1. Batch F golden 审阅规格、计划、验证与交付文档
2. golden 导出入口与固定资产布局
3. `001-lite / 002-pro / 002-lite` 人工 golden 审阅资产
4. evidence 审阅索引页
5. 偏差回灌入口与后续 handoff

## 2. 当前目标状态

本批完成后应满足：

1. 固定样本不再只剩字段摘要，而能查看完整报告快照和精简 debug trace。
2. 每份人工审阅都能明确说明是否仍曲解原始教程算法。
3. 偏差不会只停留在聊天里，而会进入结构化回灌记录。
4. 后续算法修复批次有明确输入，不再靠零散主观阅读推进。

## 3. 当前结果

本批已完成以下交付：

1. 文档 artifact：
   - `specs/2026-04-19-固定样本人工-golden-审阅规格.md`
   - `tasks/2026-04-19-Batch-F-固定样本人工-golden-审阅实施计划.md`
   - `qa/2026-04-19-Batch-F-golden-审阅记录.md`
   - `delivery/2026-04-19-Batch-F-golden-审阅交付记录.md`
2. golden 导出能力：
   - `KnowledgeWorkbench.export_fixture_golden(...)`
   - `scripts/export_fixture_golden.py`
3. 三份 golden 审阅资产：
   - `toc-mvp-fixture-001 / lite`
   - `toc-mvp-fixture-002 / pro`
   - `toc-mvp-fixture-002 / lite`
4. evidence 审阅索引：
   - `fixtures/toc-mvp/evidence/toc-mvp-fixture-001.md`
   - `fixtures/toc-mvp/evidence/toc-mvp-fixture-002.md`
5. eval summary 人工审阅聚合字段：
   - `golden_reviewed_count`
   - `golden_pass_count`
   - `golden_pass_with_drift_count`
   - `golden_fail_count`
   - `open_deviation_count`

## 3.1 审阅结论

当前三份审阅结论：

1. `001-lite`
   - 结论：`pass_with_drift`
   - 偏差：逐圈深浅状态未稳定进入用户可读报告
2. `002-pro`
   - 结论：`fail`
   - 偏差：Pro `healing_plan` raw payload 泄漏；逐圈深浅状态未稳定进入用户可读报告
3. `002-lite`
   - 结论：`fail`
   - 偏差：debug fidelity 被同一 interpretation 的 Pro raw payload 污染；逐圈深浅状态未稳定进入用户可读报告

## 4. 残留风险

当前保留以下风险：

1. `toc-mvp-fixture-002` 不能作为合格内容 golden，只能作为偏差样本。
2. Pro `healing_plan` 仍存在 raw payload 泄漏，必须在下一批修复。
3. 逐圈深浅状态仍没有稳定压缩到用户可读报告，必须在 narrative compression 层继续治理。
4. eval summary 当前能聚合人工 review，但 fixture 默认版本列表中只直接挂一份 review；同一 fixture 多模式 review 通过 golden 目录全量聚合进入总数。

## 5. 下一步 handoff

下一阶段 handoff：

1. Batch G report contract sanitization
   - 输入：`BATCH-F-002-PRO-FAIL-001`
   - 目标：修复 `healing_plan` raw payload 泄漏
2. Batch G debug trace scoping
   - 输入：`BATCH-F-002-LITE-FAIL-001`
   - 目标：避免显式 Lite 审阅被同一 interpretation 的 Pro raw payload 污染
3. Batch G narrative compression fidelity
   - 输入：
     - `BATCH-F-001-LITE-DRIFT-001`
     - `BATCH-F-002-PRO-FAIL-002`
     - `BATCH-F-002-LITE-FAIL-002`
   - 目标：把逐圈深浅状态稳定压缩进用户可读报告

本批不修上述内容偏差，只交付可复查、可定位、可回灌的 golden 审阅闭环。
