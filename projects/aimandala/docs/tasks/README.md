# Tasks

> 状态：current
> 版本：0.1.1
> owner：Engineer
> last_updated：2026-05-31
> source_of_truth：projects/aimandala/docs/tasks/README.md

这里放 `一镜一梳` 的执行计划、阶段任务和实现任务定义。

规则：

- 任务应明确输入、输出、边界和验收方式
- 不用聊天记录替代正式任务定义
- 实现前应先有对应的 spec 和 QA 依据
- 计划模式产生的关键结论，必须优先落到 `docs/tasks/`，再进入实现

## 当前默认入口

当前默认只保留仍会影响本轮工程判断的任务入口；带日期任务文件用于记录阶段计划，不自动等于长期 `current`。

- [2026-06-01-Paperclip-v2026.529.0-升级验证计划.md](./2026-06-01-Paperclip-v2026.529.0-升级验证计划.md)
  - 当前 `Paperclip` 推荐目标版本的正式升级验证入口；用于替代旧的 `v2026.428.0` 验证计划。
- [2026-05-12-MVP-服务器自动写入恢复前置项.md](./2026-05-12-MVP-服务器自动写入恢复前置项.md)
  - 当前服务器自动写仓库冻结后的恢复前置清单；在恢复服务器写入能力前必须先满足。
- [2026-05-11-曼陀罗解读智能体-MVP实施计划.md](./2026-05-11-曼陀罗解读智能体-MVP实施计划.md)
  - 当前报告 followup / 解读智能体相关实现的任务入口；仍处于 draft / task 口径，以最新 spec、QA 与代码状态为准。

## 历史阶段计划

以下文件用于追溯历史窗口、运行治理和专项整改证据链，不再作为当前默认任务入口：

- [2026-05-11-Paperclip-v2026.428.0-升级验证计划.md](./2026-05-11-Paperclip-v2026.428.0-升级验证计划.md)
  - 已被 `v2026.529.0` 升级验证计划替代；仅保留为历史参考。
- [2026-05-11-runbook-体系优化实施计划.md](./2026-05-11-runbook-体系优化实施计划.md)
  - runbook 体系治理阶段计划，后续默认从 [../runbooks/README.md](../runbooks/README.md) 进入长期 runbook 入口。
- [2026-05-05-mvp-国产视觉模型评测实施计划.md](./2026-05-05-mvp-国产视觉模型评测实施计划.md)
  - 国产视觉模型选型评测阶段计划，结论与证据转入 QA / decisions 追溯。
- [2026-05-03-observe-only-checkout-治理实施计划.md](./2026-05-03-observe-only-checkout-治理实施计划.md)
  - observe-only checkout 治理阶段计划，长期操作口径应从 runbook 进入。
- [2026-04-26-历史任务全量关闭与新基线切换实施计划.md](./2026-04-26-历史任务全量关闭与新基线切换实施计划.md)
- [2026-04-22-local-mac-automatic-execution-host-plan.md](./2026-04-22-local-mac-automatic-execution-host-plan.md)
- [2026-04-21-local-mac-execution-host-pilot-plan.md](./2026-04-21-local-mac-execution-host-pilot-plan.md)
- [2026-04-19-server-automation-blocking-sample-interpretation-plan.md](./2026-04-19-server-automation-blocking-sample-interpretation-plan.md)
- [2026-04-19-server-automation-task-template-semantics-repair-plan.md](./2026-04-19-server-automation-task-template-semantics-repair-plan.md)
- [2026-04-19-server-automation-workspace-materialization-diagnosis-plan.md](./2026-04-19-server-automation-workspace-materialization-diagnosis-plan.md)
- [2026-04-19-paperclip-native-execution-routing-plan.md](./2026-04-19-paperclip-native-execution-routing-plan.md)
- 2026-04-16-mvp-上线前质量收口总任务草案.md
- 2026-04-16-ci-cd-临时运营口径-runbook.md
- 2026-04-14-mvp-公开首发收口与小程序渐进并入实施计划.md
- 2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束实施计划.md
- 2026-04-13-miniapp-gray-checklist.md
- 2026-04-13-miniapp-gray-config-manifest.md
- 2026-04-13-paperclip-automation-节点实施计划.md
- 2026-04-12-ci-cd-实施计划.md
- 2026-04-12-v22-knowledge-workbench-execution-plan.md

说明：

- `docs/tasks/` 只承接执行计划和阶段任务；若某份文件已经沉淀为长期操作手册，应从 `docs/runbooks/` 或对应 README 进入。
- 历史阶段计划只用于追溯当时的输入、边界和验收方式，不再被默认解释为当前执行指令。

补充边界：

- 已沉淀为长期操作手册的 runbook 默认从 [../runbooks/README.md](../runbooks/README.md) 进入，不再保留在 `docs/tasks/` 作为当前任务入口。

历史阶段计划清单已由本目录文件本身和 git 历史承接；默认不要从 README 展开长串日期文件。需要追溯旧窗口时，可按主题在本目录中查找对应日期计划。

其中带“迁移”字样的阶段文档已转入历史参考口径，不再作为默认任务入口。
execution routing 旧 phase 1 / phase 2 文档链也已转入历史参考口径，不再作为默认任务入口。