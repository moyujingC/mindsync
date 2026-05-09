# Delivery

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-05-10
> source_of_truth：projects/aimandala/docs/delivery/README.md

这里放 `一镜一梳` 当前正式交付记录。

`delivery` 不是实现前置文档，而是实现和验证之后的正式收口产物。

## 当前正式入口

当前只保留以下交付文档：

1. [2026-05-06-mvp-视觉模型默认接入交付记录.md](2026-05-06-mvp-视觉模型默认接入交付记录.md)
2. [2026-05-03-多项目-heartbeat-运行态落地交付记录.md](2026-05-03-多项目-heartbeat-运行态落地交付记录.md)
3. [2026-04-18-automation-and-local-execution-routing-phase1-delivery.md](2026-04-18-automation-and-local-execution-routing-phase1-delivery.md)

分工如下：

- `2026-05-06-mvp-视觉模型默认接入交付记录.md`
  - 收束 MVP 本地 / staging 默认视觉模型接入的最终交付口径、fallback 策略、验证结论和给 staging / release 的 handoff；不等同于生产切换批准
- `2026-05-03-多项目-heartbeat-运行态落地交付记录.md`
  - 收束 automation 节点把单项目 heartbeat 升级为多项目 heartbeat 的真实上线结果、残留风险与后续 checkout 治理 handoff
- `2026-04-18-automation-and-local-execution-routing-phase1-delivery.md`
  - 收束 execution routing phase 1 的历史交付证据；当前 direct routing（直接路由）新模型已由 2026-04-19 之后文档链替代

## 使用规则

- 交付前先确认 [../qa/README.md](../qa/README.md) 中的验证记录已更新
- 交付内容应明确已完成项、未完成项、风险和下一步
- 不再把旧窗口交付链作为默认阅读入口
