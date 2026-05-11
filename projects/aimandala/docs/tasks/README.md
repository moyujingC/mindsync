# Tasks

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/aimandala/docs/tasks/README.md

这里放 `一镜一梳` 的执行计划、阶段任务和实现任务定义。

规则：

- 任务应明确输入、输出、边界和验收方式
- 不用聊天记录替代正式任务定义
- 实现前应先有对应的 spec 和 QA 依据
- 计划模式产生的关键结论，必须优先落到 `docs/tasks/`，再进入实现

## 当前默认入口

当前与 `Web MVP` 公开首发、双端并行和运行稳定性最相关的任务入口是：

- `2026-05-11-Paperclip-v2026.428.0-升级验证计划.md`
- `2026-05-11-runbook-体系优化实施计划.md`
- `2026-05-05-mvp-国产视觉模型评测实施计划.md`
- `2026-05-03-observe-only-checkout-治理实施计划.md`
- `2026-04-26-历史任务全量关闭与新基线切换实施计划.md`
- `2026-04-22-local-mac-automatic-execution-host-plan.md`
- `2026-04-21-local-mac-execution-host-pilot-plan.md`
- `2026-04-19-server-automation-blocking-sample-interpretation-plan.md`
- `2026-04-19-server-automation-task-template-semantics-repair-plan.md`
- `2026-04-19-server-automation-workspace-materialization-diagnosis-plan.md`
- `2026-04-19-paperclip-native-execution-routing-plan.md`
- `2026-04-16-mvp-上线前质量收口总任务草案.md`
- `2026-04-16-ci-cd-临时运营口径-runbook.md`
- `2026-04-14-mvp-公开首发收口与小程序渐进并入实施计划.md`
- `2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束实施计划.md`
- `2026-04-13-miniapp-gray-checklist.md`
- `2026-04-13-miniapp-gray-config-manifest.md`
- `2026-04-13-paperclip-automation-节点实施计划.md`
- `2026-04-12-ci-cd-实施计划.md`
- `2026-04-12-v22-knowledge-workbench-execution-plan.md`

说明：

- `2026-05-11-Paperclip-v2026.428.0-升级验证计划.md` 是当前 Paperclip 从 `v2026.416.0` 已验证基线推进到 `v2026.428.0` 推荐目标版本的正式验证入口，固定先验证版本、migration、execution workspace、执行路由和 adapter 基本链路，再决定是否升级运行实例。
- `2026-05-11-runbook-体系优化实施计划.md` 是当前 runbook 入口、历史参考和控制层映射收口的正式任务入口，固定先解决“该看哪份 runbook、哪份只是历史、哪些规则已经下沉成 gate / guard”，再进入单篇 runbook 或脚本整改。
- `2026-05-05-mvp-国产视觉模型评测实施计划.md` 是当前 DeepSeek V4 文字模型决策后的视觉模型选型任务入口，固定先用脱敏 fixture 比较国产视觉模型，再决定 `AIMANDALA_LLM_VISION_MODEL`。
- `2026-05-03-observe-only-checkout-治理实施计划.md` 是当前 automation 节点主镜像区与巡检区治理的正式实施入口，固定先盘点、再归类、再决定转正 / 备份 / 重建 / 定点覆盖，并把 checkout 脏状态上升为升级阻断条件。
- `2026-04-26-历史任务全量关闭与新基线切换实施计划.md` 是当前控制面任务面重置的正式实施入口，固定把 `2026-04-26 00:00 Asia/Shanghai` 之前的历史普通任务与历史 automation 任务都视为旧窗口对象，默认全量关闭，只保留极少数显式例外，并把后续第一主线固定为普通任务先在本地 Mac 自动执行。
- `2026-04-22-local-mac-automatic-execution-host-plan.md` 是当前普通任务自动在本地 Mac 上跑的正式实施入口，固定落本地执行器、launchd、runbook 与 verification，不把服务器 heartbeat 重新拉回普通任务主链。
- `2026-04-21-local-mac-execution-host-pilot-plan.md` 是当前普通任务接入本地 Mac 执行节点的单机试点正式入口，固定只服务你当前这台 Mac，先收 control plane 与 execution host 的宿主语义、连接合同和最小回写合同，不直接扩成多机方案。
- `2026-04-19-server-automation-blocking-sample-interpretation-plan.md` 是当前 automation 远端样本解释的正式实施入口，固定以 `35 / 8 / 3` 为当前基线，先收“历史活跃样本 / 真实运行链缺口 / 历史 done 漂移 / 本地任务后续错误绑定”的解释模型，不直接进入整改。
- `2026-04-19-server-automation-task-template-semantics-repair-plan.md` 是当前 automation 模板语义修复的正式实施入口，固定只改 `paperclip-sync-lib` 模板生成层，不扩张到 heartbeat / diagnosis / 运行态补救。
- `2026-04-19-server-automation-workspace-materialization-diagnosis-plan.md` 是当前 automation heartbeat 诊断分桶的前置入口；它负责“先分桶”，但当前默认主目标已切到样本解释层，而不是直接从 diagnosis 跳到整改。
- `2026-04-19-paperclip-native-execution-routing-plan.md` 是当前 execution routing 的正式任务入口，专门收口“按 Paperclip 原生模型重建双执行宿主机口径”，不进入实现。
- `2026-04-16` 这份草案承接 `MIN-80` 的前置澄清结果，适合作为 CEO 收成正式总任务的当前补充入口。
- `2026-04-16-ci-cd-临时运营口径-runbook.md` 适用于 Paperclip workflow 面板尚未更新前的值班与巡检口径。
- `2026-04-14` 与 `2026-04-15 batch E` 仍是 Web 首发与 miniapp live-ready 的正式主入口
- `2026-04-13` 系列已并入 `main`，但默认灰度关闭；当前只作为 miniapp native gray 联调参考，不作为 Web 默认放行门

补充边界：

- `2026-04-10-服务器部署与运维手册.md`
  - 当前保留在 `docs/tasks/`，但语义上更接近 runbook-like 运维手册
  - 默认应从 `docs/runbooks/README.md` 跳转进入，而不是把它当普通任务计划阅读
- `aimandala-pr-质量门-runbook.md`
  - 当前保留在 `docs/tasks/`，但语义上更接近 delivery runbook
  - 默认也应从 `docs/runbooks/README.md` 进入

当前已沉淀：

- `2026-05-11-Paperclip-v2026.428.0-升级验证计划.md`
- `2026-05-05-mvp-国产视觉模型评测实施计划.md`
- `2026-04-26-历史任务全量关闭与新基线切换实施计划.md`
- `2026-04-21-local-mac-execution-host-pilot-plan.md`
- `2026-04-19-server-automation-blocking-sample-interpretation-plan.md`
- `2026-04-19-server-automation-task-template-semantics-repair-plan.md`
- `2026-04-19-server-automation-workspace-materialization-diagnosis-plan.md`
- `2026-04-19-paperclip-native-execution-routing-plan.md`
- `2026-04-16-mvp-上线前质量收口总任务草案.md`
- `2026-04-14-mvp-公开首发收口与小程序渐进并入实施计划.md`
- `2026-04-14-miniapp-batch-a-shared-foundation-audit.md`
- `2026-04-14-batch-b-历史记录详情与显式报告类型实施计划.md`
- `2026-04-15-miniapp-batch-c-静态壳与页面闭环实施计划.md`
- `2026-04-15-miniapp-batch-d-api-contract-stub-only-实施计划.md`
- `2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束实施计划.md`
- `2026-04-13-miniapp-gray-checklist.md`
- `2026-04-13-miniapp-gray-config-manifest.md`
- `2026-04-13-miniapp-native-gray-execution-plan.md`
- `2026-04-13-miniapp-wechatpay-live-execution-plan.md`
- `2026-04-04-首批迁移清单.md`
- `2026-04-04-迁移剩余主功能清单.md`
- `2026-04-05-ui-restart-plan.md`
- `2026-04-05-腾讯云部署环境模板.md`
- `2026-04-07-架构质量整改清单.md`
- `2026-04-10-服务器部署与运维手册.md`
- `2026-04-11-v21-knowledge-remaining-execution-plan.md`
- `2026-04-12-迁移收官与正式版收口总计划.md`
- `2026-04-12-v22-knowledge-workbench-execution-plan.md`

其中带“迁移”字样的阶段文档已转入历史参考口径，不再作为默认任务入口。
execution routing 旧 phase 1 / phase 2 文档链也已转入历史参考口径，不再作为默认任务入口。
