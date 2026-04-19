# 一镜一梳：Batch F Golden 审阅记录

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：verification
> source_of_truth：projects/aimandala/docs/qa/2026-04-19-Batch-F-golden-审阅记录.md
> depends_on：projects/aimandala/docs/specs/2026-04-19-固定样本人工-golden-审阅规格.md
> depends_on：projects/aimandala/docs/tasks/2026-04-19-Batch-F-固定样本人工-golden-审阅实施计划.md
> reviewers：Engineer, Test / QA

## 1. 验证目标

本记录用于验证 Batch F 是否已建立正式的人工 golden 审阅闭环：

1. workbench 或脚本是否能导出完整 golden 资产。
2. `001-lite / 002-pro / 002-lite` 是否都存在人工可读审阅记录。
3. `eval summary` 是否新增人工审阅聚合字段。
4. evidence 文档是否已升级为正式审阅索引页。
5. 偏差是否已进入结构化回灌记录。

## 2. 计划验证命令

计划执行：

1. `pytest projects/aimandala/toC/app/backend/tests/unit/test_knowledge_workbench_v22.py -q`
2. `python3 $REPO_ROOT/projects/aimandala/scripts/validate_fixtures.py`
3. `python3 $REPO_ROOT/projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-001 --version lite`
4. `python3 $REPO_ROOT/projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-002 --version pro`
5. `python3 $REPO_ROOT/projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-002 --version lite`

## 3. 固定检查

固定检查：

1. `fixtures/toc-mvp/golden/<fixture-id>/<mode>.report.json` 存在并包含完整报告快照。
2. `fixtures/toc-mvp/golden/<fixture-id>/<mode>.report.md` 为可读审阅文本，而非 JSON dump。
3. `fixtures/toc-mvp/golden/<fixture-id>/<mode>.debug.json` 至少包含：
   - `algorithm_fidelity_trace`
   - `topic_context_trace`
   - `narrative_plans`
   - `field_to_knowledge_map`
   - `fallback_analysis`
   - `warning_analysis`
4. `fixtures/toc-mvp/golden/<fixture-id>/<mode>.review.md` 包含：
   - 教程算法轴判断
   - 产品轴判断
   - 总体等级
   - 偏差项或无偏差结论
5. 正式文档与 golden 资产元数据不得出现机器绝对路径。

## 4. 当前结果

待本批实现后回填。

## 5. 放行条件

1. 自动化命令通过。
2. `001-lite / 002-pro / 002-lite` golden 资产齐全。
3. `001 / 002` evidence 文档已升级为正式审阅索引页。
4. eval summary 已新增人工审阅聚合字段，且未混淆自动摘要与人工结论。
5. Delivery 已记录偏差项与下一批 handoff。
