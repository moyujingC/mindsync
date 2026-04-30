# 一镜一梳：Batch F 固定样本人工 Golden 审阅实施计划

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：implementation-plan
> source_of_truth：projects/aimandala/docs/tasks/2026-04-19-Batch-F-固定样本人工-golden-审阅实施计划.md
> depends_on：projects/aimandala/docs/specs/2026-04-19-固定样本人工-golden-审阅规格.md
> depends_on：projects/aimandala/docs/tasks/2026-04-18-报告链路保真重构实施总计划.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本批目标

本批目标是建立 `fixture -> full report snapshot -> human rubric -> deviation record -> next-fix entry` 的正式闭环。

本批固定覆盖：

1. `toc-mvp-fixture-001` Lite
2. `toc-mvp-fixture-002` Pro
3. `toc-mvp-fixture-002` Lite

`toc-mvp-fixture-004` 仅保留 warning trace 旁证，不作为首批主 golden 样本。

## 2. 实施顺序

本批按 3 个提交收口：

1. Batch F 文档 artifact
2. golden 导出入口、eval summary 聚合与最小自动化测试
3. golden 资产生成、evidence 重写、QA / Delivery 回填与验证记录

## 3. 具体改动

本批固定实现以下能力：

1. `KnowledgeWorkbench` 新增 golden 导出入口。
2. workbench 或脚本能输出：
   - 完整 `report.json`
   - 面向人工阅读的 `report.md`
   - 精简 `debug.json`
3. `fixtures/toc-mvp/evidence/toc-mvp-fixture-001.md` 与 `002.md` 升级为正式审阅索引页。
4. `eval summary` 新增人工审阅聚合字段：
   - `golden_reviewed_count`
   - `golden_pass_count`
   - `golden_pass_with_drift_count`
   - `golden_fail_count`
   - `open_deviation_count`
5. `fixtures/toc-mvp/golden/**` 形成可持续追加的正式资产布局。

## 4. 风险边界

1. 本批可记录报告偏差，但不在同批顺手修复算法层。
2. 人工审阅结论必须与自动摘要分离，不能把 `algorithm_fidelity_pass=true` 直接等同于 `golden_pass=true`。
3. 若导出内容出现绝对路径，必须在资产落盘前做 repo-relative 清洗。
4. `003 / 004` 可先保持轻量 evidence，但要写清是否纳入后续主审阅。

## 5. 验收门槛

本批只有同时满足以下条件才算通过：

1. golden 导出入口可稳定导出 `001-lite / 002-pro / 002-lite`。
2. `report.json`、`report.md`、`debug.json`、`review.md` 四类资产齐全。
3. `001` 与 `002` evidence 文档已具备教程依据、结论摘要、偏差列表和回灌入口。
4. `test_knowledge_workbench_v22.py` 与 `validate_fixtures.py` 通过。
5. QA 与 Delivery 已明确记录合格项、偏差项和下一批 handoff。
