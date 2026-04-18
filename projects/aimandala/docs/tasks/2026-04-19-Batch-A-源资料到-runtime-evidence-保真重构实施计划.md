# 一镜一梳：Batch A 源资料到 Runtime Evidence 保真重构实施计划

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：implementation-plan
> source_of_truth：projects/aimandala/docs/tasks/2026-04-19-Batch-A-源资料到-runtime-evidence-保真重构实施计划.md
> depends_on：projects/aimandala/docs/specs/2026-04-18-报告链路保真重构总规格.md
> depends_on：projects/aimandala/docs/architecture/2026-04-18-报告链路保真重构技术方案.md
> depends_on：projects/aimandala/docs/tasks/2026-04-18-报告链路保真重构实施总计划.md
> depends_on：projects/aimandala/docs/qa/2026-04-18-报告链路保真重构验证基线.md
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

## 1. 本批目标

Batch A 只处理 `Source Basis -> Runtime Evidence`，不进入 narrative、prompt/skeleton、Lite / Pro 合同或前端渲染层。

本批固定目标：

1. 把 `Layer0Raw` 收成正式证据模型
2. 把原始流派中的元素基础状态、三元结构和 20 种失衡体系落到 runtime evidence
3. 把 `ImbalanceService` 从简化 dominance 规则改成“全量 trace + ToC 主候选筛选”
4. 让 debug / workbench 能稳定暴露 evidence trace、fidelity flags 和 synthetic signal

## 2. 本批边界

### 2.1 覆盖范围

本批只覆盖：

1. `Layer0Raw`
2. `Layer0Assembler`
3. `ImbalanceService`
4. `KnowledgeQueryEngine` 的失衡识别兼容入口
5. runtime evidence 的 debug / workbench 承接
6. 对应后端单测与验证记录

### 2.2 不覆盖范围

本批不覆盖：

1. `NarrativeContextService`
2. `ReportPromptPreviewBuilder`
3. `report_contracts`
4. Lite / Pro 前端结果页
5. fixture 体系重建

## 3. 固定实现口径

### 3.1 `Layer0Raw` 正式结构

本批将 `Layer0Raw` 的 canonical evidence 结构固定为：

1. `visual_facts`
2. `knowledge_hits`
3. `rule_evaluations`
4. `theme_projection`
5. `fidelity_flags`
6. `fallback_summary`

兼容口径固定为：

1. `quality_flags` 继续保留，但只作为 `fidelity_flags` 的兼容壳
2. 顶层 `imbalance_candidates` 继续保留，但只等价于 `rule_evaluations.primary_candidates`

### 3.2 `rule_evaluations` 固定 shape

本批将 `rule_evaluations` 固定为以下结构：

1. `element_states`
2. `triad_states`
3. `imbalance_trace`
   - `all_candidates`
   - `primary_candidates`
   - `synthetic_signal`
4. `theme_mappings`

其中：

1. `all_candidates` 保留 20 种失衡的全量评估 trace
2. `primary_candidates` 只保留 `ToC` 主候选，最多 3 条
3. `synthetic_signal` 只承接 `transition-overload`

### 3.3 `ImbalanceService` 固定策略

本批将 `ImbalanceService` 改为：

1. 先根据五行加权分布导出 `element_states`
2. 按 20 种失衡的关系类别逐项打分
3. 三圈主导元素只作为加减权修正，不单独取代五行加权分布
4. `all_candidates` 不受 `toc_supported` 过滤
5. `primary_candidates` 只从 `toc_supported=true` 且分数达阈值的条目中筛选
6. 若无可用 `ToC` 主候选，则启用 `transition-overload` synthetic signal

### 3.4 `fallback_summary` 语义

本批固定语义：

1. `fallback_summary.used=true`
   - 只表示视觉抽取失败或 `Layer0Assembler.build_fallback()` 走了生成兜底
2. `synthetic_signal.used=true`
   - 只表示 20 种失衡 trace 已跑完，但没有任何可用 `ToC` 主候选
3. `transition-overload` 不得再冒充“原始 20 种失衡中的正常候选”

## 4. 执行顺序

本批固定按 3 次提交推进：

1. 文档与治理
   - 本文档
   - Batch A QA / Delivery 文档
   - README 入口挂接
2. runtime evidence / rule engine / 单测
3. debug / workbench / 验证记录

## 5. 风险与回退边界

本批固定风险边界：

1. 允许收紧内部 evidence 结构
2. 不改变用户主结果合同
3. 不引入长期双结构
4. 若兼容层存在，只允许停留在 `quality_flags` -> `fidelity_flags` 这一层

如中途发现 narrative 或报告合同必须同步改动才能通过，本批应停止扩边并回到 Batch B / C 处理。

## 6. 本批完成标准

Batch A 只有在以下条件全部满足时才可宣称完成：

1. `Layer 0` 已稳定区分视觉事实、知识命中和规则推导
2. 20 种失衡已进入 `all_candidates` trace
3. `ToC` 主结果仍只暴露 `primary_candidates`
4. `transition-overload` 与真正 fallback 已分离
5. debug / workbench 已能看到 `fidelity_flags` 和全量 trace
6. 对应自动化测试已通过
7. QA / Delivery 已回写结果
