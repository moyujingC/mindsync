# Aimandala 按 Paperclip 原生模型重设计实施计划

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/tasks/2026-04-19-paperclip-native-execution-routing-plan.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/specs/2026-04-19-paperclip-native-execution-routing-spec.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮目标

本轮只重建 execution routing 的正式 artifact 链，不进入实现。

本轮目标固定为：

1. 用新的总 Spec 替代旧 phase 1 / phase 2 主结论
2. 把 `local_manual_review` 正式重释为“直接本地执行主路径”
3. 为后续 runbook、README、脚本与接入层改造提供唯一实施入口
4. 终止“服务器拒绝 + 本地 handoff”继续被写成当前正式路线

## 2. 本轮边界

本轮明确要做：

1. 新建 2026-04-19 总 Spec
2. 新建 2026-04-19 实施计划
3. 新建 2026-04-19 QA Basis
4. 调整索引文档，把新链路设为当前默认入口
5. 把旧 phase 1 / phase 2 文档链标记为 `superseded`

本轮明确不做：

1. 不修改 `PaperclipAI` 源码
2. 不修改 `shared/tools/ci/*.mjs`
3. 不修改 automation 节点部署
4. 不补 `Delivery`
5. 不保留 server-reject 作为兼容双轨

## 3. 实施对象

### 3.1 新总 Spec

新 Spec 必须写死下面结论：

1. 服务器 execution host 只承接 `automation-execution + server_automation`
2. 本地 execution host 正式承接 `manual-review-required + local_manual_review`
3. `task_class / execution_route` 字段保留，但 `local_manual_review` 语义改为直接本地执行
4. `Paperclip` 控制面只做路由、状态、审计、协调
5. 服务器 heartbeat 不再为普通任务承担拒绝主流程

### 3.2 新实施计划

后续实施方向必须固定为四块：

1. README / runbook 重写
   - 把叙事从 `server reject + handoff` 改为 `direct routing`
2. QA 与验证口径重写
   - 把服务器阻断对象收束到活跃 `server_automation`
3. 脚本与审计口径重写
   - 把 `server_writable_execution_not_allowed` 改写为审计型错路由信号
4. 本地执行节点接入设计
   - 基于现有 connection string
   - 基于本地 `codex_local` / `claude_local`
   - 不通过服务器代起本地 CLI

### 3.3 新 QA Basis

QA 文档必须固定下面验证对象：

1. 新 Spec、Task、QA 三者完全一致
2. 新文档显式继承上游三条原生事实：
   - control plane 与 execution host 解耦
   - 本地 adapter 在宿主机本地执行
   - hosted `Paperclip` + remote/local execution host 是一等模型
3. `local_manual_review` 不再被解释为 handoff 流程
4. 服务器 heartbeat 只拦活跃 `server_automation`
5. 旧 phase 1 / phase 2 方案已被显式替代

### 3.4 索引与历史方案

后续文档入口必须同步：

1. `docs/tasks/README.md`
   - 新 2026-04-19 plan 设为 execution routing 当前默认入口
2. `docs/qa/README.md`
   - 新 2026-04-19 QA Basis 设为当前 execution routing 默认入口
3. `docs/runbooks/README.md`
   - 移除“本地人工接手 runbook 是当前重点入口”的表述
4. 旧文档头部
   - 从 `current` 改为 `superseded`
   - 明确说明已被 2026-04-19 新模型替代

## 4. 后续实现顺序

下一轮进入实现时，必须按下面顺序执行：

1. 先改 README、spec 索引、runbook 入口
2. 再改 QA / verification 叙事与基线
3. 再改脚本和 audit 原因码口径
4. 最后再讨论本地 execution host 的实际接入与验证

禁止反过来做：

1. 不允许先补本地 handoff 模板
2. 不允许继续以 `blocked + handoff comment` 作为普通任务主合同
3. 不允许在脚本实现里继续强化服务器拒绝链，再回头补文档

## 5. 完成标准

只有同时满足下面条件，本轮 planning artifact 才算完整：

1. 新 2026-04-19 `Spec / Task / QA Basis` 已正式落地
2. 旧 phase 1 / phase 2 文档链已被标记为 `superseded`
3. `tasks / qa / runbooks` 入口已不再把旧 phase 2 当成当前默认入口
4. 文档中没有保留“服务器拒绝普通任务是主路径”的表述
5. 文档没有隐含要求：
   - 新状态
   - 新原因码
   - 上游源码改造

