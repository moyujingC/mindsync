# Aimandala Server Automation Blocking Sample Interpretation Spec

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-21
> source_of_truth：projects/aimandala/docs/specs/2026-04-19-server-automation-blocking-sample-interpretation-spec.md
> 项目：aimandala
> 阶段：spec
> depends_on：projects/aimandala/docs/specs/2026-04-19-paperclip-native-execution-routing-spec.md
> depends_on：projects/aimandala/docs/specs/2026-04-19-server-automation-workspace-materialization-diagnosis-spec.md
> depends_on：projects/aimandala/docs/specs/2026-04-19-服务器自动执行任务模板语义修复规格.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 问题定义

`aimandala` 当前关于 automation 执行分流，已经收敛出两条已成立事实：

1. 模板语义层
   - `paperclip-sync-lib` 产出的 `automation-summary` 与真正 `server_automation` failure task 已基本闭合
   - `MIN-137` 与 `MIN-133` 已证明：
     - `automation-summary`
     - `commit-summary`
     - `Runner-Heartbeat` 这类摘要任务
     不是服务器自动执行任务
2. diagnosis（诊断）层
   - 远端 heartbeat 当前真实基线已滚动为：
     - `serverAutomationBlocking = 35`
     - `historicalDoneWorkspaceDrift = 8`
     - `localExecutionRouting = 3`
   - `35` 条 active blocking 中：
     - `33` 条落在 `routing_metadata_or_source_anomalies`
     - `2` 条落在 `issue_binding_missing_after_execution_trace`

因此，下一阶段主问题不再是“模板是否仍在持续产错”，而是：

1. 当前远端存量样本该如何正式解释
2. 哪些是历史活跃样本或旧语义残留
3. 哪些才是真实当前运行链缺口
4. 哪些只是本地任务被后续错误绑进了服务器 worktree（工作树）

## 2. 目标

本规格只做一件事：

1. 在 diagnosis bucket（诊断桶）之上，新增一层正式的 sample interpretation（样本解释）模型

本规格固定达成：

1. 把远端当前 `35 / 8 / 3` 写成唯一当前基线
2. 把现有样本解释为 4 类正式对象
3. 为每条样本补充解释字段，而不是重写 diagnosis CLI
4. 为下一轮整改计划提供唯一前置入口

## 3. 非目标

本规格不做：

1. 不修改 `PaperclipAI` 源码
2. 不修改 `check-paperclip-execution-health.mjs`
3. 不修改 `audit-paperclip-workspace-materialization.mjs`
4. 不修改 `diagnose-paperclip-server-automation-materialization.mjs`
5. 不批量补 `executionWorkspaceId`
6. 不批量 patch 远端 issue
7. 不承诺 heartbeat 本轮恢复为绿色
8. 不把 `local_manual_review` 拉回服务器 reject（拒绝）主链

## 4. 核心解释模型

### 4.1 四类正式解释对象

从本规格生效起，当前远端样本必须按下面 4 类对象解释：

1. `active_legacy_routing_samples`
   - 对应当前 `33` 条 anomaly
   - 默认解释为：
     - 历史活跃样本
     - 旧模板残留
     - 旧控制面语义残留
   - 不默认解释为“当前模板仍在持续产错”
2. `active_runtime_binding_gap_samples`
   - 对应当前 `2` 条 `issue_binding_missing_after_execution_trace`
   - 解释为：
     - 已有真实执行痕迹
     - 但 execution workspace 绑定没有真正落成
   - 这是当前最像真实运行链缺口的对象
3. `historical_done_drift_samples`
   - 对应当前 `8` 条 `historicalDoneWorkspaceDrift`
   - 继续保留为历史审计证据
   - 不并入 active blocking 解释表
4. `local_execution_misbinding_samples`
   - 对应当前 `3` 条 `localExecutionRouting`
   - 解释为：
     - 本应本地执行
     - 但后续被错误绑进服务器 worktree
   - 继续只审计，不重新拉回 heartbeat strict gate

### 4.2 样本解释字段

在 diagnosis 输出之上，每条样本必须补充下面字段：

1. `interpretationClass`
2. `whyNotAnotherClass`
3. `evidenceSnapshot`
4. `currentTemplateConsistency`
5. `nextRepairTrack`

字段含义固定为：

1. `interpretationClass`
   - 当前样本属于哪一类正式解释对象
2. `whyNotAnotherClass`
   - 为什么不是另外 3 类对象
3. `evidenceSnapshot`
   - 当前用于支持解释结论的最小证据摘要
4. `currentTemplateConsistency`
   - 当前样本是否与已确认的模板语义合同一致
5. `nextRepairTrack`
   - 下一轮整改应进入哪一条修复轨道

### 4.3 `nextRepairTrack` 固定值

`nextRepairTrack` 只允许下面 4 个固定值：

1. `legacy-sample-cleanup`
2. `runtime-binding-fix`
3. `historical-audit-only`
4. `local-routing-cleanup`

其中：

1. `legacy-sample-cleanup`
   - 用于历史活跃样本或旧语义残留
2. `runtime-binding-fix`
   - 用于真实当前执行链绑定缺口
3. `historical-audit-only`
   - 用于历史 `done` 漂移
4. `local-routing-cleanup`
   - 用于本地任务后续错误绑入服务器 worktree

### 4.4 默认解释规则

当前样本解释必须遵守下面默认规则：

1. `35` 条 active blocking 不等于 `35` 条都该立刻补 workspace
2. `33` 条 anomaly 默认先解释为历史活跃样本或旧语义残留
3. 只有拿到反证时，才允许把 anomaly 升级为“当前模板仍在持续产错”
4. `2` 条 binding gap 才是当前最像真实运行链缺口的对象
5. `3` 条 local routing 样本继续只审计，不作为服务器 heartbeat 主阻断项

## 5. 当前样本证据

本规格固定继承下面远端事实：

1. 当前远端基线：
   - `35 / 8 / 3`
2. diagnosis 分桶：
   - `routing_metadata_or_source_anomalies = 33`
   - `issue_binding_missing_after_execution_trace = 2`
3. anomaly 按 `source` 高度集中为 4 类：
   - `build-failure = 13`
   - `infra-runner-failure = 9`
   - `deploy-or-smoke-failure = 7`
   - `ci-test-failure = 4`
4. 固定样本解释：
   - `MIN-137`
     - `automation-summary`
     - `Runner-Heartbeat`
     - 属于摘要任务误入服务器执行链
   - `MIN-133`
     - `automation-summary`
     - `CI commit-summary` 父任务
     - 不是真正 `server_automation` 子任务
   - `MIN-119`
     - 纯人工文档任务
     - 模板语义本身正确
     - 问题在后续错误绑定

## 6. 验收标准

本规格通过至少满足：

1. 明确当前主问题已从模板语义修复切换为远端样本解释
2. 明确 `35 / 8 / 3` 是唯一当前远端基线
3. 明确 4 类正式解释对象及其默认判断逻辑
4. 明确 `automation-summary` 当前定义是正确的
5. 让后续实现者无需再决定：
   - `33` 条 anomaly 默认应先按什么解释
   - `2` 条 binding gap 是否应优先视为真实运行链缺口
   - `localExecutionRouting` 是否还要重新拉回 strict gate
