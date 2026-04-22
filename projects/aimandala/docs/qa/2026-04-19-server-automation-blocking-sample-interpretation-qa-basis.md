# Aimandala Server Automation Blocking Sample Interpretation QA Basis

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-21
> source_of_truth：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/qa/2026-04-19-server-automation-blocking-sample-interpretation-qa-basis.md
> 项目：aimandala
> 阶段：qa-basis
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/specs/2026-04-19-server-automation-blocking-sample-interpretation-spec.md
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/tasks/2026-04-19-server-automation-blocking-sample-interpretation-plan.md
> reviewers：Engineer, Test / QA

## 1. 本轮验证对象

本轮只验证样本解释模型是否完整，不验证 heartbeat 是否恢复为绿色。

本轮固定验证：

1. 当前远端基线是否统一为 `35 / 8 / 3`
2. 4 类 `interpretationClass` 是否定义完整
3. `35` 条 active blocking 是否全部被解释
4. `8` 条 historical done 与 `3` 条 local routing 是否保持独立对象集
5. `MIN-137 / MIN-133 / MIN-119` 的解释是否与现有远端证据一致

## 2. 测试矩阵

### 2.1 文档一致性

必须验证：

1. 新 Spec / Task / QA Basis 都使用 `35 / 8 / 3` 作为唯一当前基线
2. 三份文档都明确当前主问题是“样本解释”，不是“模板修复”或“直接整改”
3. 三份文档都明确：
   - 不改脚本
   - 不改远端对象
   - 不改 heartbeat strict 规则

### 2.2 解释对象完整性

必须验证 4 类解释对象都在文档中显式存在：

1. `active_legacy_routing_samples`
2. `active_runtime_binding_gap_samples`
3. `historical_done_drift_samples`
4. `local_execution_misbinding_samples`

### 2.3 解释矩阵完整性

必须验证：

1. `35` 条 active blocking 全部进入且只进入一个 `interpretationClass`
2. `8` 条 historical done 与 `3` 条 local routing 不混入 active blocking 解释表
3. 每条样本都具备：
   - `interpretationClass`
   - `whyNotAnotherClass`
   - `evidenceSnapshot`
   - `currentTemplateConsistency`
   - `nextRepairTrack`

### 2.4 固定样本回归

必须验证：

1. `MIN-137`
   - 必须解释为摘要任务误入服务器执行链
   - 不是 `server_automation` 模板本身定义错误
2. `MIN-133`
   - 必须解释为 CI commit-summary 父任务
   - 不是服务器自动执行子任务
3. `MIN-119`
   - 必须解释为纯人工任务后续错误绑定
   - 不是模板语义歧义

### 2.5 默认解释规则

必须验证文档明确写清：

1. `33` 条 anomaly 默认先按历史活跃样本或旧语义残留解释
2. `2` 条 binding gap 才是当前最像真实运行链缺口的对象
3. `3` 条 `localExecutionRouting` 继续只审计，不进入 strict gate

## 3. 阻断条件

出现任一情况，本轮不得宣称完成：

1. 仍把 `33` 条 anomaly 默认解释为“当前模板持续产错”
2. `localExecutionRouting` 被重新拉回 heartbeat strict gate
3. 文档提前承诺：
   - 批量补 workspace
   - 批量 patch 远端 issue
   - heartbeat 直接恢复为绿
4. `35 / 8 / 3` 没有成为唯一当前基线

## 4. 验收条件

本轮通过条件：

1. 新 Spec / Task / QA Basis 已正式落地
2. 入口 README 与 verification 已同步到样本解释口径
3. `MIN-137 / MIN-133 / MIN-119` 的解释结论已写成正式 QA 合同
4. 下一轮整改计划已被约束为必须建立在样本解释链之上
