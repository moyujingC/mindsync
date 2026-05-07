# Aimandala Automation 与本地执行分流 Phase 1 交付记录

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-18
> source_of_truth：projects/aimandala/docs/delivery/2026-04-18-automation-and-local-execution-routing-phase1-delivery.md
> 项目：aimandala
> 阶段：delivery
> depends_on：projects/aimandala/docs/tasks/2026-04-18-automation-and-local-execution-routing-phase1-plan.md
> depends_on：projects/aimandala/docs/qa/2026-04-18-automation-and-local-execution-routing-qa-basis.md
> depends_on：projects/aimandala/docs/qa/2026-04-18-automation-routing-and-heartbeat-gate-verification.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮交付内容

### 1.1 正式 artifact 链

本轮已补齐：

1. `Spec`
   - `2026-04-18-automation-and-local-execution-routing-spec.md`
2. `Task`
   - `2026-04-18-automation-and-local-execution-routing-phase1-plan.md`
3. `QA Basis`
   - `2026-04-18-automation-and-local-execution-routing-qa-basis.md`
4. `Verification`
   - `2026-04-18-automation-routing-and-heartbeat-gate-verification.md`

### 1.2 Phase 1 行为收口

本轮正式收口为：

1. heartbeat strict gate 只阻断活跃 Automation 风险
2. 历史 `done` 的 execution workspace 漂移继续审计，但不单独阻断服务
3. 普通任务若被错误落到服务器可写路径，服务器必须拒绝执行并转本地人工接手
4. 新建 Automation 子任务与 CI 汇总父任务继续显式带 `task_class / execution_route`

### 1.3 本地人工接手闭环

`check-paperclip-execution-health.mjs --apply` 当前补充了 phase 1 最小闭环：

1. 对命中的 `local_manual_review` 错路由 issue，自动置为 `blocked`
2. 写入标准化 comment，明确：
   - 当前任务属于本地人工审核路径
   - 服务器拒绝可写执行
   - 后续必须由人工在本地环境接手
   - heartbeat / maintenance 不会继续替其执行

## 2. 验证结论

本轮验证以两类证据为准：

1. 本地静态校验与 smoke
2. automation 节点真实运行输出

当前远端基线为：

1. `34 active issue(s) missing execution workspace binding`
2. `8 historical done issue(s) missing execution workspace binding`
3. `0 issue(s) rejected for server writable execution`

这意味着：

1. active/historical 分层已真实生效
2. heartbeat 当前失败原因已收敛为活跃 Automation 风险
3. 上述 `0 rejected` 是 cleanup 后稳态，不代表 phase 1 缺少真实错路由样本

phase 1 closeout 的真实样本证据为：

1. `MIN-119` 被明确标记为：
   - `task_class: manual-review-required`
   - `execution_route: local_manual_review`
2. 临时绑定到真实 host worktree：
   - `/opt/automation/worktrees/phase1-local-handoff-sample/projects/aimandala`
3. health `--apply --strict` 在 automation 节点真实命中：
   - `1 issue(s) rejected for server writable execution`
4. audit 真实命中：
   - `rejected=1`
   - `host_unbound=1`
5. `MIN-119` 被真实转为：
   - `status=blocked`
   - 标准 handoff comment 已写入 issue comment 流
6. cleanup 后审计恢复到稳态基线：
   - `34 active`
   - `8 historical done`
   - `0 rejected`

本轮 closeout 额外完成的运行态修正：

1. 远端 `enableIsolatedWorkspaces` 已修正为 `true`
2. automation 节点 heartbeat checkout 中的 `check-paperclip-execution-health.mjs` 已同步到当前仓库版本
3. 这两项都属于 phase 1 closeout 的前置条件修正，不属于 `PaperclipAI` 源码改造

## 3. 未完成项

本轮明确未做：

1. 不把用户本机纳入正式 execution node
2. 不批量回填历史 `done` issue
3. 不修改 `PaperclipAI` 控制面或运行时源码
4. 不把 main checkout 脏状态治理与 execution workspace 漂移治理混成一条问题线

## 4. 当前残留风险

1. heartbeat 绿色不等于历史治理债已清空
2. phase 1 closeout 暴露了部署同步风险：
   - 服务器 unit 指向的 heartbeat checkout 即使路径正确，也可能因为脚本版本滞后而失去最新 `--apply` 行为
3. heartbeat 当前仍被 `34 active issue(s) missing execution workspace binding` 阻断
4. maintenance 当前仍被 shared checkout 脏状态阻断
