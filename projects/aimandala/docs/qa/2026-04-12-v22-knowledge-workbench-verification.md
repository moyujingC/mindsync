# 一镜一梳 v2.2 knowledge workbench 验证记录

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-12
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-12-v22-knowledge-workbench-verification.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-12-v22-knowledge-workbench-execution-plan.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-10-V2知识库长期架构方案.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-11-报告生成分层与信息流说明.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 验证对象

本次验证对象为 `2026-04-12` 提交的 `v2.2 knowledge workbench` 能力补充，重点确认：

1. 本地知识 workbench 是否可用
2. `report-debug` 摘要扩展是否打通
3. 前端 debug 面板是否能承接新增摘要和 build summary
4. 本轮是否破坏现有 `/api/v2` 与 `orchestrator` 基线

## 2. 验收口径

### 2.1 目标行为

- debug workbench 可在开启开关时返回 build summary 与 fixture preview
- 未开启开关时，debug workbench 接口受控拒绝
- `report-debug` 可返回 insight / evidence / fallback 摘要
- 前端 `browser-debug-panel` 能展示新增摘要块与 build summary 信息

### 2.2 边界情况

- 固定 fixture 5 个全部可通过 manifest 校验
- `current` build eval 不允许出现结构字段缺失或 regression flag
- 允许命中 fallback，但需能在 summary 中被观察到

### 2.3 不在本轮验证范围

- 正式线上环境访问
- 新的对外产品链路
- `v2.1` pack schema 重构

## 3. 执行记录

### 3.1 后端自动化

执行：

```bash
pytest -q projects/aimandala/toC/app/backend/tests/unit/test_knowledge_workbench_v22.py \
  projects/aimandala/toC/app/backend/tests/unit/test_api_v2_report_contracts.py \
  projects/aimandala/toC/app/backend/tests/unit/test_pipeline_orchestrator.py
```

结果：

- `39 passed in 7.15s`

### 3.2 前端自动化

执行：

```bash
npm --prefix projects/aimandala/toC/app/frontend test -- --run browser-debug-panel.test.tsx controller.test.ts app.test.tsx
```

结果：

- `3` 个 test files 通过
- `11` 个 tests 通过

### 3.3 脚本验证

执行：

```bash
python3 projects/aimandala/toC/app/backend/scripts/validate_knowledge_workbench.py
python3 projects/aimandala/toC/app/backend/scripts/run_knowledge_evals.py --build-selector current
```

结果：

- `validate_knowledge_workbench.py` 返回 `ok: true`
- manifest 中 `5` 个 fixture 全部 `ok`
- `current` build eval 汇总：
  - `fixture_count = 5`
  - `fixture_fallback_count = 2`
  - `warning_hit_count = 1`
  - `structured_missing_count = 0`
  - `regression_flag_count = 0`

## 4. 验证结论

### 4.1 通过项

- `KnowledgeWorkbench` 的 candidate build / eval / diff 基本链路已被单测锁定
- debug workbench 开关的禁用态与启用态都已被后端测试覆盖
- `report-debug` 摘要字段已能被前端面板读取和展示
- 固定样本与 build eval 已形成可重复脚本入口
- 本轮未观察到结构字段缺失或 regression flag

### 4.2 观察项

- `current` build eval 仍存在 `2` 个 fallback 命中
  - `toc-mvp-sample-b-lite-to-pro-career`
  - `toc-mvp-sample-d-intimate-fallback`
- `warning_hit_count = 1`
  - 来自 `toc-mvp-sample-e-warning-general`

这些结果当前属于“可观察、可接受”，不构成本轮 veto，但后续应持续跟踪是否继续上升。

### 4.3 未覆盖项

- 本轮未做真实浏览器人工走查
- 本轮未验证远端部署环境中的 debug workbench 开关行为

## 5. 风险判断

- 当前结论：`有条件通过`
- 允许进入下一阶段：`是`
- 条件：
  - `workbench` 继续保持开发调试能力边界，不提升为对外正式功能
  - 后续如 fallback hotspot 或 warning path 增长，需要补独立 quality review

## 6. 下一步建议

1. 为 `candidate build` 增加固定 review 节点，而不是只保留本地手工载入
2. 把 `fallback hotspot` 与 `warning path` 趋势写入后续 quality review
3. 如果要把这套能力用于团队长期操作，再补一份面向工程师的 runbook
