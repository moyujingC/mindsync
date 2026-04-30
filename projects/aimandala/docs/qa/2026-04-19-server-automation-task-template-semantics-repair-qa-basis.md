# Aimandala 服务器自动执行任务模板语义修复 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-19
> source_of_truth：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/qa/2026-04-19-server-automation-task-template-semantics-repair-qa-basis.md
> 项目：aimandala
> 阶段：qa-basis
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/specs/2026-04-19-服务器自动执行任务模板语义修复规格.md
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/tasks/2026-04-19-server-automation-task-template-semantics-repair-plan.md
> reviewers：Engineer, Test / QA

## 1. 本轮验证对象

本轮只验证模板语义是否闭合，不验证 heartbeat 是否恢复为绿色。

验证对象固定为：

1. `automation-summary / commit-summary` 模板
2. `infra-runner-failure` 模板
3. `build-failure` 模板
4. `deploy-or-smoke-failure` 模板
5. `ci-test-failure` 模板
6. `paperclip-sync-lib.smoke.mjs` 是否足够覆盖上述模板合同

## 2. 测试矩阵

### 2.1 文档一致性

必须验证：

1. 新 Task 与新 QA Basis 完全继承“服务器自动执行任务模板语义修复规格”
2. 两份文档都明确：
   - 当前问题是模板语义未闭合
   - 不是 gate 或 diagnosis 主逻辑错误
3. 两份文档都明确本轮不做：
   - heartbeat gate 调整
   - diagnosis 分桶调整
   - 远端 issue patch
   - `executionWorkspaceId` 批量补绑

### 2.2 `automation-summary / commit-summary`

必须验证：

1. 始终生成：
   - `task_class: manual-review-required`
   - `execution_route: local_manual_review`
2. `source: automation-summary` 固定存在
3. 即使 `workflow` 名称为：
   - `runner-heartbeat`
   - `ci`
   也不能被重新解释成 `server_automation`
4. description 头部字段集稳定，至少包含：
   - `automation_key`
   - `type:epic`
   - `task_class`
   - `execution_route`
   - `source`
   - `workflow`

### 2.3 `infra-runner-failure`

必须验证：

1. 真正的 runner 基础设施故障模板生成：
   - `task_class: automation-execution`
   - `execution_route: server_automation`
2. `source: infra-runner-failure` 固定存在
3. `type` / `labelNames` 与自动执行语义一致
4. 不能和 `Runner-Heartbeat` 摘要任务混层

### 2.4 `build-failure`

必须验证：

1. 模板生成：
   - `task_class: automation-execution`
   - `execution_route: server_automation`
2. description 头部字段顺序稳定
3. `source: build-failure` 固定存在
4. `type` / `labelNames` 与自动执行语义一致

### 2.5 `deploy-or-smoke-failure`

必须验证：

1. 模板是否仍属于真正服务器自动执行任务，在输出中有显式闭合语义
2. 即使它带 `review:deliverable` 或 artifact（交付物）相关标签，也不能出现：
   - `source` 是 deploy/smoke
   - 但 `task_class / execution_route` 却仍然模糊
3. description 头部字段稳定

### 2.6 `ci-test-failure`

必须验证：

1. 模板生成：
   - `task_class: automation-execution`
   - `execution_route: server_automation`
2. description 头部字段稳定
3. 不允许继续出现“source 是自动执行类，但 task_class / execution_route 没闭合”的情况

### 2.7 smoke 覆盖要求

`paperclip-sync-lib.smoke.mjs` 必须至少新增或覆盖下面断言：

1. `automation-summary`
2. `infra-runner-failure`
3. `build-failure`
4. `deploy-or-smoke-failure`
5. `ci-test-failure`

每类模板都必须断言：

1. `task_class`
2. `execution_route`
3. `source`
4. `type` / `labelNames`
5. description 头部最小字段集

## 3. 典型样本回归

本轮必须明确保留下面三条样本语义：

1. `MIN-137`
   - `Runner-Heartbeat`
   - 属于摘要任务
   - 不是服务器自动执行任务
2. `MIN-133`
   - `CI commit-summary` 父任务
   - 属于摘要任务
   - 不是服务器自动执行任务
3. `MIN-119`
   - 纯人工文档整理任务
   - 当前模板语义正确
   - 不属于本轮模板修复主对象

## 4. 阻断条件

出现任一情况，本轮不得宣称完成：

1. `automation-summary` 被重新定义为 `server_automation`
2. `infra-runner-failure` 仍无法和 `Runner-Heartbeat` 摘要任务区分
3. 任一 failure 模板的 `source` 与 `task_class / execution_route` 继续不闭合
4. smoke 没覆盖 5 类模板对象
5. 文档隐含要求：
   - 修改 heartbeat gate
   - 修改 diagnosis 分桶
   - patch 远端 issue
   - 批量补 workspace

## 5. 验收条件

本轮通过条件：

1. 新 Task 与新 QA Basis 已正式落地
2. 两份文档都把验证重点收窄为模板语义闭合
3. 两份文档都明确 `paperclip-sync-lib.mjs` 是主要实现入口
4. `MIN-137` / `MIN-133` / `MIN-119` 的语义回归已被写成正式验证合同
5. 下一轮实现者不需要再决定：
   - `Runner-Heartbeat` 算摘要任务还是自动执行任务
   - `automation-summary` 是否允许进入服务器可写执行链
   - 是否应该先去改 heartbeat gate
