# 一镜一梳：Lite / Pro 旧版水平回补 QA 基线

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-27
> 项目：aimandala
> 阶段：verification
> source_of_truth：projects/aimandala/docs/qa/2026-04-27-Lite-Pro-旧版水平回补-qa-basis.md
> depends_on：projects/aimandala/docs/tasks/2026-04-27-Lite-Pro-旧版水平回补实施计划.md
> reviewers：Engineer, Test / QA

## 1. 验证目标

本基线只验证一件事：

当前 `Lite / Pro` 的生成 prompt 是否已经回补到旧版 `dev/ai-mandala` 的成文约束水平。

## 2. 通过门槛

本批通过至少满足：

1. Lite 模板继续保留当前 JSON 合同字段。
2. Lite 模板新增“首段快速命中、六段递进、主题落现实”的明确约束。
3. Pro 模板继续保留当前 JSON 合同字段。
4. Pro 模板新增“先命中再分析、执行摘要独立、根因三层递进、建议可执行”的明确约束。
5. Prompt builder 单测通过。
6. 与报告生成相关的后端单测通过。

## 3. 计划验证命令

计划执行：

1. `pytest toC/app/backend/tests/unit/test_prompt_builder.py -q`
2. `pytest toC/app/backend/tests/unit/test_pipeline_orchestrator.py -q`
3. `pytest toC/app/backend/tests/unit/test_report_contracts.py -q`

## 4. 固定检查

固定检查：

1. Lite prompt 中必须同时出现：
   - “第一段必须尽快命中用户当前状态”
   - “六段要形成递进”
   - “不能只把字段填满”
2. Pro prompt 中必须同时出现：
   - “先完成被看见，再进入深度分析”
   - “不是 Lite 扩写版”
   - “根源探索必须区分表面现象、深层模式、核心信念”
3. 现有 `knowledge_skeleton` 注入能力不应丢失。

## 5. veto 条件

出现以下任一项，本批不得判定通过：

1. 模板字段结构被破坏。
2. Lite / Pro 任一模板丢失 `knowledge_skeleton` 约束段。
3. Prompt builder 或 pipeline 单测失败。
