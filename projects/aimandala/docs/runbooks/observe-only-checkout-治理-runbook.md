# Observe-only Checkout 治理 Runbook

> 状态：current
> 版本：0.2.1
> owner：Engineer
> last_updated：2026-05-31
> source_of_truth：projects/aimandala/docs/runbooks/observe-only-checkout-治理-runbook.md

## 1. 目标

这份 runbook 只回答一件事：

当 automation 节点的 observe-only checkout 变脏时，应该怎么判断、怎么止损、怎么决定后续升级路径。

当前正式 observe-only checkout 只有两个：

1. `/opt/automation/app/mindsync`
2. `/opt/automation/app/mindsync-heartbeat`

真正允许写文件的执行根目录是：

1. `/opt/automation/worktrees/...`

这份 runbook 是当前 automation 节点 observe-only checkout 的 control-backed runbook：

1. runbook 负责说明判断树、备份、清理和升级路径
2. `automation-node-maintenance.sh` 负责在 maintenance 前检查两个 observe-only checkout 是否干净
3. `server-automation-guard.mjs` 负责拒绝把 observe-only checkout 当成服务器执行 cwd
4. `check-paperclip-execution-health.mjs` 负责把 observe-only / workspace 漂移纳入 execution health 分类

## 2. 控制层行为

当前已有三个硬约束入口：

1. `shared/tools/ci/automation-node-maintenance.sh`
   - 默认检查 `/opt/automation/app/mindsync`
   - 默认检查 `/opt/automation/app/mindsync-heartbeat`
   - 任一 checkout 变脏时直接退出，不继续 maintenance
2. `shared/tools/ci/server-automation-guard.mjs`
   - `cwd` 命中 `/opt/automation/app/mindsync` 时拒绝执行
   - `cwd` 命中 `/opt/automation/app/mindsync-heartbeat` 时拒绝执行
   - `server_automation` 未落到 `/opt/automation/worktrees` 时拒绝执行
3. `shared/tools/ci/check-paperclip-execution-health.mjs`
   - 将 server automation 缺 execution workspace 的问题归入 `serverAutomationBlockingIssues`
   - 将 workspace 指向 observe-only checkout 的问题归入 observe-only / workspace 漂移
   - `--strict` 时对活跃阻断类问题返回非零

这些控制层不能替代人工分类和备份。它们只负责先拦住错误继续扩大。

## 3. 升级前最小检查集

每次升级、巡检异常排查或 maintenance 前，先执行：

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes ubuntu@150.158.9.95 '
  set -e
  cd /opt/automation/app/mindsync
  echo "[mindsync]"
  git status --short
  git branch --show-current
  git remote -v
  git rev-parse HEAD
  git log --oneline -n 5
  echo
  cd /opt/automation/app/mindsync-heartbeat
  echo "[mindsync-heartbeat]"
  git status --short
  git branch --show-current
  git remote -v
  git rev-parse HEAD
  git log --oneline -n 5
'
```

只要任一 checkout 不干净，就不要直接继续升级。

## 4. 判断树

### 4.1 两个 checkout 都干净

结论：

1. 允许正常同步
2. 允许继续 heartbeat / maintenance / 升级动作

### 4.2 只有主镜像区脏

结论：

1. 先查脏改来源
2. 不要默认怪 heartbeat
3. 不要直接 `git pull`

优先怀疑：

1. 运行时误写
2. deploy / smoke / repair 写回了共享 checkout
3. 人工运维临时热修未收束

### 4.3 只有巡检区脏

结论：

1. 先查是否为现场补丁或脚本漂移
2. 不要继续把它当稳定巡检基线
3. 先恢复干净，再继续 heartbeat 升级

### 4.4 两个 checkout 都脏

结论：

1. 这是高风险状态
2. 不再做常规升级
3. 先盘点，再决定转正 / 备份 / 重建

## 5. 脏改分类

拿到 `git status` 后，固定按下面 4 类分类：

1. 运行时误写
2. 人工运维临时改动
3. 历史未清现场
4. 模板 / 脚本漂移

如果无法分类，就先视为“有保留价值的现场”，先备份，不直接清理。

## 6. 允许的修复动作

允许：

1. 先备份当前现场
2. 先提取有价值改动并转正进仓库
3. 对已确认无保留价值的 checkout 执行重建
4. 当只需要上线单点修复，采用定点覆盖而不是整仓升级

## 7. 不允许的修复动作

不允许：

1. 在未分类前直接 `git pull`
2. 在未确认来源前直接覆盖 checkout
3. 把 observe-only checkout 当 deploy / smoke 的实际执行目录
4. 因为目标 workflow 在 `relayhub/dev`，就把巡检 checkout 也切到 `relayhub/dev`
5. 为了让 maintenance 继续跑而临时 `git reset --hard`
6. 为了让 server automation 继续跑而把 cwd 改回 observe-only checkout

## 8. 何时需要重建 checkout

满足任一项时，优先考虑重建：

1. checkout 的脏改来源混杂，已无法安全分辨
2. 现场补丁已经全部转正进仓库
3. 该 checkout 已失去“稳定观察基线”价值
4. 继续在原目录上修补，比重新拉一份更难判断风险

## 9. 何时只做定点覆盖

满足下面条件时，可以只做定点覆盖：

1. 脏改仍有保留价值，暂时不能清
2. 本次只需要上线少量 heartbeat / unit / env 相关变更
3. 已完成备份
4. 已明确记录这不是长期治理完成态

## 10. 何时必须先转正或备份

满足任一项时，先转正或备份：

1. 现场改动仍影响当前成功运行
2. 现场改动还没有仓库对应版本
3. 当前无法确认是人工热修还是运行时误写

## 11. 与 systemd / heartbeat / maintenance 的联动顺序

默认顺序固定为：

1. 先检查 observe-only checkout 是否干净
2. 再检查：
   - `systemctl cat paperclip-heartbeat.service`
   - `/etc/default/paperclip-heartbeat`
3. 再跑 doctor
4. 再看 `journalctl`
5. 最后才决定是否：
   - 定点覆盖
   - 正常同步
   - 重建 checkout

其中 maintenance 链路已经有硬阻断：

```bash
shared/tools/ci/automation-node-maintenance.sh
```

如果它因为 observe-only checkout 变脏退出，应先回到本 runbook 的判断树，不要直接绕过脚本。

## 12. 验证命令

本 runbook 对应的最小本地静态验证是：

```bash
bash -n shared/tools/ci/automation-node-maintenance.sh
node --check shared/tools/ci/server-automation-guard.mjs
node shared/tools/ci/server-automation-guard.smoke.mjs
node --check shared/tools/ci/check-paperclip-execution-health.mjs
node shared/tools/ci/execution-health.smoke.mjs
```

在 automation 节点真实排障时，还应使用本 runbook 第 3 节的 SSH 检查集确认两个 checkout 的实际状态。

## 13. 当前特别说明

当前多项目 heartbeat 已正式覆盖：

1. `一镜一梳 / main`
2. `RelayHub / relayhub/dev`

这里要特别区分两件事：

1. heartbeat 检查目标 branch 的 workflow 运行态
2. 巡检 checkout 自己的本地分支治理

第 1 条要求它能观察 `relayhub/dev`。
第 2 条不要求它本地切到 `relayhub/dev`。

巡检 checkout 的长期正确状态仍是：

1. 跟 `origin/main`
2. 保持干净

## 14. 配套入口

- 规格：
  - [../specs/2026-05-03-observe-only-checkout-治理规格.md](../specs/2026-05-03-observe-only-checkout-治理规格.md)
- 计划：
  - [../tasks/2026-05-03-observe-only-checkout-治理实施计划.md](../tasks/2026-05-03-observe-only-checkout-治理实施计划.md)
- QA：
  - [../qa/2026-05-03-observe-only-checkout-治理-qa-basis.md](../qa/2026-05-03-observe-only-checkout-治理-qa-basis.md)
  - [../qa/2026-05-03-observe-only-checkout-历史残留清理验证记录.md](../qa/2026-05-03-observe-only-checkout-历史残留清理验证记录.md)
- 控制层：
  - `shared/tools/ci/automation-node-maintenance.sh`
  - `shared/tools/ci/server-automation-guard.mjs`
  - `shared/tools/ci/check-paperclip-execution-health.mjs`

## 15. 历史残留清理完成态

2026-05-03 本轮真实收口后，automation 节点应满足下面完成态：

1. `/opt/automation/app/mindsync`
   - `git status --short` 为空
2. `/opt/automation/app/mindsync-heartbeat`
   - `git status --short` 为空
3. `/opt/automation/worktrees`
   - 不再存在 dirty worktree

### 15.1 必须保留的备份目录口径

本轮已验证的备份目录分三组：

1. observe-only checkout：
   - `/home/ubuntu/cleanup-backups/20260503-185240`
   - `/home/ubuntu/cleanup-backups/20260503-185656-heartbeat`
2. 已完成 / 纯文档残留 worktree：
   - `/home/ubuntu/cleanup-backups/20260503-190217-MIN-134-frontend-quality`
   - `/home/ubuntu/cleanup-backups/20260503-190707-doc-review-worktrees/...`
3. 老基线残留副本：
   - `/home/ubuntu/cleanup-backups/20260503-191124-stale-active-worktrees/...`

以后再做同类清理时，默认也按这三层分类保留备份：

1. observe-only checkout 现场
2. `done / in_review` 残留
3. 仍挂在老基线提交上的未提交副本

### 15.2 历史残留 worktree 的正式收口顺序

不要直接 `rm -rf`。固定顺序应为：

1. 先确认 issue 状态与文件类型
2. 先导出：
   - `git status --short --branch`
   - `git diff`
   - `git ls-files --others --exclude-standard`
3. 再打包整个 worktree 目录
4. 再执行 `git worktree remove --force`
5. 最后把对应 issue 状态同步收口

### 15.3 issue 状态收口口径

如果 worktree 已从运行目录移除，但任务本身并未形成正式交付闭环，不要直接改成 `done`。

当前经过验证的正式口径是：

1. 把对应 issue 改成 `blocked`
2. 再单独写一条评论，明确：
   - 原 worktree 路径
   - backup 目录
   - 为什么移除
   - 若要继续，应先从备份恢复，再重新 materialize 新 worktree

评论接口已验证可用：

```bash
POST /api/issues/<issueId>/comments
content-type: application/json
{"body":"..."}
```

### 15.4 当前已验证的最终结果

本轮已完成验证：

1. `MIN-134` 已作为 `done` 残留移除
2. `MIN-157 / MIN-159 / MIN-161` 已作为纯文档 `in_review` 残留移除
3. `MIN-150 / MIN-160 / MIN-163 / MIN-165` 已作为老基线未提交副本移除
4. `MIN-150 / MIN-160 / MIN-163 / MIN-165` 的 Paperclip issue 已统一转为 `blocked`
5. 上述 4 个 issue 都已补“历史 worktree 归档说明”评论
