# 多项目 Heartbeat 运行态落地交付记录

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-03
> source_of_truth：projects/aimandala/docs/delivery/2026-05-03-多项目-heartbeat-运行态落地交付记录.md
> 项目：aimandala
> 阶段：delivery
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮交付内容

### 1.1 正式 artifact 链

本轮已补齐：

1. Runbook
   - `2026-05-03-automation-节点多项目-heartbeat-上线-runbook.md`
2. Verification
   - `2026-05-03-automation-节点多项目-heartbeat-上线验证记录.md`
3. Delivery
   - 本文档

### 1.2 运行态落地结果

本轮正式收口为：

1. `paperclip-heartbeat.service` 已从单项目切到多项目 heartbeat 编排器
2. `一镜一梳`
   - `aimandala-ci.yml / main`
   已纳入正式 heartbeat
3. `RelayHub`
   - `relayhub-ci-deploy.yml / relayhub/dev`
   已纳入正式 heartbeat
4. 坏 target 演练已证明：
   - 任一 target 失败会让 heartbeat 非零退出
   - 另一个 target 的结果不会被吞掉

## 2. 验证结论

本轮以真实线上结果为准：

1. doctor 成功
2. systemd 成功
3. `journalctl` 日志能看到两个 target 都被检查
4. 坏 target 演练按预期失败并能定位 `RelayHub`
5. 恢复正式配置后再次成功

## 3. 本轮关键治理结论

1. 多项目 heartbeat 已是正式运行态，不再回退到单项目口径
2. `PAPERCLIP_HEARTBEAT_TARGETS_JSON` 必须使用单行 JSON
3. 线上 checkout 不干净时，升级优先走：
   - 备份
   - 定点覆盖
   - doctor
   - systemd 验证
4. 不再默认在脏 checkout 上直接 `git pull`

## 4. 未完成项

本轮明确未做：

1. 未清理 automation 节点主镜像区的历史脏改
2. 未把巡检区治理成长期可持续快进升级状态
3. 未把 observe-only checkout 治理闭环完成

## 5. 当前残留风险

1. `/opt/automation/app/mindsync`
   - 仍不适合作为直接升级入口
2. `/opt/automation/app/mindsync-heartbeat`
   - 仍需纳入长期干净性治理
3. 巡检 checkout 与目标 workflow branch 的差异，仍可能在诊断输出里持续暴露

## 6. 下一阶段 Handoff

本轮后的正式下一阶段是：

`observe-only checkout（只观察 checkout）治理`

默认入口：

1. [../specs/2026-05-03-observe-only-checkout-治理规格.md](../specs/2026-05-03-observe-only-checkout-治理规格.md)
2. [../tasks/2026-05-03-observe-only-checkout-治理实施计划.md](../tasks/2026-05-03-observe-only-checkout-治理实施计划.md)
3. [../qa/2026-05-03-observe-only-checkout-治理-qa-basis.md](../qa/2026-05-03-observe-only-checkout-治理-qa-basis.md)
4. [../runbooks/2026-05-03-observe-only-checkout-治理-runbook.md](../runbooks/2026-05-03-observe-only-checkout-治理-runbook.md)
