# 一镜一梳：Batch B Narrative Plan 与 Prompt Skeleton 重构实施计划

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：implementation-plan
> source_of_truth：projects/aimandala/docs/tasks/2026-04-19-Batch-B-narrative-plan-与-prompt-skeleton-重构实施计划.md
> depends_on：projects/aimandala/docs/specs/2026-04-18-报告链路保真重构总规格.md
> depends_on：projects/aimandala/docs/specs/2026-04-18-Lite-Pro-报告定位与内容边界.md
> depends_on：projects/aimandala/docs/architecture/2026-04-18-报告链路保真重构技术方案.md
> depends_on：projects/aimandala/docs/tasks/2026-04-18-报告链路保真重构实施总计划.md
> depends_on：projects/aimandala/docs/qa/2026-04-18-报告链路保真重构验证基线.md
> depends_on：projects/aimandala/docs/qa/2026-04-19-Batch-A-runtime-evidence-验证记录.md
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

## 1. 本批目标

Batch B 只处理 `Runtime Evidence -> Narrative Plan -> prompt/skeleton upstream`，不进入前端结果合同、不进入页面渲染、不进入 fixture 重建。

本批固定目标：

1. 把 narrative 从 `projection-first` 收成正式 `plan-first`
2. 让 Lite / Pro draft 都具备 canonical `narrative_plan`
3. 让 prompt skeleton 和 theme context 直接消费 `Layer 0` evidence 与 narrative trace
4. 把旧 projection 收成 compatibility wrapper，不再作为 runtime canonical 叙事层

## 2. 本批边界

### 2.1 覆盖范围

本批只覆盖：

1. `NarrativeContextService`
2. `ReportPromptPreviewBuilder`
3. `ReportProjectionResolver`
4. `report_lite_narrative_builder`
5. `report_pro_narrative_builder`
6. `report_draft_assembler`
7. `InterpretationStore`
8. `report_knowledge_debug.py`
9. 对应后端单测与验证记录

### 2.2 不覆盖范围

本批不覆盖：

1. `report_contracts` 对外字段改版
2. Lite / Pro API 顶层响应结构
3. 前端类型与页面渲染
4. `toc-mvp` fixture 重建
5. Batch C 的 debug payload UI 承接

## 3. 固定实现口径

### 3.1 `narrative_plan` 正式结构

本批将 `narrative_plan` 固定为 Lite / Pro draft 的 canonical 中间层。

Lite 固定包含：

1. `mode`
2. `generation_mode`
3. `theme`
4. `theme_label`
5. `evidence_trace_summary`
6. `sections`
   - `title`
   - `overall_impression`
   - `visual_elements`
   - `emotion_portrait`
   - `story_sections`
   - `theme_insights`
   - `lite_healing_guidance`
   - `pro_report_entry`
7. `legacy_projection`

Pro 固定包含：

1. `mode`
2. `generation_mode`
3. `theme`
4. `theme_label`
5. `evidence_trace_summary`
6. `sections`
   - `first_impression`
   - `core_insight_table`
   - `three_circles_detailed`
   - `micro_analysis_detailed`
   - `imbalance_confirmed`
   - `root_cause`
   - `healing_suggestions`
7. `legacy_projection`

### 3.2 `NarrativeContextService` 固定职责

本批将 `NarrativeContextService` 的正式职责固定为：

1. 从 `Layer 0` evidence 生成 `narrative_plan`
2. 从 `narrative_plan` 派生旧 projection
3. 从 `rule_evaluations` 与 `theme_projection` 生成失衡 narrative basis

本批不允许：

1. 继续把 narrative asset 当成事实层
2. 用 blueprint 模板直接生产新的知识结论
3. 跳过 `Layer 0` evidence 直接拼出主段落判断

### 3.3 Prompt skeleton 固定结构

本批将 `knowledge_skeleton` canonical 结构固定为：

1. `generation_mode`
2. `theme`
3. `theme_label`
4. `user_input`
5. `runtime_evidence`
6. `narrative_plan`
7. `compatibility_projection`

其中：

1. `runtime_evidence` 直接承接 `Layer 0` canonical buckets
2. `narrative_plan` 直接承接 canonical sections 和 trace
3. `compatibility_projection` 只作调试与过渡观察，不再是主入口

### 3.4 Lite / Pro draft 消费口径

Lite / Pro draft builder 固定按下面顺序消费：

1. 优先读 `narrative_plan`
2. 若缺失 `narrative_plan`，才回退到当前 fallback 文本逻辑
3. 顶层旧字段从 `narrative_plan.sections` 和 `legacy_projection` 回填
4. 不再把 projection 当作唯一 runtime 真相

## 4. 执行顺序

本批固定按 3 次提交推进：

1. 文档与治理
   - 本文档
   - Batch B QA / Delivery 文档
   - README 入口挂接
2. `narrative_plan` / resolver / persistence / 单测
3. prompt skeleton / debug / orchestrator 回归 / 验证记录

## 5. 风险与回退边界

本批固定风险边界：

1. 允许收紧 backend 内部 narrative 接口
2. 不改变用户主报告合同
3. 旧 projection 可以作为兼容壳保留到 Batch C
4. 若实现发现必须同步调整 `report_contracts` 才能通过，则停止扩边并回到 Batch C

## 6. 本批完成标准

Batch B 只有在以下条件全部满足时才可宣称完成：

1. `NarrativeContextService` 已具备 canonical `narrative_plan`
2. Lite / Pro draft 都已持久化 `narrative_plan`
3. prompt 上游已直接看到 `runtime_evidence + narrative_plan`
4. 旧 projection 只剩 compatibility wrapper 角色
5. debug 已能看到 `narrative_plans.lite / pro`
6. 对应自动化测试已通过
7. QA / Delivery 已回写结果
