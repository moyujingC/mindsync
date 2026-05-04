# Aimandala 服务器自动执行任务模板语义修复实施计划

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：projects/aimandala/docs/tasks/2026-04-19-server-automation-task-template-semantics-repair-plan.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：projects/aimandala/docs/specs/2026-04-19-服务器自动执行任务模板语义修复规格.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮目标

本轮只收口“服务器自动执行任务模板语义修复”的正式实施入口，不进入实现。

本轮目标固定为：

1. 把 `automation-summary` 与真正 `server_automation` task（任务）的模板边界写成可执行计划
2. 把 4 类 `source` 模板的修复优先级、字段合同与 smoke（冒烟测试）要求写死
3. 明确下一轮实现只改模板生成层，不把 health / audit / diagnosis 或运行态补救混进来

## 2. 本轮边界

本轮明确要做：

1. 新建本实施计划
2. 新建配套 QA Basis
3. 调整 `docs/tasks/README.md` 与 `docs/qa/README.md`，把新链路设为当前默认入口之一

本轮明确不做：

1. 不修改 `shared/tools/ci/paperclip-sync-lib.mjs`
2. 不修改 `shared/tools/ci/paperclip-sync-lib.smoke.mjs`
3. 不修改 `check-paperclip-execution-health.mjs`
4. 不修改 `audit-paperclip-workspace-materialization.mjs`
5. 不修改 `diagnose-paperclip-server-automation-materialization.mjs`
6. 不 patch 远端 issue
7. 不补 `executionWorkspaceId`
8. 不改 heartbeat strict gate

## 3. 实施对象

### 3.1 主实现入口

下一轮实现的唯一主入口固定为：

1. `shared/tools/ci/paperclip-sync-lib.mjs`
2. `shared/tools/ci/paperclip-sync-lib.smoke.mjs`

这里的修复对象只包括模板生成逻辑，不包括运行态巡检逻辑。

### 3.2 必修模板对象

下一轮实现必须固定覆盖 5 类模板对象：

1. `automation-summary / commit-summary`
2. `infra-runner-failure`
3. `build-failure`
4. `deploy-or-smoke-failure`
5. `ci-test-failure`

其中优先级固定为：

1. `infra-runner-failure`
2. `build-failure`
3. `deploy-or-smoke-failure`
4. `ci-test-failure`

原因：

1. `MIN-137` 暴露了 `runner-heartbeat` 摘要任务和真正 runner 故障任务最容易混层
2. `build-failure` 是当前最大桶
3. `deploy-or-smoke-failure` 与 `ci-test-failure` 仍是独立模板桶，不能借由其他模板顺带修

### 3.3 模板合同要求

下一轮实现必须把下面合同写死：

1. `automation-summary / commit-summary`
   - 固定生成：
     - `task_class: manual-review-required`
     - `execution_route: local_manual_review`
   - 固定作为控制面摘要 / 人工审核任务
   - 不进入服务器可写执行链
2. 4 类真正服务器自动执行 failure 模板
   - 固定生成：
     - `task_class: automation-execution`
     - `execution_route: server_automation`
   - `source` 语义稳定
   - `type` / `labelNames` 与其执行路径一致
   - description 头部字段顺序与最小字段集稳定

### 3.4 `runner-heartbeat` 的特别规则

下一轮实现必须明确区分两种任务：

1. `runner-heartbeat` 摘要 / 汇总任务
   - 仍属于 `automation-summary`
   - 保持 `manual-review-required + local_manual_review`
2. 真正的 runner 基础设施故障任务
   - 才属于 `infra-runner-failure`
   - 才能进入 `automation-execution + server_automation`

禁止继续使用“标题像 heartbeat / ci / runner”来猜测它是否属于服务器自动执行任务。

## 4. 实施顺序

下一轮实现必须按下面顺序执行：

1. 先扩 `paperclip-sync-lib.smoke.mjs`
2. 再修改 `paperclip-sync-lib.mjs`
3. 跑本地 smoke 与静态校验
4. 再决定是否需要补远端验证记录

禁止倒序：

1. 不允许先改模板生成，再补 smoke
2. 不允许先改 diagnosis / health / audit 分类逻辑来“解释通过”
3. 不允许先做远端 issue 补救，再回头修模板

## 5. 完成标准

只有同时满足下面条件，下一轮模板语义修复才算完成：

1. `automation-summary` 继续稳定保持 `manual-review-required + local_manual_review`
2. 4 类真正 failure 模板都显式闭合为 `automation-execution + server_automation`
3. `paperclip-sync-lib.smoke.mjs` 对 5 类模板对象都有稳定断言
4. `Runner-Heartbeat` 这类摘要任务不会再被模板层误导为服务器自动执行任务
5. 文档链没有扩张到 gate、diagnosis 或运行态补救
