# Automation Routing And Heartbeat Gate Verification

> 状态：superseded
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/qa/2026-04-18-automation-routing-and-heartbeat-gate-verification.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/company/Paperclip任务系统优化方案.md
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/deploy/paperclip-automation/README.md
> reviewers：Engineer, Test / QA

> 2026-04-19 状态说明：
> 本文档保留为旧 phase 1 服务器拒绝链的历史验证证据，不再代表当前正式 execution routing 目标架构。
>
> 2026-04-18 补充说明：
> heartbeat 恢复为绿色的正式口径已调整为“只拦当前活跃 Automation issue”；
> 历史 `done` 的 execution workspace 漂移继续作为审计留痕，不再单独阻断服务。
> 对 `manual-review-required + local_manual_review` 任务，服务器若发现其落入可写 worktree，则必须拒绝执行并转本地人工接手。
> 本记录已补入 phase 1 closeout 的真实错路由样本 `MIN-119`，并记录远端 `enableIsolatedWorkspaces` 前置修正与 heartbeat checkout 脚本同步事实。

## 1. 背景

本轮目标不是继续修改 `mindsync` 脚本，而是确认下面两件事是否已经在 automation 节点真实生效：

1. `automation-execution / manual-review-required` 与 `server_automation / local_manual_review` 的分流口径
2. heartbeat strict gate 是否会按新的原因码与执行边界直接失败

已知前置事实：

1. 仓库内四个脚本已经通过 `node --check`
2. 服务器 runbook 与治理文档已经收口到新口径
3. 尚未做 automation 节点上的真实回归

## 2. 本轮验收口径

至少确认：

1. automation 节点可访问
2. `/etc/default/paperclip-heartbeat` 已开启 `PAPERCLIP_EXECUTION_HEALTH_STRICT=1`
3. strict gate 能在真实运行态输出新原因码
4. workspace 审计能以 `/opt/automation/worktrees` 为期望根目录输出结果
5. heartbeat systemd 服务实际加载的路径与仓库模板一致
6. 若未一致，应明确记录为运行态配置漂移，而不是误判为脚本本身失效
7. 普通任务错路由时，正式处理口径是“服务器拒绝 + 本地人工接手”，不是继续在 automation 节点闭环

## 3. 执行记录

### 3.1 automation 节点连通性与环境检查

执行：

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes -o BatchMode=yes ubuntu@150.158.9.95 'hostname && date && pwd'
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes -o BatchMode=yes ubuntu@150.158.9.95 'cd /opt/automation/app/mindsync && git status --short && printf "\n---\n" && cd /opt/automation/app/mindsync-heartbeat && git status --short'
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes -o BatchMode=yes ubuntu@150.158.9.95 'sudo grep -E "^(PAPERCLIP_EXECUTION_HEALTH_STRICT|PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT|PAPERCLIP_EXECUTION_WORKTREE_ROOT|AIMANDALA_AUTO_REPAIR_BRANCH_PREFIX|PAPERCLIP_EXECUTION_HOST)=" /etc/default/paperclip-heartbeat /etc/default/paperclip-automation'
```

结果：

1. 服务器可正常登录，宿主机为 `VM-0-11-opencloudos`
2. `/etc/default/paperclip-heartbeat` 已启用 `PAPERCLIP_EXECUTION_HEALTH_STRICT=1`
3. `/etc/default/paperclip-automation` 已配置 `PAPERCLIP_EXECUTION_WORKTREE_ROOT=/opt/automation/worktrees`
4. `PAPERCLIP_EXECUTION_HOST` 已收口为 `automation@150.158.9.95`
5. 主镜像区 `/opt/automation/app/mindsync` 当前为脏工作区，检测到：
   - `.github/workflows/aimandala-deploy.yml`
   - `projects/aimandala/docs/qa/2026-04-18-MIN-125-deploy-dev-验证记录.md`
6. heartbeat 巡检区 `/opt/automation/app/mindsync-heartbeat` 未观察到脏文件

解释：

1. strict gate 所需环境变量已在服务器落地
2. 但主镜像区仍被真实改动写脏，说明运行时仍存在共享 checkout 被写入过的事实

### 3.2 isolated workspace 前置条件补验

执行：

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes -o BatchMode=yes ubuntu@150.158.9.95 'bash -s' <<'"'"'EOF'"'"'
set -euo pipefail
API_KEY=$(sudo awk -F= '/^PAPERCLIP_API_KEY=/{print $2}' /etc/default/paperclip-heartbeat)
API_BASE=$(sudo awk -F= '/^PAPERCLIP_API_BASE=/{print $2}' /etc/default/paperclip-heartbeat)
curl -fsS -H "Authorization: Bearer $API_KEY" "$API_BASE/api/instance/settings/experimental"
EOF
```

结果：

1. 初次补验时发现远端返回：
   - `{"enableIsolatedWorkspaces":false,"autoRestartDevServerWhenIdle":false}`
2. 该状态下 issue `executionWorkspaceId` patch 会被控制面忽略，导致 execution workspace 持久化记录仍全部回落到 shared checkout
3. 已使用现有控制面接口将其修正为：
   - `{"enableIsolatedWorkspaces":true,"autoRestartDevServerWhenIdle":false}`

解释：

1. 这不是 `mindsync` 脚本逻辑错误，而是 phase 1 远端 closeout 的运行态前置条件缺失
2. 若 `enableIsolatedWorkspaces=false`，则无法构造真实 `/opt/automation/worktrees/...` 错路由样本，也无法验证服务器拒绝闭环
3. phase 1 closeout 需要把这一运行态前置条件显式记为已修正项

### 3.3 strict gate 实测

执行：

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes -o BatchMode=yes ubuntu@150.158.9.95 'cd /opt/automation/app/mindsync-heartbeat && set -a && source /etc/default/paperclip-heartbeat && set +a && node shared/tools/ci/check-paperclip-execution-health.mjs --company-id "$PAPERCLIP_COMPANY_ID" --project-name "一镜一梳" --api-base "$PAPERCLIP_API_BASE" --api-key "$PAPERCLIP_API_KEY" --stale-minutes "${PAPERCLIP_EXECUTION_STALE_MINUTES:-15}" --expected-root "${PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT:-/opt/automation/worktrees}" --strict'
```

结果：

1. 命令退出码为 `2`
2. 当前真实输出为：
   - `34 active issue(s) missing execution workspace binding`
   - `8 historical done issue(s) missing execution workspace binding`
   - `0 issue(s) rejected for server writable execution`
3. 新原因码 `execution_workspace_policy_not_materialized` 已在真实输出中出现
4. cleanup 后稳态输出中 `server_writable_execution_not_allowed` 已回落为 `0`

解释：

1. 新 strict gate 逻辑本身已经可以在服务器真实运行态中工作
2. 当前 gate 失败的直接原因不是脚本缺失，而是仍有 34 条活跃 issue 未 materialize 到 execution workspace
3. 历史 `done` 样本已从 strict gate 主链中分离，只继续保留 8 条审计证据
4. 后续恢复 heartbeat 时，应只把当前活跃 Automation issue 视为阻断项，不把历史 `done` 样本继续并入 strict gate

### 3.4 workspace materialization 审计实测

执行：

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes -o BatchMode=yes ubuntu@150.158.9.95 'cd /opt/automation/app/mindsync-heartbeat && set -a && source /etc/default/paperclip-heartbeat && set +a && node shared/tools/ci/audit-paperclip-workspace-materialization.mjs --company-id "$PAPERCLIP_COMPANY_ID" --project-name "一镜一梳" --api-base "$PAPERCLIP_API_BASE" --api-key "$PAPERCLIP_API_KEY" --expected-root /opt/automation/worktrees --repo-root /opt/automation/app/mindsync'
```

结果：

1. 审计完成并输出：
   - `active_missing=34`
   - `historical_done_missing=8`
   - `rejected=0`
   - `outside_root=0`
   - `host_unbound=0`
2. 输出中的 `expectedRoot` 为 `/opt/automation/worktrees`
3. `executionWorkspacesOutsideExpectedRoot = []`
4. `hostWorktreesWithoutBoundIssue = []`
5. `serverWritableExecutionRejectedIssues = []`

解释：

1. 期望根目录口径已经对齐
2. 当前主要问题不是 worktree 根目录配置错误，而是 34 条活跃 issue 与 execution workspace 绑定没有真正 materialize
3. 历史 `done` 样本继续以 8 条审计记录保留为治理债证据链
4. 上述结果是 cleanup 后的稳态审计，不代表 phase 1 closeout 缺少真实错路由样本；真实样本见 `3.6`

### 3.5 heartbeat systemd 真实加载路径检查

执行：

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes -o BatchMode=yes ubuntu@150.158.9.95 'systemctl status paperclip-heartbeat.service --no-pager -n 40; printf "\n---\n"; systemctl status paperclip-heartbeat.timer --no-pager -n 20'
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes -o BatchMode=yes ubuntu@150.158.9.95 'sudo cat /etc/systemd/system/paperclip-heartbeat.service'
```

首次检查结果：

1. `paperclip-heartbeat.service` 当前处于 `failed`
2. 失败原因不是 strict gate 返回非零，而是：
   - `Cannot find module '/opt/automation/ops/paperclip-ci/check-runner-heartbeat.mjs'`
3. 服务器上已安装 unit 仍使用：
   - `WorkingDirectory=/opt/automation/ops/paperclip-ci`
   - `node /opt/automation/ops/paperclip-ci/check-runner-heartbeat.mjs`
   - `node /opt/automation/ops/paperclip-ci/check-paperclip-execution-health.mjs`
4. 仓库模板 `projects/aimandala/deploy/paperclip-automation/paperclip-heartbeat.service.example` 已收口为：
   - `WorkingDirectory=/opt/automation/app/mindsync-heartbeat`
   - `node shared/tools/ci/check-runner-heartbeat.mjs`
   - `node shared/tools/ci/check-paperclip-execution-health.mjs`

首次检查解释：

1. 当前线上 heartbeat 没有真正跑到仓库模板里的新命令
2. 这是运行态 systemd unit 漂移，不是本轮 `mindsync` 脚本路径仍未更新
3. 在修正已安装 unit 并 `daemon-reload + restart` 之前，不能把 heartbeat 失败简单归因成 strict gate 命中

### 3.6 systemd unit 同步后的二次验证

执行：

1. 将服务器上的
   - `/etc/systemd/system/paperclip-heartbeat.service`
   - `/etc/systemd/system/automation-maintenance.service`
   同步为仓库模板对应内容
2. 执行：

```bash
sudo systemctl daemon-reload
sudo systemctl cat paperclip-heartbeat.service
sudo systemctl cat automation-maintenance.service
sudo systemctl start paperclip-heartbeat.service
systemctl status paperclip-heartbeat.service --no-pager -n 80
```

结果：

1. `paperclip-heartbeat.service` 的 `WorkingDirectory` 已切到 `/opt/automation/app/mindsync-heartbeat`
2. `ExecStart` 已切到仓库内：
   - `shared/tools/ci/check-runner-heartbeat.mjs`
   - `shared/tools/ci/check-paperclip-execution-health.mjs`
3. 二次启动后，不再出现 `MODULE_NOT_FOUND`
4. 当前真实退出码为 `status=2`
5. 失败原因已变为 strict gate 命中：
   - `execution_workspace_policy_not_materialized`

补充检查：

```bash
systemctl status automation-maintenance.service --no-pager -n 40
```

结果：

1. `automation-maintenance.service` 也已切到 `/opt/automation/app/mindsync-heartbeat`
2. 当前失败原因仍是预期中的 fail-fast：
   - 主镜像区 `/opt/automation/app/mindsync` 检测到脏工作区
3. 这说明 maintenance 不再卡在旧路径漂移，而是进入了新的“共享 checkout 必须保持干净”的保护逻辑

### 3.7 真实错路由样本 `MIN-119` 验证

执行概述：

1. 选用普通研发类 issue `MIN-119`
   - `task_class: manual-review-required`
   - `execution_route: local_manual_review`
2. 临时创建真实 host worktree：
   - branch: `automation/aimandala/phase1-local-handoff-sample`
   - path: `/opt/automation/worktrees/phase1-local-handoff-sample`
3. 临时将 execution workspace `0bd05e2d-bd9a-48d1-9343-38784ce7f2c4` 指向：
   - `cwd=/opt/automation/worktrees/phase1-local-handoff-sample/projects/aimandala`
   - `providerRef=/opt/automation/worktrees/phase1-local-handoff-sample/projects/aimandala`
4. 将 `MIN-119` 临时置为：
   - `status=in_progress`
   - `executionWorkspaceId=0bd05e2d-bd9a-48d1-9343-38784ce7f2c4`
   - `executionWorkspacePreference=reuse_existing`
5. 在 automation 节点执行：

```bash
cd /opt/automation/app/mindsync-heartbeat
set -a
source /etc/default/paperclip-heartbeat
set +a
node shared/tools/ci/check-paperclip-execution-health.mjs \
  --company-id "$PAPERCLIP_COMPANY_ID" \
  --project-name "一镜一梳" \
  --api-base "$PAPERCLIP_API_BASE" \
  --api-key "$PAPERCLIP_API_KEY" \
  --stale-minutes "${PAPERCLIP_EXECUTION_STALE_MINUTES:-15}" \
  --expected-root "${PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT:-/opt/automation/worktrees}" \
  --apply --strict
node shared/tools/ci/audit-paperclip-workspace-materialization.mjs \
  --company-id "$PAPERCLIP_COMPANY_ID" \
  --project-name "一镜一梳" \
  --api-base "$PAPERCLIP_API_BASE" \
  --api-key "$PAPERCLIP_API_KEY" \
  --expected-root /opt/automation/worktrees \
  --repo-root /opt/automation/app/mindsync
```

结果：

1. 首次复验发现 heartbeat checkout 中的 `check-paperclip-execution-health.mjs` 仍是旧版本
   - 远端脚本缺少 `buildLocalManualReviewHandoffComment`
   - 远端脚本缺少 `server_writable_execution_not_allowed` 的 `--apply` patch 分支
2. 将 `/opt/automation/app/mindsync-heartbeat/shared/tools/ci/check-paperclip-execution-health.mjs` 同步为当前仓库版本后重跑
3. 重跑后的 health 输出为：
   - `Detected 34 active issue(s) missing execution workspace binding, 8 historical done issue(s) missing execution workspace binding, and 1 issue(s) rejected for server writable execution`
4. 重跑后的 audit 输出为：
   - `Workspace audit completed: active_missing=34, historical_done_missing=8, rejected=1, outside_root=0, host_unbound=1`
5. `MIN-119` 被真实 patch 为：
   - `status=blocked`
   - `executionWorkspaceId=0bd05e2d-bd9a-48d1-9343-38784ce7f2c4`
6. `MIN-119` 最新 comment 为标准 handoff 模板：

```text
执行分流巡检时间：2026-04-18T05:27:14.824Z
- 当前判断：服务器拒绝可写执行
- blocked reason: human_action_required
- task_class: manual-review-required
- execution_route: local_manual_review
- 触发原因：/opt/automation/worktrees/phase1-local-handoff-sample/projects/aimandala 落入服务器可写路径，但当前任务要求本地人工审核与执行

已做动作：
- 本次巡检已阻断服务器继续在可写 worktree 中执行该任务。
- heartbeat / maintenance 不会替该任务继续写文件或自动闭环。

下一步动作：
- 请由人工在本地环境接手该 local_manual_review 任务。
- 在本地完成判断、修改、验证与提交后，再按人工审核流程推进。

谁来解除阻塞：
- 当前任务 owner / 本地执行责任人
```

cleanup：

1. 已将 `MIN-119.executionWorkspaceId` 与 `executionWorkspacePreference` 清回 `null`
2. 已将临时 execution workspace 记录恢复到原 `shared checkout` 路径
3. 已删除临时 branch / worktree
4. cleanup 后再跑 audit，输出恢复为：
   - `active_missing=34`
   - `historical_done_missing=8`
   - `rejected=0`
   - `host_unbound=0`

解释：

1. phase 1 现在已经具备真实服务器侧的“拒绝 + blocked + handoff comment”证据链
2. closeout 阶段暴露的额外运行态问题不是脚本设计错误，而是 heartbeat checkout 未同步到仓库当前版本
3. phase 1 的正式结论应改为“服务器拒绝 + 本地人工接手闭环已在 automation 节点实测通过”

## 4. 结论

本轮结论分两层：

1. `mindsync` 仓库侧
   - 新分流口径和新原因码已经进入文档、模板和脚本
   - `check-paperclip-execution-health.mjs` 与 `audit-paperclip-workspace-materialization.mjs` 在 automation 节点可手动执行
2. automation 节点运行态
   - heartbeat 的旧路径漂移已经修正
   - isolated workspaces 前置开关已经修正为 `enableIsolatedWorkspaces=true`
   - heartbeat checkout 的 health 脚本已经同步到当前仓库版本
   - 当前 heartbeat 的真实阻塞已收敛为 strict gate 命中 `execution_workspace_policy_not_materialized`
   - maintenance 的真实阻塞已收敛为主镜像区脏工作区，不再是 systemd 路径错误

因此：

1. “heartbeat 是否按新原因码失败”已经在 systemd 实际执行链上得到确认
2. `MIN-119` 已在真实 `/opt/automation/worktrees/...` 条件下命中 `server_writable_execution_not_allowed`，并由 `--apply` 成功转为 `blocked + handoff comment`
3. 当前剩余问题不再是模板未落地，而是运行时仍有 34 条活跃 issue 未 materialize 到 execution workspace
4. heartbeat 恢复为绿色不等于历史样本已清空；它只意味着当前活跃 Automation issue 已不再命中 strict gate
5. 普通任务本地执行链在 phase 1 的正式实现是“服务器拒绝 + 人工本地接手”，不是“服务器继续代跑”

## 5. 残留风险与下一步

1. 下一步主任务是继续处理当前 34 条活跃 `execution_workspace_policy_not_materialized`
2. phase 1 closeout 额外暴露了一个运行态同步风险：
   - heartbeat checkout 即使 systemd 路径正确，也可能因为脚本版本滞后而导致 `--apply` 行为与仓库不一致
3. `aimandala-auto-repair.mjs` 的新分支命名空间本轮仍未做真实 push 回归，应单独安排 automation 节点回归
4. 若要恢复 maintenance 为绿色，需先回收主镜像区脏状态，并区分：
   - 路由错误导致的 shared checkout 写入
   - 历史遗留人工改动
   - 本应进入 `/opt/automation/worktrees` 的执行漂移
