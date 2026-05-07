# Aimandala Automation 与本地执行分流 Phase 1 实施计划

> 状态：superseded
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：projects/aimandala/docs/tasks/2026-04-18-automation-and-local-execution-routing-phase1-plan.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：projects/aimandala/docs/specs/2026-04-18-automation-and-local-execution-routing-spec.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

> 2026-04-19 状态说明：
> 本文档已被 [2026-04-19-paperclip-native-execution-routing-plan.md](./2026-04-19-paperclip-native-execution-routing-plan.md) 取代。
> 其中“普通任务在服务器错路由时形成拒绝执行 + 本地人工接手闭环”的主路径不再是当前实施目标。

## 1. 本轮目标

在不修改 `PaperclipAI` 源码的前提下，完成 phase 1：

1. heartbeat strict gate 恢复为“只拦当前活跃 Automation 风险”
2. 普通任务在服务器错路由时，形成“拒绝执行 + 本地人工接手”的正式闭环
3. 把这轮能力补齐到 `spec / task / qa / delivery` artifact 链

## 2. 实施顺序

严格按下面顺序执行：

1. 补齐 `Spec`
2. 补齐本计划与 `QA Basis`
3. 扩展 smoke
4. 再改脚本实现
5. 更新 runbook、QA 记录
6. 先跑本地自动测试
7. 再跑 automation 节点远端验证
8. 最后补 `Delivery`

## 3. 任务拆解

### 3.1 Smoke 与测试先行

先扩展 `shared/tools/ci/execution-health.smoke.mjs`，至少覆盖：

1. active/historical split
2. `local_manual_review` 错绑服务器可写路径
3. 本地人工接手 comment 模板字段

同时回归 `shared/tools/ci/paperclip-sync-lib.smoke.mjs`，确认：

1. Automation 子任务显式写入 `task_class: automation-execution`
2. 子任务显式写入 `execution_route: server_automation`
3. CI 汇总父任务显式写入 `manual-review-required + local_manual_review`

### 3.2 健康检查脚本

收口 `shared/tools/ci/check-paperclip-execution-health.mjs`：

1. 保持 audit 状态集与 strict 状态集分离
2. `execution_workspace_policy_not_materialized`
   - 只阻断活跃 `server_automation`
3. `server_writable_execution_not_allowed`
   - 继续阻断活跃 `local_manual_review`
4. 当 `--apply` 命中错路由 issue 时：
   - patch 为 `blocked`
   - 写入标准本地接手 comment

### 3.3 审计脚本

收口 `shared/tools/ci/audit-paperclip-workspace-materialization.mjs`：

1. 输出 `activeIssuesMissingWorkspace`
2. 输出 `historicalDoneIssuesMissingWorkspace`
3. 输出 `serverWritableExecutionRejectedIssues`
4. 保持对缺失显式元数据的历史样本只做 `source` 推断兼容

### 3.4 文档与 runbook

更新 `projects/aimandala/deploy/paperclip-automation/README.md` 与 QA 文档：

1. heartbeat 只拦活跃 Automation 风险
2. 历史 `done` 漂移只审计、不阻断
3. 普通任务若落进服务器可写路径，必须被拒绝并转本地人工处理
4. heartbeat 绿色不等于历史债已清空

## 4. 完成标准

本轮只有同时满足下面条件才算完成：

1. 本地 smoke 与 `node --check` 全通过
2. `git diff --check` 通过
3. automation 节点上 heartbeat 与 audit 真实输出符合新分层
4. 如构造或复用到错路由普通任务，`--apply` 能把其标准交接到本地人工处理
5. `Delivery` 已明确记录：
   - 已完成内容
   - 未完成内容
   - 当前残留风险
