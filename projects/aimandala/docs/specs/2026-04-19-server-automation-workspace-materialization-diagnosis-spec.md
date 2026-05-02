# Aimandala Server Automation Workspace Materialization 诊断 Spec

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：projects/aimandala/docs/specs/2026-04-19-server-automation-workspace-materialization-diagnosis-spec.md
> 项目：aimandala
> 阶段：spec
> depends_on：projects/aimandala/docs/specs/2026-04-19-paperclip-native-execution-routing-spec.md
> depends_on：projects/aimandala/deploy/paperclip-automation/README.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 问题定义

`aimandala` 已经完成 execution routing（执行分流）服务器侧去拒绝化：

1. `local_manual_review` 不再进入服务器 strict gate（严格门禁）阻断主链
2. `check-paperclip-execution-health.mjs --strict` 当前只由活跃 `server_automation` 风险返回非零
3. automation 节点上的 heartbeat 继续失败，当前真实阻断已收敛为：
   - `serverAutomationBlocking = 34`
   - `historicalDoneWorkspaceDrift = 8`
   - `localExecutionRouting = 2`

现阶段最重要的问题已经不是：

1. `local_manual_review` 是否被服务器误拦
2. strict gate 是否还混入 `done`
3. systemd 是否仍指向旧路径

而是：

1. 为什么仍有 34 条活跃 `server_automation` issue 没有真正 materialize（落成）到 execution workspace（执行工作区）
2. 这些样本到底是同一根因，还是多类运行链失配混在一起
3. 下一轮修复应该优先修创建链、checkout 链、持久化链，还是先处理控制面残留样本

本阶段的目标是先把这 34 条样本收敛成可证明的根因分桶，不先做批量修复。

## 2. 目标

本阶段只回答一个问题：

1. 当前 34 条 `serverAutomationBlockingIssues` 为什么没有真正 materialize 到 execution workspace

为回答这个问题，本阶段固定完成四件事：

1. 新增一条只读 diagnosis（诊断）CLI
2. 把每条 blocking issue 收进且只收进一个诊断桶
3. 固定远端抽样取证流程，避免实现者临场决定如何查
4. 把当前 `34 / 8 / 2` 基线和 strict gate 边界写回正式 QA / verification（验证记录）与 runbook

## 3. 非目标

本阶段不做：

1. 不修改 `PaperclipAI` 源码
2. 不改现有 strict gate 判定规则
3. 不批量补 `executionWorkspaceId`
4. 不批量改 issue 状态
5. 不批量清理历史 `done`
6. 不把 diagnosis 脚本变成 repair（修复）脚本
7. 不把 `local_manual_review` 拉回服务器 reject（拒绝）主链

## 4. 核心规则

### 4.1 诊断对象边界

本阶段 diagnosis 脚本只面向 `server_automation` 的 blocking issue。

固定边界：

1. `serverAutomationBlockingIssues`
   - 作为本阶段唯一需要逐条分类的主对象
2. `historicalDoneWorkspaceDrift`
   - 继续作为基线背景保留，不进入本阶段根因分桶
3. `localExecutionRoutingIssues`
   - 继续只审计，不作为服务器 heartbeat 主阻断对象

### 4.2 诊断输出合同

新的 diagnosis CLI 必须输出两层结果：

1. `preconditionSnapshot`
   - 实例级 `enableIsolatedWorkspaces`
   - 项目级 `executionWorkspacePolicy`
   - `expectedRoot`
   - `repoRoot`
   - host worktree（宿主机 worktree）观测摘要
2. `serverAutomationBlockingIssues`
   - 当前 34 条活跃 blocking issue 的原始诊断样本

同时必须输出：

1. `diagnosisBuckets`
2. `bySource`
3. `byStatus`
4. `byAssigneeAgent`

其中 `diagnosisBuckets` 固定包含下面 6 个桶：

1. `policy_precondition_issues`
   - 例如实例级 isolated workspaces（隔离工作区）开关、项目 execution workspace policy、expected root 前置条件异常
2. `issue_binding_missing_after_execution_trace`
   - issue 已有 `checkoutRunId / startedAt / updatedAt / assignee` 等执行痕迹，但没有 workspace 绑定
3. `workspace_entity_persistence_issues`
   - issue 或评论证据显示本应已有 workspace 实体，但控制面绑定未持久化
4. `workspace_host_materialization_issues`
   - 诊断证据指向服务器 worktree，应已落到 `/opt/automation/worktrees`，但宿主机实体缺失或不一致
5. `routing_metadata_or_source_anomalies`
   - metadata（元数据）、source、task class、execution route 组合异常，导致 issue 被算进 blocking 但语义不完整
6. `stale_control_plane_activity_issues`
   - issue 仍在活跃状态，但证据更像控制面状态残留或看板未收束，而不是当前真实 checkout 链在运行

### 4.3 单桶归属规则

每条 `serverAutomationBlockingIssue` 必须满足：

1. 进入且只进入一个诊断桶
2. 输出中必须携带：
   - `bucket`
   - `classificationReason`
   - `evidence`
3. 若 issue 同时具备多个异常信号，分类优先级固定为：
   - `policy_precondition_issues`
   - `routing_metadata_or_source_anomalies`
   - `stale_control_plane_activity_issues`
   - `workspace_host_materialization_issues`
   - `workspace_entity_persistence_issues`
   - `issue_binding_missing_after_execution_trace`

这条优先级的含义是：

1. 先收最上游前置条件异常
2. 再收语义异常和控制面残留异常
3. 再收 host / entity 两类更具体的 materialization（工作区落成）失配
4. 其余默认归入“已有执行痕迹但缺少绑定”

### 4.4 远端取证流程

本阶段远端验证必须固定按三层执行：

1. 全量 diagnosis
   - 在 automation 节点运行新的 diagnosis CLI
   - 确认所有 blocking issue 都已被分桶
2. 桶级抽样
   - 每个非空桶至少抽 2 条
   - 少于 2 条则全部抽样
3. 证据落档
   - 对每个样本固定检查：
     - issue metadata
     - issue status / assignee / checkoutRunId / startedAt / completedAt
     - issue comments 中的执行痕迹
     - execution workspace API 实体
     - 宿主机 `/opt/automation/worktrees` 真实目录
     - heartbeat / runner / relevant service 日志对应时间窗

## 5. 运行边界

本阶段新的 diagnosis CLI 必须保持只读：

1. 不 patch issue
2. 不创建 worktree
3. 不删除 worktree
4. 不修改 execution workspace 实体
5. 不写 comment
6. 不改变 health / audit 的 strict 规则

## 6. 验收标准

本阶段通过至少满足：

1. `serverAutomationBlockingIssues.length` 与 diagnosis 各桶样本数总和一致
2. 任一 blocking issue 不会同时进入两个桶
3. `local_manual_review` 不进入 server automation diagnosis 主桶
4. 文档链与 runbook 都固定当前远端基线为 `34 / 8 / 2`
5. 文档链明确说明：
   - 当前 heartbeat 继续为红是因为活跃 `server_automation`
   - 不是 `local_manual_review` 误拦
6. 下一轮修复计划必须建立在本阶段分桶证据链之上
