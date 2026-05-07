# Aimandala 按 Paperclip 原生模型重设计 QA Basis

> 状态：historical-reference
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-19
> source_of_truth：projects/aimandala/docs/qa/2026-04-19-paperclip-native-execution-routing-qa-basis.md
> 项目：aimandala
> 阶段：qa-basis
> depends_on：projects/aimandala/docs/specs/2026-04-19-paperclip-native-execution-routing-spec.md
> depends_on：projects/aimandala/docs/tasks/2026-04-19-paperclip-native-execution-routing-plan.md
> reviewers：Engineer, Test / QA

## 1. 本轮验证对象

本轮只验证新的文档合同，不验证脚本或部署实现。

验证对象固定为：

1. 新 Spec、Task、QA 三者是否一致
2. `local_manual_review` 是否已被正式重释为直接本地执行主路径
3. 服务器 heartbeat 是否已从文档层收束为只拦活跃 `server_automation`
4. 上游原生执行模型是否被准确继承
5. 旧 phase 1 / phase 2 是否已被明确降为历史方案

## 2. 测试矩阵

### 2.1 文档一致性

必须验证：

1. 新 Spec、Task、QA Basis 使用同一套核心结论
2. 不再保留“服务器拒绝普通任务是主路径”的表述
3. 不再把 `local_manual_review` 解释成 handoff 流程
4. 不形成 server-reject 与 local-node 并存的正式双轨

### 2.2 上游对齐

必须验证新文档显式继承下面三条上游事实：

1. control plane 与 execution host 解耦
2. 本地 adapter 在宿主机本地执行
3. hosted `Paperclip` + remote/local execution host 是一等模型

若缺少任一条，不得宣称已按上游原生模型重设计。

### 2.3 语义回归

必须验证：

1. `task_class / execution_route` 字段名保持不变
2. `manual-review-required + local_manual_review` 只表示直接本地执行主路径
3. `automation-execution + server_automation` 继续表示服务器 automation 执行主路径
4. CI 汇总父任务仍可保留 `manual-review-required + local_manual_review`
5. 文档明确说明 CI 汇总父任务是控制面协调任务，不是“等待服务器拒绝”的特殊样本

### 2.4 健康门边界

必须验证：

1. `execution_workspace_policy_not_materialized`
   - 继续只阻断活跃 `server_automation`
2. `server_writable_execution_not_allowed`
   - 新文档已把它重释为审计型错路由信号
   - 默认只进入 audit，不阻断服务器 heartbeat
3. 文档明确区分：
   - `serverAutomationBlockingIssues`
   - `localExecutionRoutingIssues`
4. 文档明确说明：
   - 本地节点离线 / 未绑定 / 未接管属于本地执行路径可用性问题
   - 不让服务器 heartbeat 因此失败

### 2.5 历史方案废弃

必须验证：

1. 2026-04-18 总 spec 已不再是 `current`
2. 2026-04-18 phase 1 plan / QA 已不再是 `current`
3. 2026-04-18 phase 2 spec 已不再是 `current`
4. 2026-04-19 旧 phase 2 task / QA 已不再是 `current`
5. 本地人工接手 runbook 与 comment 模板已不再作为当前主入口

## 3. 验收条件

本轮通过条件：

1. 新 2026-04-19 `Spec / Task / QA Basis` 已正式落地
2. 三份文档都把本地执行写成正式 execution path，而不是人工补位流程
3. 三份文档都明确服务器 heartbeat 只拦活跃 `server_automation`
4. 三份文档都明确旧 phase 1 / phase 2 方案已被替代
5. 索引文档已把新链路设为默认入口

## 4. 阻断条件

出现任一情况，本轮不得宣称完成：

1. 任一新文档仍把 `local_manual_review` 写成 handoff 流程
2. 任一新文档仍把服务器拒绝写成普通任务主路径
3. 新旧方案在入口文档中并存为两个当前主口径
4. 文档隐含要求新增状态、原因码或上游源码改造
5. 文档没有明确继承上游三条原生事实

## 5. 当前基线

本轮以 2026-04-18 已形成的服务器 automation 分流与 heartbeat 证据链为历史基线，但不再继承其普通任务主路径结论。

当前基线应解释为：

1. 它证明了旧方案曾经真实落地
2. 它解释了为什么需要从 `server reject + handoff` 迁移到 direct routing
3. 它不再约束新方案继续保留服务器拒绝链
