# QA

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

- [ToC-MVP-产品规范.md](projects/aimandala/docs/specs/ToC-MVP-产品规范.md)
- [ToC-MVP-技术方案.md](projects/aimandala/docs/architecture/ToC-MVP-技术方案.md)
- [本项目 PROJECT.md](projects/aimandala/PROJECT.md)

## 当前阶段性文档

当前默认优先区分两类文档：

- `qa basis`
  - 定义本轮目标行为、质量门和验证矩阵
- `verification record`
  - 记录某一轮已经执行过的自动化、smoke 和人工验收结果

当前优先阅读：

- [2026-05-06-mvp-国产视觉模型评测验证记录.md](projects/aimandala/docs/qa/2026-05-06-mvp-国产视觉模型评测验证记录.md)
- [2026-05-05-mvp-国产视觉模型评测基线.md](projects/aimandala/docs/qa/2026-05-05-mvp-国产视觉模型评测基线.md)
- [2026-05-03-automation-节点多项目-heartbeat-上线验证记录.md](projects/aimandala/docs/qa/2026-05-03-automation-节点多项目-heartbeat-上线验证记录.md)
- [2026-05-03-observe-only-checkout-治理-qa-basis.md](projects/aimandala/docs/qa/2026-05-03-observe-only-checkout-治理-qa-basis.md)
- [2026-05-03-observe-only-checkout-历史残留清理验证记录.md](projects/aimandala/docs/qa/2026-05-03-observe-only-checkout-历史残留清理验证记录.md)
- [2026-04-26-历史任务全量关闭与新基线切换-qa-basis.md](projects/aimandala/docs/qa/2026-04-26-历史任务全量关闭与新基线切换-qa-basis.md)
- [2026-04-22-local-mac-automatic-execution-host-verification.md](projects/aimandala/docs/qa/2026-04-22-local-mac-automatic-execution-host-verification.md)
- [2026-04-22-local-mac-automatic-execution-host-qa-basis.md](projects/aimandala/docs/qa/2026-04-22-local-mac-automatic-execution-host-qa-basis.md)
- [2026-04-22-local-mac-execution-host-pilot-verification.md](projects/aimandala/docs/qa/2026-04-22-local-mac-execution-host-pilot-verification.md)
- [2026-04-21-local-mac-execution-host-pilot-qa-basis.md](projects/aimandala/docs/qa/2026-04-21-local-mac-execution-host-pilot-qa-basis.md)
- [2026-04-19-server-automation-blocking-sample-interpretation-qa-basis.md](projects/aimandala/docs/qa/2026-04-19-server-automation-blocking-sample-interpretation-qa-basis.md)
- [2026-04-19-server-automation-task-template-semantics-repair-qa-basis.md](projects/aimandala/docs/qa/2026-04-19-server-automation-task-template-semantics-repair-qa-basis.md)
- [2026-04-19-server-automation-workspace-materialization-diagnosis-qa-basis.md](projects/aimandala/docs/qa/2026-04-19-server-automation-workspace-materialization-diagnosis-qa-basis.md)
- [2026-04-19-paperclip-native-execution-routing-qa-basis.md](projects/aimandala/docs/qa/2026-04-19-paperclip-native-execution-routing-qa-basis.md)
- [2026-04-16-ceo-hermes-container-runtime-verification.md](projects/aimandala/docs/qa/2026-04-16-ceo-hermes-container-runtime-verification.md)
- [2026-04-14-mvp-公开首发收口与小程序渐进并入验证基线.md](projects/aimandala/docs/qa/2026-04-14-mvp-公开首发收口与小程序渐进并入验证基线.md)
- [2026-04-14-mvp-公开首发收口与小程序渐进并入验证记录.md](projects/aimandala/docs/qa/2026-04-14-mvp-公开首发收口与小程序渐进并入验证记录.md)
- [2026-04-15-min33-human-unblock-verification.md](projects/aimandala/docs/qa/2026-04-15-min33-human-unblock-verification.md)
- [2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束验证基线.md](projects/aimandala/docs/qa/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束验证基线.md)
- [2026-04-13-miniapp-native-gray-verification.md](projects/aimandala/docs/qa/2026-04-13-miniapp-native-gray-verification.md)
- [2026-04-13-miniapp-wechatpay-live-verification.md](projects/aimandala/docs/qa/2026-04-13-miniapp-wechatpay-live-verification.md)
- [2026-04-12-ci-cd-验证记录.md](projects/aimandala/docs/qa/2026-04-12-ci-cd-验证记录.md)

说明：

- `2026-05-06-mvp-国产视觉模型评测验证记录.md` 是当前第一轮国产视觉模型真实 API 评测结果，记录 `qwen-vl-max-latest`、`glm-4v-plus` 与 `Doubao-Seed-1.6-vision` 在 4 个脱敏 fixture 上的结果。
- `2026-05-05-mvp-国产视觉模型评测基线.md` 是当前 MVP 国产视觉模型选型的正式 QA baseline，固定用脱敏 fixture 对候选视觉模型做三圈识别适配评测，不把第三方中转或国外视觉模型列为生产默认候选。
- `2026-05-03-automation-节点多项目-heartbeat-上线验证记录.md` 是当前 automation 节点把单项目 heartbeat 升级为多项目 heartbeat 的正式验证记录，固定记录 `一镜一梳 + RelayHub` 两个 target 的 doctor、systemd 与坏 target 演练结果。
- `2026-05-03-observe-only-checkout-治理-qa-basis.md` 是当前主镜像区与巡检区 observe-only checkout 治理的正式 QA baseline，固定把 checkout 干净性、fail-fast 和升级前分类检查纳入验收口径。
- `2026-05-03-observe-only-checkout-历史残留清理验证记录.md` 是当前 automation 节点真实清理历史 dirty worktree 的正式验证记录，固定保存备份目录、已移除 worktree 名单，以及 `blocked + 归档说明评论` 的任务系统收口结果。
- `2026-04-26-历史任务全量关闭与新基线切换-qa-basis.md` 是当前控制面旧任务重置的正式 QA baseline，固定验证历史普通任务与历史 automation 任务都在默认关闭范围内、例外名单极少且显式、以及新基线后先把普通任务自动在本地 Mac 上跑起来。
- `2026-04-22-local-mac-automatic-execution-host-verification.md` 是当前“普通任务自动在 Mac 上跑”的正式验证入口，明确区分已经落地的本地执行器与 launchd 资产，以及当前 `pi_local` 仍受本机缺少 `pi` 命令约束的真实缺口。
- `2026-04-22-local-mac-automatic-execution-host-qa-basis.md` 是当前普通任务自动本地执行的正式 QA baseline，固定验证自动筛选、自动 claim、摘要排除、每 agent 单并发和 `in_review / blocked` 终态合同。
- `2026-04-22-local-mac-execution-host-pilot-verification.md` 是当前本地 Mac 单机试点的正式前置验证记录，固定说明这轮已经完成的是宿主语义改写、连接基础件确认和 runbook 收口，尚未冒充为真实本地 claim / checkout / 回写 已完成。
- `2026-04-21-local-mac-execution-host-pilot-qa-basis.md` 是当前普通任务接入本地 Mac 执行节点单机试点的正式 QA baseline，固定验证 control plane 与 execution host 宿主语义是否拆开，以及单机 claim / checkout / 执行 / 回写闭环是否已经被完整定义。
- `2026-04-19-server-automation-blocking-sample-interpretation-qa-basis.md` 是当前 automation 远端样本解释的正式 QA baseline，固定以 `35 / 8 / 3` 为当前基线，验证哪些样本属于历史活跃残留、哪些属于真实运行链缺口、哪些属于历史 `done` 漂移和本地任务后续错误绑定。
- `2026-04-19-server-automation-task-template-semantics-repair-qa-basis.md` 是当前 automation 模板语义修复的正式 QA baseline，固定验证 `paperclip-sync-lib` 输出的模板元数据、头部字段与摘要/自动执行边界是否闭合。
- `2026-04-19-server-automation-workspace-materialization-diagnosis-qa-basis.md` 是当前 diagnosis 分桶的前置 QA baseline；它负责确认样本先被正确分桶，但当前默认主目标已切到样本解释层，不直接从 diagnosis 跳到整改。
- `2026-04-19-paperclip-native-execution-routing-qa-basis.md` 是当前 execution routing 的正式 QA baseline，定义了 direct routing（直接路由）模型、服务器 heartbeat 边界与历史方案废弃检查。
- `2026-04-16-ceo-hermes-container-runtime-verification.md` 是当前 `CEO bug` 的正式验证入口，收束了“旧权限截图”与“当前 Hermes 运行时根因”之间的区分。
- `2026-04-14-mvp-公开首发收口与小程序渐进并入验证基线.md` 仍是当前 Web 首发窗口的正式 QA baseline。
- `2026-04-14-mvp-公开首发收口与小程序渐进并入验证记录.md` 是与之配套的当前验证总入口。
- `2026-04-15-min33-human-unblock-verification.md` 是当前 `MIN-33` 转人工清障的验证结论入口，明确说明为何继续保持 `blocked`，且不应因旧本地记录缺失而直接关成 `done`。
- `2026-04-15 batch E` 和 `2026-04-13` gray 系列主要服务 miniapp 渐进并入，不取代 Web 默认质量门。

## 历史资料入口

以下文档主要用于追溯背景，不再作为当前首轮入口：

- [2026-04-19-automation-and-local-execution-routing-phase2-qa-basis.md](projects/aimandala/docs/qa/2026-04-19-automation-and-local-execution-routing-phase2-qa-basis.md)
- [2026-04-18-automation-and-local-execution-routing-qa-basis.md](projects/aimandala/docs/qa/2026-04-18-automation-and-local-execution-routing-qa-basis.md)
- [2026-04-18-automation-routing-and-heartbeat-gate-verification.md](projects/aimandala/docs/qa/2026-04-18-automation-routing-and-heartbeat-gate-verification.md)
- [2026-04-14-miniapp-batch-a-shared-foundation-audit-verification.md](projects/aimandala/docs/qa/2026-04-14-miniapp-batch-a-shared-foundation-audit-verification.md)
- [2026-04-14-batch-b-历史记录详情与显式报告类型验证基线.md](projects/aimandala/docs/qa/2026-04-14-batch-b-历史记录详情与显式报告类型验证基线.md)
- [2026-04-15-miniapp-batch-c-静态壳与页面闭环验证基线.md](projects/aimandala/docs/qa/2026-04-15-miniapp-batch-c-静态壳与页面闭环验证基线.md)
- [2026-04-15-miniapp-batch-d-api-contract-stub-only-验证基线.md](projects/aimandala/docs/qa/2026-04-15-miniapp-batch-d-api-contract-stub-only-验证基线.md)
- [2026-04-12-迁移收官与正式版收口验证记录.md](projects/aimandala/docs/qa/2026-04-12-迁移收官与正式版收口验证记录.md)
- [2026-04-12-v22-knowledge-workbench-verification.md](projects/aimandala/docs/qa/2026-04-12-v22-knowledge-workbench-verification.md)
- [2026-04-13-paperclip-automation-节点验证记录.md](projects/aimandala/docs/qa/2026-04-13-paperclip-automation-节点验证记录.md)
- [2026-04-04-toc-mvp-qa-checklist.md](projects/aimandala/docs/qa/2026-04-04-toc-mvp-qa-checklist.md)
- [2026-04-08-toc-mvp-first-pass-verification.md](projects/aimandala/docs/qa/2026-04-08-toc-mvp-first-pass-verification.md)
- [2026-04-08-toc-mvp-sample-validation.md](projects/aimandala/docs/qa/2026-04-08-toc-mvp-sample-validation.md)

## 默认阅读顺序

1. 先看当前 QA baseline，确认质量门。
2. 再看与之配套的验证记录，确认实际执行结果。
3. 最后按专项主题回看历史验证链。
