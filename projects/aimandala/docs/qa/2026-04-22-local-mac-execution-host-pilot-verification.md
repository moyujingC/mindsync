# Aimandala 本地 Mac 执行节点单机试点接入前置验证记录

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-22
> source_of_truth：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/qa/2026-04-22-local-mac-execution-host-pilot-verification.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/specs/2026-04-21-local-mac-execution-host-pilot-spec.md
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/tasks/2026-04-21-local-mac-execution-host-pilot-plan.md
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/qa/2026-04-21-local-mac-execution-host-pilot-qa-basis.md
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/runbooks/本地-Mac-执行节点单机试点-runbook.md
> reviewers：Engineer, Test / QA

## 1. 背景

本轮验证目标不是宣称“你的 Mac 已经真实接管普通任务运行”，而是把进入单机试点实现前必须成立的前置条件收成正式证据链。

本记录固定验证 3 件事：

1. 宿主语义是否已经从“`*_local = automation 服务器本地`”改写为“普通任务可由你的 Mac 承接”
2. 本地接入 runbook 是否已经固定复用 `paperclip-local-env.sh`，而不是重新发明一套连接方式
3. 单机试点最小闭环的操作合同、正反样本边界和回写字段是否已经被写死

本记录不验证：

1. 真实远端 issue 已完成 claim / checkout / comment 回写
2. 真实正样本已经在你的 Mac 上跑通到 `done`
3. 服务器 heartbeat 已因为本地节点接通而发生变化

## 2. 验收口径

本轮至少要确认下面条件同时成立：

1. [.paperclip.yaml](/Users/xinran/.codex/worktrees/31f1/mindsync/.paperclip.yaml)、[Paperclip-Agent-模型配置总表.md](/Users/xinran/.codex/worktrees/31f1/mindsync/company/Paperclip-Agent-模型配置总表.md)、[服务器与基础设施入口.md](/Users/xinran/.codex/worktrees/31f1/mindsync/company/服务器与基础设施入口.md) 对宿主语义的解释一致
2. [本地-Mac-执行节点单机试点-runbook.md](/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/runbooks/本地-Mac-执行节点单机试点-runbook.md) 已成为当前普通任务本地接入的正式操作入口
3. [paperclip-local-env.sh](/Users/xinran/.codex/worktrees/31f1/mindsync/shared/tools/paperclip-local-env.sh) 已被正式纳入连接合同，且脚本职责清晰
4. `MIN-137`、`MIN-133` 已被固定为摘要任务反例，不再允许被误解释为本地试点执行目标
5. 真实运行态接入仍被明确留在下一轮，不在本记录中伪装成已完成事实

## 3. 执行记录

### 3.1 宿主语义治理源复核

已复核以下治理源：

1. [.paperclip.yaml](/Users/xinran/.codex/worktrees/31f1/mindsync/.paperclip.yaml)
2. [Paperclip-Agent-模型配置总表.md](/Users/xinran/.codex/worktrees/31f1/mindsync/company/Paperclip-Agent-模型配置总表.md)
3. [服务器与基础设施入口.md](/Users/xinran/.codex/worktrees/31f1/mindsync/company/服务器与基础设施入口.md)

观察到的正式事实：

1. `control plane host` 继续定义为 automation 服务器
2. `server execution host` 继续只承接 `automation-execution + server_automation`
3. `local execution host` 在单机试点下已明确写成你的当前这台 Mac
4. `Engineer` 与 `Test / QA` 的 `codex_local` 已不再对普通任务默认解释为 automation 服务器本地
5. `*_local` 对普通任务路径的语义，已经从“服务器本地”改写为“用户本机宿主执行”

结论：

1. 这轮治理层已经不再停留在“语义上说去本地，但运行解释仍是服务器”的冲突状态
2. control plane（控制面）和 execution host（执行宿主机）已经在正式文档里拆开

### 3.2 本地连接基础件复核

已复核：

1. [paperclip-local-env.sh](/Users/xinran/.codex/worktrees/31f1/mindsync/shared/tools/paperclip-local-env.sh)

观察到的正式事实：

1. 脚本支持 `--base`，可导出：
   - `PAPERCLIP_API_URL`
   - `PAPERCLIP_COMPANY_ID`
   - `PAPERCLIP_WAKE_REASON`
2. 脚本支持按 agent ref 生成或复用 local-cli 凭证，可导出：
   - `PAPERCLIP_AGENT_ID`
   - `PAPERCLIP_API_KEY`
3. 脚本会通过 `/api/agents/me` 复核缓存 key 是否仍可用
4. 脚本明确区分：
   - 基础连接信息
   - agent 身份凭证
   - 运行态才会有的 `PAPERCLIP_RUN_ID`

结论：

1. “你的 Mac 直连远端控制面”这条链不是从零设计，而是建立在现有脚本之上
2. 下一轮实现无需重新设计连接协议，只需按 runbook 消费这个基础件

### 3.3 单机试点 runbook 复核

已复核：

1. [本地-Mac-执行节点单机试点-runbook.md](/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/runbooks/本地-Mac-执行节点单机试点-runbook.md)
2. [runbooks/README.md](/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/runbooks/README.md)

观察到的正式事实：

1. runbook 已固定要求先加载 `paperclip-local-env.sh --base`
2. runbook 已固定要求再按 `engineer` 或 `test_qa` 获取本地 agent 凭证
3. runbook 已明确要求用 `curl ... /api/agents/me` 复核自己接到的是远端真实控制面
4. runbook 已把本地最小回写字段写死为：
   - `cwd`
   - `branch`
   - `sha`
   - 当前判断
   - 已做动作
   - 下一步动作
   - 验证结论
5. runbook 已把正反样本边界写清：
   - 正样本：1 条真实 `manual-review-required + local_manual_review` 普通研发任务
   - 反样本：`MIN-137`、`MIN-133`
6. runbook 已明确禁止复用：
   - `/opt/automation/...`
   - 服务器 heartbeat checkout
   - 服务器 main mirror checkout

结论：

1. 单机试点最小闭环已经从“概念说明”落成“可执行 runbook”
2. 但它目前仍是接入前置 runbook，不应被误读成“真实本地 claim / checkout / 回写 已完成”

### 3.4 当前验证边界复核

已复核：

1. [2026-04-21-local-mac-execution-host-pilot-spec.md](/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/specs/2026-04-21-local-mac-execution-host-pilot-spec.md)
2. [2026-04-21-local-mac-execution-host-pilot-plan.md](/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/tasks/2026-04-21-local-mac-execution-host-pilot-plan.md)
3. [2026-04-21-local-mac-execution-host-pilot-qa-basis.md](/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/qa/2026-04-21-local-mac-execution-host-pilot-qa-basis.md)

观察到的正式事实：

1. 当前 artifact 链已经明确：
   - 本轮先做宿主语义、runbook、QA 基线
   - 下一轮才进入真实单机 claim / checkout / 执行 / 回写
2. QA baseline 目前验证的是“方案是否完整”，不是“运行时是否已接通”
3. `automation-summary / commit-summary` 继续被排除在本地试点正样本之外
4. `server_automation` 继续明确只由服务器承接

结论：

1. 当前仓库没有把“文档已写好”和“运行时已打通”混成一个结论
2. 这为下一轮真实试点实现保留了清晰边界

## 4. 当前已验证成立的结论

截至 `2026-04-22`，可以正式确认：

1. `aimandala` 普通任务的本地 Mac 单机试点，已经具备完整的 `spec + task + qa + runbook + verification` 文档链
2. “`*_local` 默认等于 automation 服务器本地”的旧口径，已在当前治理源中被替换
3. `paperclip-local-env.sh` 已成为本地 Mac 直连远端 Paperclip 控制面的正式基础件
4. `MIN-137` 与 `MIN-133` 已被固定为摘要父任务反例，不属于本地试点自动执行目标
5. 当前仍未产生“你的 Mac 已经真实接管普通任务运行”的验证结论

## 5. 尚未完成的事项

以下内容仍属于下一轮实现与运行态验证，不在本记录中冒充已完成：

1. 选定 1 条真实普通研发任务正样本
2. 用你的 Mac 完成真实 claim
3. 在本地仓库或本地 worktree 完成 checkout / 执行 / 验证
4. 在真实 issue 中回写最小 comment 字段
5. 推进真实状态流转：
   - `todo -> in_progress -> in_review -> done`
   - 或在受阻时转 `blocked`

## 6. 下一步建议

下一轮应直接进入真实单机试点接入，而不是继续重写语义文档。

推荐顺序：

1. 用 [paperclip-local-env.sh](/Users/xinran/.codex/worktrees/31f1/mindsync/shared/tools/paperclip-local-env.sh) 在你的 Mac 上完成基础连接验证
2. 选择 1 条真实 `local_manual_review` 普通任务作为正样本
3. 按 [本地-Mac-执行节点单机试点-runbook.md](/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/runbooks/本地-Mac-执行节点单机试点-runbook.md) 跑完最小闭环
4. 再补真实运行态 verification 与 delivery
