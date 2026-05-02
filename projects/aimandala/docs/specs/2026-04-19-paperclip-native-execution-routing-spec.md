# Aimandala 按 Paperclip 原生模型重设计 Spec

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：projects/aimandala/docs/specs/2026-04-19-paperclip-native-execution-routing-spec.md
> 项目：aimandala
> 阶段：spec
> depends_on：company/Paperclip任务系统优化方案.md
> depends_on：projects/aimandala/deploy/paperclip-automation/README.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 问题定义

`aimandala` 在 2026-04-18 收口出的 execution routing phase 1 / phase 2，采用了“服务器拒绝普通任务，再 handoff 到本地”的过渡模型。

这套模型虽然解决了共享 checkout 被写脏的问题，但与 `PaperclipAI` 上游当前更原生的设计方向并不一致。

上游已经明确三条事实：

1. `Paperclip` 是 control plane（控制面），不是把所有任务绑定到单一执行宿主机的 runtime（运行时）
2. control plane 与 execution host（执行宿主机）必须解耦
3. `codex_local` / `claude_local` 这类本地 adapter（适配器）是在 adapter 所在宿主机本地执行，不是先由服务器代跑再转交

因此，继续把“服务器拒绝 + 本地人工接手”当成正式主路径，会产生两个结构性问题：

1. 普通任务的正式执行责任仍然错误地挂在服务器侧，而不是直接挂到本地执行节点
2. `local_manual_review` 的语义被扭曲成“被拒绝后的例外路径”，而不是原生的本地执行主路径

本 Spec 的目标是明确废弃这套过渡主路径，改为更贴近 `PaperclipAI` 原生模型的双执行宿主机设计。

## 2. 目标

本轮要固定下面五条系统边界：

1. `automation-execution + server_automation`
   - 继续由 automation 节点执行
   - 继续要求 execution workspace、自动化白名单目录、自动化分支命名空间与服务器侧验证
2. `manual-review-required + local_manual_review`
   - 从现在起正式重释为“直接路由到本地执行节点”
   - 不再表示“服务器拒绝后的人工接手”
3. `Paperclip` 控制面职责
   - 只负责任务、状态、审计、路由与协调
   - 不要求所有任务先经过服务器执行责任判定
4. 服务器 heartbeat 职责
   - 只拦截活跃 `server_automation` 的真实执行风险
   - 不再把 `local_manual_review` 作为服务器侧阻断主对象
5. 本轮继续坚持
   - 不修改 `PaperclipAI` 源码
   - 只在 `mindsync` 的治理、部署、adapter 接入、runbook 与 QA 文档层落地

## 3. 非目标

本轮不做：

1. 不修改 `PaperclipAI` 控制面或 adapter 源码
2. 不新增 `task_class` / `execution_route` 字段
3. 不新增状态
4. 不新增原因码
5. 不直接进入脚本或部署实现
6. 不清理历史 `done` issue
7. 不保留“服务器拒绝 + handoff”作为当前正式双轨之一

## 4. 核心规则

### 4.1 执行模型

`aimandala` 当前正式执行模型固定为：

1. 一个 `Paperclip` control plane
2. 一个服务器 execution host
   - 承接 `automation-execution + server_automation`
3. 一个本地 execution host
   - 承接 `manual-review-required + local_manual_review`

这里的“本地 execution host”是正式执行路径，不再是人工补位的临时说法。

### 4.2 路由合同

保留当前显式元数据合同，不改字段名：

1. `task_class: automation-execution`
   - `execution_route: server_automation`
2. `task_class: manual-review-required`
   - `execution_route: local_manual_review`

从本 Spec 生效起：

1. `local_manual_review` 的正式含义是：
   - 该 issue 应直接由本地执行节点 claim / checkout / 执行 / 回写
2. `server_automation` 的正式含义是：
   - 该 issue 应由 automation 节点 materialize 到服务器 execution workspace 后执行

禁止重新解释为：

1. `local_manual_review = 服务器拒绝后再人工处理`
2. `server_automation = 所有任务的默认入口`

### 4.3 服务器执行边界

服务器继续只承接：

1. CI/CD
2. deploy
3. smoke
4. runner
5. infra
6. maintenance
7. 只读巡检与必须依赖 automation 节点本机环境的问题

服务器对 `manual-review-required + local_manual_review` 的职责固定为：

1. 控制面展示
2. 状态可见性
3. 审计记录
4. 路由观测

服务器不再承担：

1. 先拒绝普通任务
2. 把普通任务置为 `blocked`
3. 生成“必须本地接手”的 handoff 作为主流程

### 4.4 本地执行边界

普通任务的正式执行宿主机是本地，而不是服务器共享 checkout。

本地执行路径固定采用上游原生思路：

1. 本地 agent 使用现有 Paperclip connection string 直连服务器控制面
2. 本地 `codex_local` / `claude_local` 在本地宿主机上直接执行
3. 控制面仍统一承载 issue、comment、status、audit

这意味着：

1. 本地执行是正式 execution path（执行路径）
2. 不是“服务器拒绝后剩下的人工补洞流程”
3. 也不是要求服务器代起本地 CLI

### 4.5 CI 汇总父任务

CI 汇总父任务本轮继续保持：

1. `task_class: manual-review-required`
2. `execution_route: local_manual_review`

但其正式解释调整为：

1. 它是控制面协调任务
2. 它不是服务器写执行目标
3. 它也不是等待服务器拒绝的特殊样本

### 4.6 健康检查与 heartbeat

服务器 heartbeat 的正式职责固定为：

1. 只拦活跃 `server_automation` 风险
2. 不为本地执行路径的可用性承担主阻断责任

原因码规则调整为：

1. `execution_workspace_policy_not_materialized`
   - 继续只阻断活跃 `server_automation`
2. `server_writable_execution_not_allowed`
   - 不再表示“服务器拒绝并 handoff”
   - 后续重释为“本地任务错误进入服务器执行链”的审计型错路由信号
   - 默认只进入 audit，不阻断服务器 heartbeat

健康输出后续必须显式区分：

1. `serverAutomationBlockingIssues`
2. `localExecutionRoutingIssues`

其中：

1. `localExecutionRoutingIssues`
   - 包括本地任务误落服务器路径
   - 包括本地节点离线、未绑定或未接管等观测问题
   - 但这些问题默认不使服务器 heartbeat 失败

### 4.7 历史方案状态

下列文档链从本 Spec 生效起统一视为 `superseded`：

1. 2026-04-18 execution routing 总 spec
2. 2026-04-18 phase 1 计划与 QA
3. 2026-04-18 phase 2 本地接手 spec
4. 2026-04-19 phase 2 task / QA
5. 本地人工接手 runbook
6. 本地人工接手 comment 模板规范

它们保留作为历史证据链，但不再代表当前目标架构。

## 5. 上游对齐依据

本 Spec 继承下面三条上游事实：

1. `Paperclip` host 与 execution host 必须解耦
2. 本地 adapter 在宿主机本地执行
3. hosted `Paperclip` + remote/local execution host 是一等模型

因此 `aimandala` 的后续接入方向不是：

1. 继续强化“服务器拒绝 + handoff”

而是：

1. 明确服务器是 automation execution host
2. 明确本地是 manual execution host
3. 让 issue 从创建起就直接路由到正确宿主机

## 6. 验收标准

本轮 Spec 完成后，至少满足：

1. `manual-review-required + local_manual_review` 在正式文档中只能表示直接本地执行主路径
2. 不再保留“服务器拒绝是普通任务主路径”的表述
3. 新 Spec、Task、QA Basis 三者完全一致
4. 文档明确说明旧 phase 1/2 方案已被替代
5. 文档没有引入：
   - 新状态
   - 新原因码
   - 上游源码改造要求

## 7. 下一阶段 handoff

本 Spec 之后的实施阶段只应继续讨论：

1. 本地执行节点如何在现有 `Paperclip` 合同下接入
2. 服务器 README、runbook、QA、脚本口径如何改写
3. 旧 phase 1/2 文档如何批量迁出默认入口

不应再回到：

1. 是否继续保留服务器拒绝作为主流程
2. 是否把 `local_manual_review` 继续解释成 handoff
