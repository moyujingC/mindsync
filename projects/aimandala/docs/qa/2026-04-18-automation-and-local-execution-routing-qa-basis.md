# Aimandala Automation 与本地执行分流 Phase 1 QA Basis

> 状态：superseded
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-19
> source_of_truth：projects/aimandala/docs/qa/2026-04-18-automation-and-local-execution-routing-qa-basis.md
> 项目：aimandala
> 阶段：qa-basis
> depends_on：projects/aimandala/docs/specs/2026-04-18-automation-and-local-execution-routing-spec.md
> depends_on：projects/aimandala/docs/tasks/2026-04-18-automation-and-local-execution-routing-phase1-plan.md
> reviewers：Engineer, Test / QA

> 2026-04-19 状态说明：
> 本文档已被 [2026-04-19-paperclip-native-execution-routing-qa-basis.md](./2026-04-19-paperclip-native-execution-routing-qa-basis.md) 取代。
> 其中“普通任务错路由到服务器可写路径时被拒绝并转本地人工接手”的验证目标不再是当前主质量门。

## 1. 本轮验证对象

本轮只验证 phase 1：

1. heartbeat strict gate 是否只拦活跃 Automation 风险
2. audit 是否继续保留历史 `done` 漂移样本
3. 普通任务错路由到服务器可写路径时，是否被拒绝并转本地人工接手
4. 新建任务描述是否始终带显式 `task_class / execution_route`

## 2. 测试矩阵

### 2.1 本地静态与 smoke

必须执行：

1. `node --check shared/tools/ci/check-paperclip-execution-health.mjs`
2. `node --check shared/tools/ci/audit-paperclip-workspace-materialization.mjs`
3. `node --check shared/tools/ci/paperclip-sync-lib.mjs`
4. `node --check shared/tools/ci/execution-health.smoke.mjs`
5. `node shared/tools/ci/execution-health.smoke.mjs`
6. `node shared/tools/ci/paperclip-sync-lib.smoke.mjs`
7. `git diff --check`

### 2.2 行为场景

必须覆盖：

1. 活跃 `server_automation` 且无 workspace
   - strict gate 非零
   - 原因码为 `execution_workspace_policy_not_materialized`
2. `done` 的 `server_automation` 且无 workspace
   - audit 继续暴露
   - strict gate 不因该 issue 单独失败
3. 活跃 `local_manual_review` 错绑 `/opt/automation/worktrees`
   - strict gate 非零
   - 原因码为 `server_writable_execution_not_allowed`
   - `--apply` 生成标准本地接手 comment
4. Automation 子任务描述
   - 必带 `task_class: automation-execution`
   - 必带 `execution_route: server_automation`
5. CI 汇总父任务描述
   - 必带 `task_class: manual-review-required`
   - 必带 `execution_route: local_manual_review`

## 3. 远端验证

### 3.1 Heartbeat

执行：

```bash
systemctl start paperclip-heartbeat.service
systemctl status paperclip-heartbeat.service --no-pager -n 80
```

通过条件：

1. 不再因历史 `done` 样本单独失败
2. 若仍失败，只剩活跃 Automation issue 或真实错路由命中

### 3.2 Audit

执行：

```bash
cd /opt/automation/app/mindsync-heartbeat
set -a
source /etc/default/paperclip-heartbeat
set +a
node shared/tools/ci/check-paperclip-execution-health.mjs \
  --company-id "$PAPERCLIP_COMPANY_ID" \
  --project-name "一镜一梳" \
  --api-base "$PAPERCLIP_API_BASE" \
  --api-key "$PAPERCLIP_API_KEY" \
  --stale-minutes "${PAPERCLIP_EXECUTION_STALE_MINUTES:-15}" \
  --expected-root "${PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT:-/opt/automation/worktrees}" \
  --strict
node shared/tools/ci/audit-paperclip-workspace-materialization.mjs \
  --company-id "$PAPERCLIP_COMPANY_ID" \
  --project-name "一镜一梳" \
  --api-base "$PAPERCLIP_API_BASE" \
  --api-key "$PAPERCLIP_API_KEY" \
  --expected-root /opt/automation/worktrees \
  --repo-root /opt/automation/app/mindsync
```

通过条件：

1. health 输出包含 active/historical 分层计数
2. audit 输出同时包含：
   - `activeIssuesMissingWorkspace`
   - `historicalDoneIssuesMissingWorkspace`
   - `serverWritableExecutionRejectedIssues`

## 4. 阻断条件

出现任一情况，本轮不得宣称完成：

1. strict gate 仍把历史 `done` 样本当作阻断项
2. 普通任务错路由时没有标准本地接手 comment
3. 新建 Automation 子任务未显式写入路由元数据
4. 远端验证只做手工观察，没有命令与输出证据

## 5. 当前基线

`2026-04-18` 远端稳态基线：

1. `34 active issue(s) missing execution workspace binding`
2. `8 historical done issue(s) missing execution workspace binding`
3. `0 issue(s) rejected for server writable execution`

这组数据用于判断：

1. active/historical 分层已经生效
2. heartbeat 失败来源已收敛为活跃风险
3. cleanup 后没有残留错误绑定的普通任务继续卡在服务器可写路径

`2026-04-18` phase 1 closeout 临时样本基线：

1. 真实错路由样本为 `MIN-119`
2. 临时 worktree 路径为 `/opt/automation/worktrees/phase1-local-handoff-sample`
3. health `--apply --strict` 命中：
   - `1 issue(s) rejected for server writable execution`
4. audit 临时命中：
   - `rejected=1`
   - `host_unbound=1`
5. `MIN-119` 被 patch 为 `blocked` 并生成标准本地接手 comment
6. cleanup 后 audit 恢复为：
   - `rejected=0`
   - `host_unbound=0`

补充说明：

1. phase 1 已经有真实 `/opt/automation/worktrees/...` 错路由样本，不再停留在“只能靠本地 smoke”
2. 远端 closeout 额外依赖两个运行态前置条件：
   - `enableIsolatedWorkspaces=true`
   - heartbeat checkout 中的 `check-paperclip-execution-health.mjs` 必须同步到当前仓库版本
