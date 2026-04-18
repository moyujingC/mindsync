# 一镜一梳：Batch B Narrative Plan 验证记录

> 状态：working
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：verification
> source_of_truth：projects/aimandala/docs/qa/2026-04-19-Batch-B-narrative-plan-验证记录.md
> depends_on：projects/aimandala/docs/qa/2026-04-18-报告链路保真重构验证基线.md
> depends_on：projects/aimandala/docs/tasks/2026-04-19-Batch-B-narrative-plan-与-prompt-skeleton-重构实施计划.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本批验证目标

本记录只服务 Batch B，不替代总 QA 基线。

本批验证目标固定为：

1. `narrative_plan` 已成为 Lite / Pro draft 的 canonical 上游
2. prompt skeleton 已直接消费 `runtime_evidence + narrative_plan`
3. 旧 projection 只剩 compatibility wrapper 角色
4. debug / orchestrator 已能看见 `narrative_plans`

## 2. 验证矩阵

### 2.1 后端单测

本批至少执行：

1. `test_pipeline_data_models.py`
2. `test_knowledge_runtime_v21.py`
3. `test_prompt_builder.py`
4. `test_pipeline_orchestrator.py`
5. `test_report_contracts.py`
6. `test_api_v2_report_contracts.py`

### 2.2 Batch B 核心检查点

#### A. `NarrativeContextService`

必须验证：

1. Lite / Pro `narrative_plan` 都存在
2. `sections` 和 `trace` 结构完整
3. 旧 `build_*_projection()` 仍能从 plan 派生兼容键

#### B. `InterpretationStore`

必须验证：

1. `Layer1LiteDraft.narrative_plan` 可持久化
2. `Layer3ProDraft.narrative_plan` 可持久化
3. 老记录缺少 `narrative_plan` 时，读取不报错

#### C. prompt skeleton / theme context

必须验证：

1. `knowledge_skeleton` 包含 `runtime_evidence`
2. `knowledge_skeleton` 包含 `narrative_plan`
3. `knowledge_skeleton` 不再只围绕 `report_skeleton`
4. `theme_context` 可见 `element_states / triad_states / primary_candidates / fidelity_flags`

#### D. debug / orchestrator

必须验证：

1. `knowledge_debug.narrative_plans.lite` 存在
2. `knowledge_debug.narrative_plans.pro` 存在
3. `knowledge_projections` 仍保留兼容输出
4. orchestrator 生成的 Lite / Pro draft 均带 `narrative_plan`

## 3. 样本验证口径

本批固定关注 2 类 deterministic 样本：

1. 命中型样本
   - `narrative_plan.sections` 能追到明确 `rule_refs`
   - `compatibility_projection` 与 canonical sections 保持一致
2. synthetic signal 样本
   - `transition-overload` 只通过 trace 和 compatibility wrapper 出现
   - `fallback_summary.used=false`

## 4. 结果记录

### 4.1 自动化执行结果

- 执行命令：
  - 待实现后回填
- 结果摘要：
  - 待实现后回填
- 失败项：
  - 待实现后回填

### 4.2 样本观察结果

- 命中型样本：
  - 待实现后回填
- synthetic signal 样本：
  - 待实现后回填

### 4.3 结论

- 是否允许进入 Batch C：
  - 待实现后回填
- 当前残留风险：
  - 待实现后回填
