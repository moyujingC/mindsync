# Aimandala Automation 与本地执行分流 Spec

> 状态：superseded
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：projects/aimandala/docs/specs/2026-04-18-automation-and-local-execution-routing-spec.md
> 项目：aimandala
> 阶段：spec
> depends_on：company/Paperclip任务系统优化方案.md
> depends_on：projects/aimandala/deploy/paperclip-automation/README.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

> 2026-04-19 状态说明：
> 本文档已被 [2026-04-19-paperclip-native-execution-routing-spec.md](./2026-04-19-paperclip-native-execution-routing-spec.md) 取代。
> 其中“服务器拒绝普通任务，再 handoff 到本地”的主路径不再是当前正式口径。

## 1. 问题定义

当前 `aimandala` 的运行治理已经收口了一半：

1. `automation-execution / server_automation` 的语义已经写进模板、治理文档和部分脚本
2. heartbeat strict gate 已开始识别 `execution_workspace_policy_not_materialized` 与 `server_writable_execution_not_allowed`
3. 但“普通任务必须回到本地执行”仍主要停留在治理口径，没有形成对称的运行时闭环

这会产生两个风险：

1. heartbeat 可能继续被历史样本拖死，无法只针对当前真实 Automation 风险 fail-fast
2. 普通任务即使被标记为 `manual-review-required + local_manual_review`，也缺少服务器侧的正式拒绝与本地接手口径

本 Spec 的目标不是修改 `PaperclipAI` 内核，而是在 `mindsync` 内把这两类任务的边界写成正式系统规则。

## 2. 目标

本轮要固定下面四条系统边界：

1. `automation-execution + server_automation`
   - 只承接 CI/CD、deploy、smoke、runner、infra、maintenance、只读巡检及必须依赖 automation 节点本机环境的问题
   - 允许服务器在 `/opt/automation/worktrees` 中执行
   - 满足白名单和验证规则时允许自动提交到 `automation/aimandala/*`
2. `manual-review-required + local_manual_review`
   - 只承接产品功能开发、UI/文案、一般业务逻辑与需要人工判断是否入仓的任务
   - 服务器不得进入可写执行链
   - 服务器只允许拒绝、审计与交接，不允许自动闭环
3. heartbeat strict gate
   - 只拦当前活跃 Automation 风险
   - 历史 `done` 漂移继续审计，但不再单独阻断服务
4. 普通任务本地执行 phase 1
   - 先实现“服务器拒绝 + 本地人工接手”
   - 暂不把用户本机纳入正式 execution node

## 3. 非目标

本轮不做：

1. 不修改 `PaperclipAI` 源码
2. 不批量回填历史 `done` issue 的 `task_class / execution_route / executionWorkspaceId`
3. 不把用户的 Mac 设计成 phase 1 正式执行节点
4. 不因为 heartbeat 变绿就宣称历史治理债已经清空
5. 不放宽 maintenance 的 fail-fast 规则

## 4. 核心规则

### 4.1 任务分类与执行路径

正式允许的配对只有两种：

1. `task_class: automation-execution`
   - `execution_route: server_automation`
2. `task_class: manual-review-required`
   - `execution_route: local_manual_review`

禁止组合：

1. `automation-execution + local_manual_review`
2. `manual-review-required + server_automation`

CI 汇总父任务固定属于：

1. `manual-review-required`
2. `local_manual_review`

它只承担汇总与阻塞路由，不进入服务器端可写执行链。

### 4.2 服务器可写执行前提

服务器要进入可写执行与自动提交路径，必须同时满足：

1. 任务属于 `automation-execution`
2. `execution_route = server_automation`
3. `executionWorkspaceId` 或 `currentExecutionWorkspace.id` 非空
4. 实际工作区位于 `/opt/automation/worktrees`
5. 改动范围满足当前 automation 白名单

任一条件不满足时：

1. 不允许继续写文件
2. 不允许自动提交
3. heartbeat / maintenance 可直接 fail-fast

### 4.3 普通任务本地接手规则

对 `manual-review-required + local_manual_review` 任务，phase 1 固定采取下面口径：

1. 服务器不执行可写动作
2. 若检测到其 workspace 实际落在 `/opt/automation/worktrees`，视为错路由
3. `check-paperclip-execution-health.mjs --apply` 必须：
   - 把 issue 置为 `blocked`
   - 写入标准化 comment
4. 该 comment 必须明确写清：
   - 当前任务属于 `local_manual_review`
   - 服务器拒绝可写执行
   - 触发原因是服务器可写路径漂移
   - 下一步必须由人工在本地环境接手
   - heartbeat / maintenance 不会替它继续执行

### 4.4 Heartbeat 与 Audit 的职责边界

`check-paperclip-execution-health.mjs` 必须同时维护两层状态集：

1. audit 观测层：
   - `in_progress`
   - `in_review`
   - `blocked`
   - `done`
2. strict gate 阻断层：
   - `in_progress`
   - `in_review`
   - `blocked`

执行规则：

1. `execution_workspace_policy_not_materialized`
   - 只对活跃 `server_automation` issue 阻断
   - `done` 只进入审计
2. `server_writable_execution_not_allowed`
   - 对活跃 `local_manual_review` 任务继续阻断

`audit-paperclip-workspace-materialization.mjs` 必须显式输出：

1. `activeIssuesMissingWorkspace`
2. `historicalDoneIssuesMissingWorkspace`
3. `serverWritableExecutionRejectedIssues`

### 4.5 显式路由元数据

从当前版本开始，新建任务不得再依赖“只看状态猜语义”。

最低要求：

1. Automation 子任务必须显式带：
   - `task_class: automation-execution`
   - `execution_route: server_automation`
2. CI 汇总父任务必须显式带：
   - `task_class: manual-review-required`
   - `execution_route: local_manual_review`
3. 对缺少显式元数据的历史样本：
   - 可继续通过 `source` 推断
   - 但该推断只用于 audit 兼容

## 5. 验收标准

完成 phase 1 后，系统至少满足：

1. 活跃 `server_automation` 且无 workspace 绑定的 issue，strict gate 返回非零
2. `done` 的 `server_automation` 且无 workspace 绑定的 issue，仍进入审计，但不单独导致 strict gate 失败
3. 活跃 `local_manual_review` 错绑 `/opt/automation/worktrees` 时，strict gate 返回非零
4. `--apply` 可把该错路由 issue 标准化交接到本地人工处理
5. heartbeat 恢复为绿色时，官方口径仍明确“历史 done 审计样本可能仍存在”

## 6. 下一阶段 handoff

本 Spec 只定义 phase 1。

下一阶段若要继续推进，需要另立 spec 讨论：

1. 是否把用户本机纳入正式 execution node
2. 本地 claim / run / 回写是否要标准化为新的运行时能力
3. 是否要在控制面新增“本地人工接手”专用状态或原因码
