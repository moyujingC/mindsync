# QA

> 状态：current
> 版本：0.2.1
> owner：Test / QA
> last_updated：2026-05-31
> source_of_truth：projects/aimandala/docs/qa/README.md

这里放 `一镜一梳` 当前主链路的验收清单、验证记录与样本验证文档。

当前 QA 目录主要服务一件事：

- 验证新的 `上传 -> 三圈识别 -> Lite / Pro 选择 -> loading -> 结果页` 主链路是否成立

这个目录天然也会保留很多带日期文件，因为验证材料需要保留证据链；
但按治理规则，只有当前正式验收基线才应长期保留 `current`。

## 放什么

- QA baseline
- 验证记录
- 纸面验证与样本验证
- smoke、专项验证、回归检查

## 不放什么

- 长期产品范围定义
- 长期技术方案
- 交付总结
- 当前唯一执行计划

## 当前 canonical 文档

进入本目录前，先对齐这些长期入口：

- [MVP-当前上线口径.md](../specs/MVP-当前上线口径.md)
- [MVP-上线范围与-Go-No-Go-标准.md](../specs/MVP-上线范围与-Go-No-Go-标准.md)
- [ToC-MVP-产品规范.md](../specs/ToC-MVP-产品规范.md)
- [ToC-MVP-技术方案.md](../architecture/ToC-MVP-技术方案.md)
- [本项目 PROJECT.md](../../PROJECT.md)

## 当前阶段性文档

当前阶段性文档默认分三层阅读：

1. 当前正式 QA baseline：当前仍用于判断主链路能否进入下一步的验收基线。
2. 当前窗口验证记录：记录近期实际执行结果，但不自动成为长期质量门。
3. 历史验证链：追溯旧窗口、专项治理、模型评测与运行治理证据。

### 当前正式 QA baseline

- [MVP-主流程验收表.md](./MVP-主流程验收表.md)
- [Lite-Pro-权限与支付验收表.md](./Lite-Pro-权限与支付验收表.md)
- [Lite-Pro-报告内容-Smoke-Test-记录.md](./Lite-Pro-报告内容-Smoke-Test-记录.md)
- [Followup-MVP-验收记录.md](./Followup-MVP-验收记录.md)
- [2026-05-22-财富报告黄金案例集QA基线.md](./2026-05-22-wealth-report-golden-case-baseline.md)

### 当前窗口验证记录

- [2026-05-30-曼曼-report-followup-真实模型-smoke-验证记录.md](./2026-05-30-曼曼-report-followup-真实模型-smoke-验证记录.md)

### 历史验证链

以下文件主要保存专项验证证据，不再作为当前首轮入口：

- [2026-05-11-runbook-体系优化验证记录.md](./2026-05-11-runbook-体系优化验证记录.md)
- [2026-05-11-runbook-体系优化-QA基线.md](./2026-05-11-runbook-体系优化-QA基线.md)
- [2026-05-11-曼陀罗解读智能体-MVP-QA基线.md](./2026-05-11-曼陀罗解读智能体-MVP-QA基线.md)
- [2026-05-06-mvp-视觉模型默认接入QA-Gate-Review.md](./2026-05-06-mvp-视觉模型默认接入QA-Gate-Review.md)
- [2026-05-06-mvp-国产视觉模型评测验证记录.md](./2026-05-06-mvp-国产视觉模型评测验证记录.md)
- [2026-05-05-mvp-国产视觉模型评测基线.md](./2026-05-05-mvp-国产视觉模型评测基线.md)
- [2026-05-03-automation-节点多项目-heartbeat-上线验证记录.md](./2026-05-03-automation-节点多项目-heartbeat-上线验证记录.md)
- [2026-05-03-observe-only-checkout-治理-qa-basis.md](./2026-05-03-observe-only-checkout-治理-qa-basis.md)
- [2026-05-03-observe-only-checkout-历史残留清理验证记录.md](./2026-05-03-observe-only-checkout-历史残留清理验证记录.md)
- [2026-04-26-历史任务全量关闭与新基线切换-qa-basis.md](./2026-04-26-历史任务全量关闭与新基线切换-qa-basis.md)
- [2026-04-22-local-mac-automatic-execution-host-verification.md](./2026-04-22-local-mac-automatic-execution-host-verification.md)
- [2026-04-22-local-mac-automatic-execution-host-qa-basis.md](./2026-04-22-local-mac-automatic-execution-host-qa-basis.md)
- [2026-04-22-local-mac-execution-host-pilot-verification.md](./2026-04-22-local-mac-execution-host-pilot-verification.md)
- [2026-04-21-local-mac-execution-host-pilot-qa-basis.md](./2026-04-21-local-mac-execution-host-pilot-qa-basis.md)
- [2026-04-19-server-automation-blocking-sample-interpretation-qa-basis.md](./2026-04-19-server-automation-blocking-sample-interpretation-qa-basis.md)
- [2026-04-19-server-automation-task-template-semantics-repair-qa-basis.md](./2026-04-19-server-automation-task-template-semantics-repair-qa-basis.md)
- [2026-04-19-server-automation-workspace-materialization-diagnosis-qa-basis.md](./2026-04-19-server-automation-workspace-materialization-diagnosis-qa-basis.md)
- [2026-04-19-paperclip-native-execution-routing-qa-basis.md](./2026-04-19-paperclip-native-execution-routing-qa-basis.md)
- 历史验证文件名：`2026-04-16-ceo-hermes-container-runtime-verification.md`
- 历史验证文件名：`2026-04-14-mvp-公开首发收口与小程序渐进并入验证基线.md`
- 历史验证文件名：`2026-04-14-mvp-公开首发收口与小程序渐进并入验证记录.md`
- 历史验证文件名：`2026-04-15-min33-human-unblock-verification.md`
- 历史验证文件名：`2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束验证基线.md`
- 历史验证文件名：`2026-04-13-miniapp-native-gray-verification.md`
- 历史验证文件名：`2026-04-13-miniapp-wechatpay-live-verification.md`
- 历史验证文件名：`2026-04-12-ci-cd-验证记录.md`

说明：

- 当前正式 QA baseline 以无日期或明确仍承担质量门职责的文档为准。
- 日期验证记录默认只保存证据链；除非 README 明确列入“当前正式 QA baseline”，否则不应被解释为当前放行门。
- 历史验证链可用于追溯当时的执行结果、模型选型和运行治理结论，但不替代最新 spec、代码和当前验收表。

## 历史资料入口

以下文档主要用于追溯背景，不再作为当前首轮入口：

- [legacy-report-generation-2026-05-10](../archive/legacy-report-generation-2026-05-10/)
- [2026-04-19-automation-and-local-execution-routing-phase2-qa-basis.md](./2026-04-19-automation-and-local-execution-routing-phase2-qa-basis.md)
- [2026-04-18-automation-and-local-execution-routing-qa-basis.md](./2026-04-18-automation-and-local-execution-routing-qa-basis.md)
- [2026-04-18-automation-routing-and-heartbeat-gate-verification.md](./2026-04-18-automation-routing-and-heartbeat-gate-verification.md)
- 历史验证文件名：`2026-04-14-miniapp-batch-a-shared-foundation-audit-verification.md`
- 历史验证文件名：`2026-04-14-batch-b-历史记录详情与显式报告类型验证基线.md`
- 历史验证文件名：`2026-04-15-miniapp-batch-c-静态壳与页面闭环验证基线.md`
- 历史验证文件名：`2026-04-15-miniapp-batch-d-api-contract-stub-only-验证基线.md`
- 历史验证文件名：`2026-04-12-迁移收官与正式版收口验证记录.md`
- 历史验证文件名：`2026-04-12-v22-knowledge-workbench-verification.md`
- 历史验证文件名：`2026-04-13-paperclip-automation-节点验证记录.md`
- 历史验证文件名：`2026-04-04-toc-mvp-qa-checklist.md`
- 历史验证文件名：`2026-04-08-toc-mvp-first-pass-verification.md`
- 历史验证文件名：`2026-04-08-toc-mvp-sample-validation.md`

## 默认阅读顺序

1. 先看当前 QA baseline，确认质量门。
2. 再看与之配套的验证记录，确认实际执行结果。
3. 最后按专项主题回看历史验证链。
