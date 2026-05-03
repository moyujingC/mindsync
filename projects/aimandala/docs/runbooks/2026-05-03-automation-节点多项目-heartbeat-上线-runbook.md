# Automation 节点多项目 Heartbeat 上线 Runbook

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-03
> source_of_truth：projects/aimandala/docs/runbooks/2026-05-03-automation-节点多项目-heartbeat-上线-runbook.md

## 1. 目标

这份 runbook 用于把 automation 节点上的 `paperclip-heartbeat.service`，从旧的单项目 heartbeat 升级为多项目 heartbeat。

当前正式目标固定为：

1. `一镜一梳`
   - workflow：`aimandala-ci.yml`
   - branch：`main`
2. `RelayHub`
   - workflow：`relayhub-ci-deploy.yml`
   - branch：`relayhub/dev`

## 2. 固定节点事实

- 节点：`150.158.9.95`
- SSH：

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes ubuntu@150.158.9.95
```

- 仓库目录：
  - `/opt/automation/app/mindsync`
  - `/opt/automation/app/mindsync-heartbeat`
- worktree 根目录：
  - `/opt/automation/worktrees`
- systemd unit：
  - `/etc/systemd/system/paperclip-heartbeat.service`
- env：
  - `/etc/default/paperclip-heartbeat`
- 备份目录：
  - `/home/ubuntu/paperclip-heartbeat-backups`

## 3. 上线前基线检查

先记录当前运行态，避免把旧故障和本次升级混在一起。

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes ubuntu@150.158.9.95 '
  hostname
  date
  cd /opt/automation/app/mindsync && git status --short && git branch --show-current
  cd /opt/automation/app/mindsync-heartbeat && git status --short && git branch --show-current
  sudo systemctl cat paperclip-heartbeat.service
  sudo cat /etc/default/paperclip-heartbeat
  systemctl status paperclip-heartbeat.service --no-pager
  systemctl status paperclip-heartbeat.timer --no-pager
'
```

必须先记下：

1. 当前 `ExecStart`
2. 当前 `WorkingDirectory`
3. 当前 `/etc/default/paperclip-heartbeat` 内容
4. 最近一次成功或失败状态

## 4. 为什么本次不用 `git pull`

本次正式口径固定如下：

1. `/opt/automation/app/mindsync`
   - 是主镜像区
   - 可能带历史现场改动
2. `/opt/automation/app/mindsync-heartbeat`
   - 是巡检区
   - 也可能存在现场补丁或版本漂移

只要两个 checkout 任一个不干净，就不应直接 `git pull`。

原因很直接：

1. 你无法确认脏改是历史现场、运维热修、还是运行时误写
2. 直接 `pull` 容易把未分类现场与新版本混在一起
3. 升级后无法清楚判断问题来自旧现场还是本次改动

因此本次采用：

1. 先备份 unit 与 env
2. 再定点覆盖 heartbeat 相关文件
3. 最后用 doctor 和 systemd 验证

## 5. 备份

先在节点上创建时间戳备份：

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes ubuntu@150.158.9.95 '
  TS=$(date +%Y%m%d-%H%M%S)
  BACKUP_DIR=/home/ubuntu/paperclip-heartbeat-backups/$TS
  mkdir -p "$BACKUP_DIR"
  sudo cp /etc/systemd/system/paperclip-heartbeat.service "$BACKUP_DIR/paperclip-heartbeat.service"
  sudo cp /etc/default/paperclip-heartbeat "$BACKUP_DIR/paperclip-heartbeat.env"
  echo "$BACKUP_DIR"
'
```

## 6. 正式配置

当前正式 service 必须指向：

```bash
shared/tools/ci/paperclip-multi-project-heartbeat.mjs
```

当前正式 env 必须包含单行 `JSON`（单行 JavaScript Object Notation，结构化文本）：

```bash
PAPERCLIP_HEARTBEAT_TARGETS_JSON='[{"projectName":"一镜一梳","workflowFile":"aimandala-ci.yml","branch":"main","runnerLabels":"self-hosted,linux,mindsync-ci,aimandala"},{"projectName":"RelayHub","workflowFile":"relayhub-ci-deploy.yml","branch":"relayhub/dev","runnerLabels":"self-hosted,linux,mindsync-ci,aimandala"}]'
```

注意：

1. 这里必须是单行 JSON
2. 不要换成多行
3. 多行值在 `--env-file` doctor 路径下会解析失败

## 7. 手动 Doctor

切换前后都应跑一次 doctor：

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes ubuntu@150.158.9.95 '
  cd /opt/automation/app/mindsync-heartbeat
  node shared/tools/ci/paperclip-multi-project-heartbeat.mjs \
    --env-file /etc/default/paperclip-heartbeat \
    --doctor 1 \
    --print-json 1
'
```

成功标准：

1. 输出中同时出现 `一镜一梳`
2. 输出中同时出现 `RelayHub`
3. `一镜一梳` 使用：
   - `aimandala-ci.yml`
   - `main`
4. `RelayHub` 使用：
   - `relayhub-ci-deploy.yml`
   - `relayhub/dev`
5. 退出码为 `0`

## 8. systemd 刷新与验证

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes ubuntu@150.158.9.95 '
  sudo systemctl daemon-reload
  sudo systemctl cat paperclip-heartbeat.service
  sudo systemctl restart paperclip-heartbeat.service
  systemctl status paperclip-heartbeat.service --no-pager
  sudo journalctl -u paperclip-heartbeat.service -n 200 --no-pager
'
```

成功标准：

1. `WorkingDirectory=/opt/automation/app/mindsync-heartbeat`
2. `ExecStart` 已切到多项目 heartbeat 编排器
3. 日志中能看到两个 target 的检查结果
4. service 成功退出

## 9. 坏 Target 演练

为验证错误路径，允许临时把某个 target 的 `workflowFile` 改成不存在值。

建议只动 `RelayHub` 条目，验证完成后立刻恢复。

演练命令：

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes ubuntu@150.158.9.95 '
  cd /opt/automation/app/mindsync-heartbeat
  node shared/tools/ci/paperclip-multi-project-heartbeat.mjs \
    --env-file /etc/default/paperclip-heartbeat \
    --doctor 1 \
    --print-json 1
'
```

预期：

1. heartbeat 非零退出
2. 输出摘要仍保留两个 target 的结果
3. 能明确定位是 `RelayHub / relayhub-ci-deploy-broken.yml` 失败

恢复后必须重新执行：

1. doctor
2. `systemctl restart`
3. `journalctl`

## 10. 回滚

若升级后 heartbeat 异常，按下面顺序回滚：

1. 恢复 `/etc/systemd/system/paperclip-heartbeat.service`
2. 恢复 `/etc/default/paperclip-heartbeat`
3. `sudo systemctl daemon-reload`
4. `sudo systemctl restart paperclip-heartbeat.service`
5. 再检查：
   - `systemctl status paperclip-heartbeat.service --no-pager`
   - `journalctl -u paperclip-heartbeat.service -n 100 --no-pager`

回滚成功标准：

1. heartbeat 恢复为升级前单项目行为
2. `一镜一梳` heartbeat 恢复可用
3. 不要求此时 `RelayHub` 已纳入巡检

## 11. 常见故障

### 11.1 env 多行 JSON 解析失败

症状：

1. `--env-file` doctor 直接报错
2. 看起来 service 正常，但手动 doctor 无法加载 targets

处理：

1. 把 `PAPERCLIP_HEARTBEAT_TARGETS_JSON` 改成单行
2. 保留单引号包裹

### 11.2 systemd unit 漂移

症状：

1. `systemctl cat paperclip-heartbeat.service` 仍指向旧路径
2. 日志里仍在跑：
   - `check-runner-heartbeat.mjs && check-paperclip-execution-health.mjs`

处理：

1. 用仓库模板重写已安装 unit
2. `daemon-reload`
3. `restart`

### 11.3 workflow 文件名写错

症状：

1. doctor 非零退出
2. 只某一个 project 失败

处理：

1. 先确认 `workflowFile`
2. 再确认目标 workflow 已部署到默认分支

### 11.4 巡检 checkout 分支与目标 workflow 分支不一致

症状：

1. `RelayHub` target 明明成功跑过
2. 但诊断输出里仍出现：
   - `branch_mismatch`
   - `sha_mismatch`
   - `dirty_worktree`

解释：

1. 这表示巡检 checkout 自己不干净，或仍停在 `main`
2. 不表示 heartbeat 一定查错了分支
3. 多项目 heartbeat 检查的是目标 branch 上的 workflow 运行态
4. 巡检 checkout 本地保持 `origin/main` 干净即可，不需要跟着切到 `relayhub/dev`

真正该处理的是：

1. 巡检区是否长期干净
2. 观察区是否被误写

## 12. 配套入口

- 这次真实验证记录：
  - [../qa/2026-05-03-automation-节点多项目-heartbeat-上线验证记录.md](../qa/2026-05-03-automation-节点多项目-heartbeat-上线验证记录.md)
- 这轮正式交付：
  - [../delivery/2026-05-03-多项目-heartbeat-运行态落地交付记录.md](../delivery/2026-05-03-多项目-heartbeat-运行态落地交付记录.md)
- 后续 observe-only checkout 治理：
  - [2026-05-03-observe-only-checkout-治理-runbook.md](2026-05-03-observe-only-checkout-治理-runbook.md)
