# Observe-only Checkout 治理 Runbook

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-03
> source_of_truth：projects/aimandala/docs/runbooks/2026-05-03-observe-only-checkout-治理-runbook.md

## 1. 目标

这份 runbook 只回答一件事：

当 automation 节点的 observe-only checkout 变脏时，应该怎么判断、怎么止损、怎么决定后续升级路径。

当前正式 observe-only checkout 只有两个：

1. `/opt/automation/app/mindsync`
2. `/opt/automation/app/mindsync-heartbeat`

真正允许写文件的执行根目录是：

1. `/opt/automation/worktrees/...`

## 2. 升级前最小检查集

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

## 3. 判断树

### 3.1 两个 checkout 都干净

结论：

1. 允许正常同步
2. 允许继续 heartbeat / maintenance / 升级动作

### 3.2 只有主镜像区脏

结论：

1. 先查脏改来源
2. 不要默认怪 heartbeat
3. 不要直接 `git pull`

优先怀疑：

1. 运行时误写
2. deploy / smoke / repair 写回了共享 checkout
3. 人工运维临时热修未收束

### 3.3 只有巡检区脏

结论：

1. 先查是否为现场补丁或脚本漂移
2. 不要继续把它当稳定巡检基线
3. 先恢复干净，再继续 heartbeat 升级

### 3.4 两个 checkout 都脏

结论：

1. 这是高风险状态
2. 不再做常规升级
3. 先盘点，再决定转正 / 备份 / 重建

## 4. 脏改分类

拿到 `git status` 后，固定按下面 4 类分类：

1. 运行时误写
2. 人工运维临时改动
3. 历史未清现场
4. 模板 / 脚本漂移

如果无法分类，就先视为“有保留价值的现场”，先备份，不直接清理。

## 5. 允许的修复动作

允许：

1. 先备份当前现场
2. 先提取有价值改动并转正进仓库
3. 对已确认无保留价值的 checkout 执行重建
4. 当只需要上线单点修复，采用定点覆盖而不是整仓升级

## 6. 不允许的修复动作

不允许：

1. 在未分类前直接 `git pull`
2. 在未确认来源前直接覆盖 checkout
3. 把 observe-only checkout 当 deploy / smoke 的实际执行目录
4. 因为目标 workflow 在 `relayhub/dev`，就把巡检 checkout 也切到 `relayhub/dev`

## 7. 何时需要重建 checkout

满足任一项时，优先考虑重建：

1. checkout 的脏改来源混杂，已无法安全分辨
2. 现场补丁已经全部转正进仓库
3. 该 checkout 已失去“稳定观察基线”价值
4. 继续在原目录上修补，比重新拉一份更难判断风险

## 8. 何时只做定点覆盖

满足下面条件时，可以只做定点覆盖：

1. 脏改仍有保留价值，暂时不能清
2. 本次只需要上线少量 heartbeat / unit / env 相关变更
3. 已完成备份
4. 已明确记录这不是长期治理完成态

## 9. 何时必须先转正或备份

满足任一项时，先转正或备份：

1. 现场改动仍影响当前成功运行
2. 现场改动还没有仓库对应版本
3. 当前无法确认是人工热修还是运行时误写

## 10. 与 systemd / heartbeat / maintenance 的联动顺序

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

## 11. 当前特别说明

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

## 12. 配套入口

- 规格：
  - [../specs/2026-05-03-observe-only-checkout-治理规格.md](../specs/2026-05-03-observe-only-checkout-治理规格.md)
- 计划：
  - [../tasks/2026-05-03-observe-only-checkout-治理实施计划.md](../tasks/2026-05-03-observe-only-checkout-治理实施计划.md)
- QA：
  - [../qa/2026-05-03-observe-only-checkout-治理-qa-basis.md](../qa/2026-05-03-observe-only-checkout-治理-qa-basis.md)
