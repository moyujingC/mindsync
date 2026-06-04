# Aimandala Server Automation Blocking Sample Interpretation Plan

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-21
> source_of_truth：projects/aimandala/docs/tasks/2026-04-19-server-automation-blocking-sample-interpretation-plan.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：projects/aimandala/docs/specs/2026-04-19-server-automation-blocking-sample-interpretation-spec.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮目标

本轮只落“远端活跃样本解释与历史样本回收前置链路”，不进入整改。

本轮固定完成：

1. 把远端基线统一更新为 `35 / 8 / 3`
2. 基于现有 diagnosis 输出形成全量样本解释表
3. 把固定样本与抽样方法写成正式任务入口
4. 为下一轮整改计划提供唯一前置链路

## 2. 本轮边界

本轮明确要做：

1. 新建 sample interpretation 的 `Spec / Task / QA Basis`
2. 更新 `specs / tasks / qa README`
3. 更新 heartbeat verification 的顶部说明与结论口径
4. 固定远端抽样顺序与证据要求

本轮明确不做：

1. 不修改 `PaperclipAI` 源码
2. 不修改 health / audit / diagnosis 脚本
3. 不修改 heartbeat strict gate
4. 不 patch 远端 issue
5. 不补 `executionWorkspaceId`
6. 不做批量状态清理
7. 不承诺 heartbeat 恢复为绿色

## 3. 实施顺序

本轮及下一轮实现必须按下面顺序执行：

1. 先把所有入口与 verification 的当前远端基线改写为 `35 / 8 / 3`
2. 基于现有 diagnosis 输出形成全量样本解释表
3. 按解释类做远端抽样核对
4. 抽样结果入档后，再形成下一轮整改入口

禁止跳步：

1. 不允许跳过样本解释表，直接做受控整改计划
2. 不允许先补 workspace，再回头解释样本
3. 不允许先把 `33` 条 anomaly 都按“当前模板产错”处理

## 4. 样本解释表合同

下一轮解释表必须覆盖：

1. `35` 条 active blocking
2. `8` 条 historical done drift
3. `3` 条 local execution misbinding

其中：

1. `35` 条 active blocking 必须全部进入且只进入一个 `interpretationClass`
2. `8` 条 historical done 与 `3` 条 local routing 必须保留为独立对象集
3. 每条样本至少记录：
   - `identifier`
   - `source`
   - `diagnosisBucket`
   - `interpretationClass`
   - `whyNotAnotherClass`
   - `currentTemplateConsistency`
   - `nextRepairTrack`

## 5. 抽样要求

### 5.1 `active_legacy_routing_samples`

至少抽样 4 条，且必须覆盖下面 4 类 `source`：

1. `build-failure`
2. `infra-runner-failure`
3. `deploy-or-smoke-failure`
4. `ci-test-failure`

### 5.2 `active_runtime_binding_gap_samples`

当前共 2 条，必须全抽。

### 5.3 `historical_done_drift_samples`

至少抽样 2 条。

### 5.4 `local_execution_misbinding_samples`

当前共 3 条，必须全抽。

### 5.5 固定样本

下面 3 条样本必须入档：

1. `MIN-137`
2. `MIN-133`
3. `MIN-119`

## 6. 证据要求

每条抽样样本至少核对：

1. issue metadata（元数据）
2. issue status / assignee / execution 痕迹
3. description 头部
4. diagnosis bucket
5. 当前模板语义是否一致
6. 是否属于后续错误绑定，而非模板歧义

通俗讲，要回答清楚两件事：

1. 这条样本为什么属于当前解释类
2. 为什么它不属于另外几类

## 7. 完成标准

只有同时满足下面条件，本轮才算完成：

1. 新 Spec / Task / QA Basis 已落地
2. 所有入口文档都把当前主问题改写为“样本解释”
3. verification 已明确当前基线为 `35 / 8 / 3`
4. 下一轮整改入口已被约束为必须建立在样本解释表之上
