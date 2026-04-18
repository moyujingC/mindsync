# 一镜一梳：Batch A Runtime Evidence 验证记录

> 状态：working
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：verification
> source_of_truth：projects/aimandala/docs/qa/2026-04-19-Batch-A-runtime-evidence-验证记录.md
> depends_on：projects/aimandala/docs/qa/2026-04-18-报告链路保真重构验证基线.md
> depends_on：projects/aimandala/docs/tasks/2026-04-19-Batch-A-源资料到-runtime-evidence-保真重构实施计划.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本批验证目标

本记录只服务 Batch A，不替代总 QA 基线。

本批验证目标固定为：

1. `Layer0Raw` 已形成正式 evidence 结构
2. `ImbalanceService` 已输出“全量 trace + ToC 主候选”
3. `transition-overload` 已与真正 fallback 分离
4. debug / workbench 已能看到 `fidelity_flags` 和 trace

## 2. 验证矩阵

### 2.1 后端单测

本批至少执行：

1. `test_pipeline_data_models.py`
2. `test_v2_knowledge.py`
3. `test_knowledge_runtime_v21.py`
4. `test_pipeline_orchestrator.py`
5. `test_api_v2_report_contracts.py`

### 2.2 Batch A 核心检查点

#### A. `ImbalanceService`

必须验证：

1. 20 种失衡都进入 `all_candidates`
2. `toc_supported=false` 的条目不进入 `primary_candidates`
3. 命中型样本不会退回 `transition-overload`
4. 只有没有可用 `ToC` 主候选时才启用 `synthetic_signal`

#### B. `Layer0Assembler`

必须验证：

1. `visual_facts`
2. `knowledge_hits`
3. `rule_evaluations`
4. `theme_projection`
5. `fidelity_flags`
6. `fallback_summary`

全部稳定存在。

#### C. fallback / signal 语义

必须验证：

1. `fallback_summary.used=false` 且 `synthetic_signal.used=true` 可以同时成立
2. `fallback_summary.used=true` 只发生在真正生成兜底路径
3. `transition-overload` 不被记录为“20 种失衡中的正常候选”

#### D. debug / workbench

必须验证：

1. debug payload 可见 `fidelity_flags`
2. debug payload 可见 `element_states / triad_states / imbalance_trace / synthetic_signal`
3. workbench override 只覆盖主候选，不丢失 `all_candidates`

## 3. 样本验证口径

本批先不重建 fixtures，但至少保留 2 类 deterministic 样本：

1. 命中型样本
   - `primary_candidates` 非空
   - `synthetic_signal.used=false`
2. 回退信号型样本
   - `primary_candidates=["transition-overload"]`
   - `fallback_summary.used=false`

## 4. 结果记录

### 4.1 自动化执行结果

待实现完成后回写：

- 执行命令：
- 结果摘要：
- 失败项：

### 4.2 样本观察结果

待实现完成后回写：

- 命中型样本：
- 回退信号型样本：

### 4.3 结论

待实现完成后回写：

- 是否允许进入 Batch B：
- 当前残留风险：
