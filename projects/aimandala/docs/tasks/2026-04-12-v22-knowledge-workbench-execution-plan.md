# Aimandala 知识库 v2.2 workbench 执行计划

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-12
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-12-v22-knowledge-workbench-execution-plan.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-10-V2知识库长期架构方案.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-11-报告生成分层与信息流说明.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-11-v21-knowledge-remaining-execution-plan.md
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

## 1. 背景

`v2.1` 已经把知识 runtime、兼容层和 `/api/v2` 主链路收到了“可交付收尾态”，但仍缺一个面向本地调试与质量观察的正式 workbench。

`2026-04-12` 这一轮工作的目标不是重写 `To C` 主链路，而是在现有 `v2.1` 能力上补齐下面三个能力：

1. `build -> summary -> eval -> diff` 的本地知识工作台入口
2. `report-debug` 中更可读的 insight / evidence / fallback 摘要
3. 固定 fixture、截图预览与前端 debug 面板的可复查入口

## 2. 本轮目标

- 为 `current` 与 `candidate:<build_id>` 提供本地 build summary、fixture preview、eval diff 能力
- 为 `report-debug` 增加 insight context、evidence summary、fallback summary 三类摘要
- 把 `fixture manifest + eval summary + preview asset` 收成可重复验证入口
- 保持现有 `Lite / Pro` 主链路与 `/api/v2` 合同不被破坏

## 3. 本轮范围

### 3.1 要做

- 后端新增 `KnowledgeWorkbench` 及其脚本入口
- `/api/v2/debug/knowledge/*` 调试接口
- `report-debug` payload 扩展
- 前端 `browser-debug-panel` 的 workbench / insight 区块
- `fixtures/` 与 `toC/data/knowledge/builds/` 的样本与评估产物接入
- 对应后端与前端测试

### 3.2 不做

- 不改写 `2026-04-04-toc-mvp-spec.md` 的主产品范围
- 不引入新的正式生产 API 面板或后台运营系统
- 不重写 `v2.1` pack schema
- 不把 workbench 直接视为对外功能

## 4. 影响范围

- 后端：
  - `toC/app/backend/app/core/knowledge_runtime/`
  - `toC/app/backend/app/api/routes_v2.py`
  - `toC/app/backend/app/core/pipeline/`
- 前端：
  - `toC/app/frontend/mobile-web/browser-debug-panel.tsx`
  - `toC/app/frontend/shared/types/api.ts`
- 数据与样本：
  - `fixtures/toc-mvp/`
  - `toC/data/knowledge/builds/`

## 5. 验收标准

### 5.1 目标行为

- 本地可读取 `current` build summary
- 本地可对 `candidate:<build_id>` 运行 eval 并生成 diff
- `report-debug` 可返回 insight / evidence / fallback 摘要
- 前端 debug 面板可展示 workbench summary 与 insight context

### 5.2 边界情况

- `AIMANDALA_ENABLE_DEBUG_WORKBENCH` 未开启时，debug workbench 接口应返回禁用态
- fixture manifest 中 5 个固定样本应全部可通过校验
- 允许 fallback 命中，但不允许结构字段缺失或回归标记失控

### 5.3 通过条件

- 后端 workbench 测试通过
- `/api/v2` 合同回归继续通过
- 前端 debug 面板行为测试通过
- `validate_knowledge_workbench.py` 返回 `ok: true`
- `run_knowledge_evals.py --build-selector current` 能生成 5 个 fixture 的汇总结果

## 6. 验证方式

- 后端自动化：
  - `pytest -q projects/aimandala/toC/app/backend/tests/unit/test_knowledge_workbench_v22.py projects/aimandala/toC/app/backend/tests/unit/test_api_v2_report_contracts.py projects/aimandala/toC/app/backend/tests/unit/test_pipeline_orchestrator.py`
- 前端自动化：
  - `npm --prefix projects/aimandala/toC/app/frontend test -- --run browser-debug-panel.test.tsx controller.test.ts app.test.tsx`
- 脚本验证：
  - `python3 projects/aimandala/toC/app/backend/scripts/validate_knowledge_workbench.py`
  - `python3 projects/aimandala/toC/app/backend/scripts/run_knowledge_evals.py --build-selector current`

## 7. 风险与并行约束

- `workbench` 是本地调试能力，不应被误读为新的正式用户功能
- `current` build eval 允许存在 fallback，但要在 QA 中明确记录
- 这一轮已经发生在代码提交之后，因此本文档属于对 `v2.2` 的正式回写和补链，不应伪装成“实现前已存在”

## 8. 完成记录

- [x] `KnowledgeWorkbench`、相关脚本与 debug API 已落地
- [x] `browser-debug-panel` 已补 workbench / insight context 可视区块
- [x] 后端、前端与脚本验证已执行
- [x] 本轮继续补齐 `qa` 与 `delivery` 正式 artifact
