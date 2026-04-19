# Aimandala Server Automation Workspace Materialization 诊断 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-19
> source_of_truth：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/qa/2026-04-19-server-automation-workspace-materialization-diagnosis-qa-basis.md
> 项目：aimandala
> 阶段：qa-basis
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/specs/2026-04-19-server-automation-workspace-materialization-diagnosis-spec.md
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/tasks/2026-04-19-server-automation-workspace-materialization-diagnosis-plan.md
> reviewers：Engineer, Test / QA

## 1. 本轮验证对象

本轮验证对象固定为：

1. diagnosis CLI 是否只读
2. 当前 `34` 条活跃 `serverAutomationBlocking` 是否全部被分类
3. 每条 blocking issue 是否只进入一个诊断桶
4. 当前远端基线 `34 / 8 / 2` 是否已进入正式 QA / verification / runbook
5. `local_manual_review` 是否继续只审计，不重新进入服务器阻断主链

## 2. 测试矩阵

### 2.1 文档一致性

必须验证：

1. 新 Spec / Task / QA 都把当前主问题定义为 server automation workspace materialization
2. 三份文档都明确本阶段只诊断，不修复
3. 三份文档都固定远端基线为：
   - `serverAutomationBlocking = 34`
   - `historicalDoneWorkspaceDrift = 8`
   - `localExecutionRouting = 2`

### 2.2 CLI 只读边界

必须验证：

1. diagnosis CLI 不包含 issue patch
2. diagnosis CLI 不创建或删除 worktree
3. diagnosis CLI 不写 comment
4. diagnosis CLI 不修改 execution workspace 实体

### 2.3 诊断桶覆盖

必须验证：

1. 6 个 diagnosis bucket 都在脚本合同中显式存在
2. smoke 至少构造 6 个最小 fixture，分别命中对应 bucket
3. `serverAutomationBlockingIssues.length` 等于所有 bucket 样本总和
4. 任一样本不会同时进入两个 bucket

### 2.4 路由边界

必须验证：

1. `local_manual_review` 样本不会进入 server automation diagnosis bucket
2. `check-paperclip-execution-health.mjs --strict` 继续只由活跃 `server_automation` 驱动
3. `localExecutionRoutingIssues` 继续只出现在审计层

### 2.5 远端全量验证

必须验证：

1. automation 节点运行 diagnosis CLI 后：
   - `serverAutomationBlockingIssues.length === 34`
   - `historicalDoneWorkspaceDriftIssues.length === 8`
   - `localExecutionRoutingIssues.length === 2`
2. 所有 34 条 blocking issue 都被分桶
3. `preconditionSnapshot` 能展示：
   - instance isolated workspace 开关
   - project execution workspace policy
   - expected root
   - repo root

### 2.6 桶级抽样验证

必须验证：

1. 每个非空 bucket 至少抽 2 条 issue
2. 若 bucket 少于 2 条，则全部抽样
3. 每条样本都要核对：
   - issue metadata
   - issue status / assignee / checkoutRunId / startedAt / completedAt
   - issue comments 执行痕迹
   - execution workspace API
   - host worktree
   - heartbeat / runner / relevant service 日志时间窗

## 3. 阻断条件

出现任一情况，本轮不得宣称完成：

1. 仍有 blocking issue 未被分桶
2. 任一 issue 同时进入两个 bucket
3. `local_manual_review` 被重新拉回服务器 strict gate
4. diagnosis CLI 被做成带写操作的 repair 脚本
5. README / verification 仍保留旧的 `71 missing` 或 `33 active` 旧值

## 4. 验收条件

本轮通过条件：

1. 新文档链已落地并互相一致
2. diagnosis smoke 已通过
3. diagnosis CLI 已通过本地静态校验
4. verification 已明确记录当前远端基线与 diagnosis phase（诊断阶段）边界
5. 下一轮修复计划已被约束为必须基于 diagnosis 证据链
