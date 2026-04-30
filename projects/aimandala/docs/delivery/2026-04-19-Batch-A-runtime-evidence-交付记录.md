# 一镜一梳：Batch A Runtime Evidence 交付记录

> 状态：working
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：delivery
> source_of_truth：projects/aimandala/docs/delivery/2026-04-19-Batch-A-runtime-evidence-交付记录.md
> depends_on：projects/aimandala/docs/tasks/2026-04-19-Batch-A-源资料到-runtime-evidence-保真重构实施计划.md
> depends_on：projects/aimandala/docs/qa/2026-04-19-Batch-A-runtime-evidence-验证记录.md
> depends_on：projects/aimandala/docs/delivery/2026-04-18-报告链路保真重构交付记录.md
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

## 1. 本批交付目标

Batch A 的交付目标不是调整用户主报告合同，而是把 `Source Basis -> Runtime Evidence` 这段链路正式收成 evidence-first。

本批固定交付点：

1. `Layer0Raw` evidence 结构定型
2. `ImbalanceService` 全量 trace 落地
3. `transition-overload` 与真正 fallback 分离
4. debug / workbench 能消费新 evidence

## 2. 本批不交付

本批不交付：

1. narrative / prompt 重构
2. Lite / Pro 结果合同改造
3. 前端结果页承接
4. fixture 重建

这些内容分别留给 Batch B、Batch C、Batch D。

## 3. 实现窗口记录

### 3.1 提交 1

文档与治理：

1. Batch A Task 文档
2. Batch A QA 文档
3. Batch A Delivery 文档
4. README 入口挂接

### 3.2 提交 2

runtime evidence / rule engine / 单测：

1. `Layer0Raw` 增加 canonical `fidelity_flags`
2. `ImbalanceService` 改为“20 种全量 trace + ToC 主候选筛选”
3. `Layer0Assembler` 和 report-layer0 fallback 统一输出 evidence-first `rule_evaluations`
4. 对应单测改写并通过

### 3.3 提交 3

debug / workbench / 验证：

1. `KnowledgeQueryEngine` 新增 trace 兼容入口
2. `report_knowledge_debug.py`、`InsightAgent`、`workbench.py` 同步承接 `fidelity_flags` 与 `imbalance_trace`
3. Batch A QA / Delivery 回写真实验证结果

## 4. 验证结果

1. 自动化测试结果
   - `pytest ...test_pipeline_data_models.py ...test_v2_knowledge.py ...test_knowledge_runtime_v21.py ...test_pipeline_orchestrator.py ...test_api_v2_report_contracts.py -q`
   - `97 passed`
2. 样本验证结果
   - 命中型样本可稳定输出 `水多火灭`
   - 平衡型样本会回退到 `transition-overload` synthetic signal，但不会误记为真正 fallback
3. 是否允许进入 Batch B
   - 允许

## 5. 当前风险

当前预设风险固定为：

1. evidence 结构变更需要兼容旧读取点
2. `quality_flags` 仍作为兼容壳保留，未来需要收口
3. narrative / prompt 仍是 projection-first，需留待 Batch B 继续处理

## 6. 下一步

本批完成后，默认下一步为：

1. 回写总 Delivery 中的 Batch A 状态
2. 基于新 evidence 结构进入 Batch B 子计划
