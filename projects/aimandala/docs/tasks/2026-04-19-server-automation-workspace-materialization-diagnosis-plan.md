# Aimandala Server Automation Workspace Materialization 诊断实施计划

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：projects/aimandala/docs/tasks/2026-04-19-server-automation-workspace-materialization-diagnosis-plan.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：projects/aimandala/docs/specs/2026-04-19-server-automation-workspace-materialization-diagnosis-spec.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮目标

本轮不是恢复 heartbeat 绿色，而是把当前 `34` 条活跃 `serverAutomationBlocking` issue 先做成可证明的 diagnosis（诊断）证据链。

本轮固定完成：

1. 新增 diagnosis CLI
2. 新增 diagnosis smoke / fixture
3. 新增 Spec / Task / QA 文档链
4. 更新 verification 与 automation README，明确当前主问题是 server automation workspace materialization

## 2. 本轮边界

本轮明确要做：

1. 只读拉取实例设置、项目设置、issue、comments、execution workspace 与 host worktree 观测
2. 对 blocking issue 做单桶分类
3. 输出聚合视图：
   - `bySource`
   - `byStatus`
   - `byAssigneeAgent`
4. 把当前远端基线 `34 / 8 / 2` 写回文档入口

本轮明确不做：

1. 不改 `check-paperclip-execution-health.mjs` 的 strict 规则
2. 不改 `audit-paperclip-workspace-materialization.mjs` 的现有 summary 语义
3. 不 patch issue
4. 不补 execution workspace 绑定
5. 不清理旧 active issue
6. 不把 diagnosis CLI 接到 heartbeat 主链

## 3. 实施对象

### 3.1 文档链

新增：

1. `2026-04-19-server-automation-workspace-materialization-diagnosis-spec.md`
2. `2026-04-19-server-automation-workspace-materialization-diagnosis-plan.md`
3. `2026-04-19-server-automation-workspace-materialization-diagnosis-qa-basis.md`

同步更新：

1. `projects/aimandala/docs/tasks/README.md`
2. `projects/aimandala/docs/qa/README.md`
3. `projects/aimandala/docs/runbooks/README.md`
4. `projects/aimandala/deploy/paperclip-automation/README.md`
5. `projects/aimandala/docs/qa/2026-04-18-automation-routing-and-heartbeat-gate-verification.md`

### 3.2 Diagnosis CLI

新增：

1. `shared/tools/ci/diagnose-paperclip-server-automation-materialization.mjs`

CLI 固定职责：

1. 读取 control plane（控制面）与 host 只读信息
2. 复用当前 server automation blocking 识别口径
3. 为每条 blocking issue 产出：
   - `bucket`
   - `classificationReason`
   - `evidence`
4. 输出：
   - `preconditionSnapshot`
   - `serverAutomationBlockingIssues`
   - `historicalDoneWorkspaceDriftIssues`
   - `localExecutionRoutingIssues`
   - `diagnosisBuckets`
   - `bySource`
   - `byStatus`
   - `byAssigneeAgent`

### 3.3 TDD 与 smoke

新增：

1. `shared/tools/ci/server-automation-materialization-diagnosis.smoke.mjs`

实现顺序固定为：

1. 先写 smoke
2. 先跑出失败
3. 再实现 diagnosis CLI
4. 再回跑 smoke

smoke 固定覆盖：

1. `policy_precondition_issues`
2. `issue_binding_missing_after_execution_trace`
3. `workspace_entity_persistence_issues`
4. `workspace_host_materialization_issues`
5. `routing_metadata_or_source_anomalies`
6. `stale_control_plane_activity_issues`
7. 单桶归属
8. 聚合计数
9. `local_manual_review` 不得混入 server automation diagnosis

## 4. 远端验证顺序

本轮远端验证必须按下面顺序执行：

1. 在 automation 节点运行 diagnosis CLI 全量输出
2. 确认：
   - `serverAutomationBlockingIssues.length === 34`
   - `historicalDoneWorkspaceDriftIssues.length === 8`
   - `localExecutionRoutingIssues.length === 2`
3. 对每个非空桶至少抽 2 条 issue
4. 将样本证据补入 verification

本轮不允许跳过第 1 步直接做样本抽查，也不允许不分类就开始补绑。

## 5. 完成标准

只有同时满足下面条件，本轮才算完成：

1. 新 Spec / Task / QA 已落地
2. diagnosis CLI 已能输出单桶分类结果
3. smoke 已覆盖所有诊断桶
4. README 与 verification 已固定 `34 / 8 / 2` 远端基线
5. 文档没有隐含：
   - 批量修复
   - 状态清债
   - 恢复 server reject 主路径
