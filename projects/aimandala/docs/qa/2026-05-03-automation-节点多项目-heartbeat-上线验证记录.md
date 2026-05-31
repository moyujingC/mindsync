# Automation 节点多项目 Heartbeat 上线验证记录

> 状态：historical-reference
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-05-03
> source_of_truth：projects/aimandala/docs/qa/2026-05-03-automation-节点多项目-heartbeat-上线验证记录.md
> 项目：aimandala
> 阶段：verification

## 1. 当前验证结论

`paperclip-heartbeat.service` 已在 automation 节点成功从单项目升级为多项目 heartbeat。

当前确认通过的目标为：

1. `一镜一梳`
   - workflow：`aimandala-ci.yml`
   - branch：`main`
2. `RelayHub`
   - workflow：`relayhub-ci-deploy.yml`
   - branch：`relayhub/dev`

## 2. 已执行验证

### 2.1 基线与备份

已确认：

1. 节点可登录：
   - `150.158.9.95`
2. 已记录：
   - 当前 unit
   - 当前 env
   - 当前 service 状态
3. 已在：
   - `/home/ubuntu/paperclip-heartbeat-backups`
   完成升级前备份

### 2.2 运行态切换

已确认：

1. `/etc/systemd/system/paperclip-heartbeat.service`
   - 已切到 `shared/tools/ci/paperclip-multi-project-heartbeat.mjs`
2. `/etc/default/paperclip-heartbeat`
   - 已加入 `PAPERCLIP_HEARTBEAT_TARGETS_JSON`
3. `PAPERCLIP_HEARTBEAT_TARGETS_JSON`
   - 已改成单行 JSON

### 2.3 手动 doctor

已执行：

```bash
cd /opt/automation/app/mindsync-heartbeat
node shared/tools/ci/paperclip-multi-project-heartbeat.mjs \
  --env-file /etc/default/paperclip-heartbeat \
  --doctor 1 \
  --print-json 1
```

结果：

1. 输出中同时出现：
   - `一镜一梳`
   - `RelayHub`
2. `一镜一梳` 使用：
   - `aimandala-ci.yml`
   - `main`
3. `RelayHub` 使用：
   - `relayhub-ci-deploy.yml`
   - `relayhub/dev`
4. 命令退出码为 `0`

### 2.4 systemd 验证

已执行：

```bash
sudo systemctl daemon-reload
sudo systemctl restart paperclip-heartbeat.service
systemctl status paperclip-heartbeat.service --no-pager
sudo journalctl -u paperclip-heartbeat.service -n 200 --no-pager
```

结果：

1. service 成功运行
2. 日志中能看到两个 target 都被顺序检查
3. 两个 target 最终都为 `ok: true`

### 2.5 坏 target 演练

已执行临时坏配置演练：

1. 把 `RelayHub` 的 `workflowFile` 改成不存在值
2. 重新跑 doctor
3. 观察失败路径
4. 恢复正式值

结果：

1. heartbeat 非零退出
2. 输出摘要仍保留两个 target 的结果
3. 能明确定位到 `RelayHub` 的坏 workflow
4. 恢复正式值后，再次 doctor 成功
5. 恢复正式值后，再次 systemd restart 成功

## 3. 本轮关键事实

本轮正式事实固定为：

1. 多项目 heartbeat 已经在 automation 节点真实运行
2. `PAPERCLIP_HEARTBEAT_TARGETS_JSON` 必须保持单行
3. 两个 target 共用同一套 GitHub / Paperclip 凭证
4. 多项目 heartbeat 检查的是各自目标 branch 的 workflow 运行态
5. 巡检 checkout 自己仍可能暴露：
   - `branch_mismatch`
   - `sha_mismatch`
   - `dirty_worktree`
   这属于 checkout 治理问题，不等于多项目 heartbeat 路由错误

## 4. 当前残留风险

1. `/opt/automation/app/mindsync`
   - 仍存在历史脏改，不能直接恢复为日常 `git pull` 升级模式
2. `/opt/automation/app/mindsync-heartbeat`
   - 也需要进入长期 observe-only checkout 治理
3. 当前多项目 heartbeat 已上线，不代表 observe-only checkout 已治理完成

## 5. 后续 handoff

本轮验证后的下一阶段正式入口切到：

1. [../specs/2026-05-03-observe-only-checkout-治理规格.md](../specs/2026-05-03-observe-only-checkout-治理规格.md)
2. [../tasks/2026-05-03-observe-only-checkout-治理实施计划.md](../tasks/2026-05-03-observe-only-checkout-治理实施计划.md)
3. [../runbooks/2026-05-03-observe-only-checkout-治理-runbook.md](../runbooks/2026-05-03-observe-only-checkout-治理-runbook.md)
