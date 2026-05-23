# Runbooks

> 状态：current
> 版本：0.2.0
> owner：Engineer
> last_updated：2026-05-23
> source_of_truth：projects/aimandala/docs/runbooks/README.md

这里放 `一镜一梳 / aimandala` 的运行说明、联调手册和操作型 runbook。

这里也是当前唯一默认 runbook 入口。

它回答的问题是：

- 本地怎么跑
- 前后端怎么接
- 联调时先看什么
- 线上运维和质量门如何执行

## 1. 适合放在这里的内容

- 本地联调手册
- 开发环境启动说明
- 运维 runbook
- PR 质量门 runbook
- 发布与排障操作手册

## 2. 不适合放在这里的内容

- 功能定义
- 架构边界
- 一次性整改计划
- 验收结论

这些内容应分别留在：

- `../specs/`
- `../architecture/`
- `../tasks/`
- `../qa/`

## 3. Runbook 类型

当前入口固定区分三类：

1. 入口页 / index
   - 用于导航，不单独承载完整操作合同
2. manual runbook
   - 用于人工执行步骤、判断树、禁止动作和升级路径
3. control-backed runbook
   - 除了手册本身，还明确映射到脚本、gate、guard、finalizer 或 health check
   - 其中一部分规则已经由程序强制执行

## 4. 当前正式入口

### 4.1 入口页

1. [开发与联调总入口.md](./开发与联调总入口.md)
2. [本地联调手册.md](./本地联调手册.md)

### 4.2 当前 manual runbooks

1. [历史任务批量关闭-runbook.md](./历史任务批量关闭-runbook.md)
2. [2026-05-03-automation-节点多项目-heartbeat-上线-runbook.md](./2026-05-03-automation-节点多项目-heartbeat-上线-runbook.md)
3. [兑换码与付费最小闭环-runbook.md](./兑换码与付费最小闭环-runbook.md)

### 4.3 当前 control-backed runbooks

1. [2026-05-03-observe-only-checkout-治理-runbook.md](./2026-05-03-observe-only-checkout-治理-runbook.md)
2. [本地-Mac-自动执行器-runbook.md](./本地-Mac-自动执行器-runbook.md)

### 4.4 control-backed runbook-like 交付手册

下面两份目前仍保留在 `docs/tasks/`，但语义上更接近 runbook-like 操作手册，而不是任务计划：

1. [2026-04-10-服务器部署与运维手册.md](../tasks/2026-04-10-服务器部署与运维手册.md)
2. [aimandala-pr-质量门-runbook.md](../tasks/aimandala-pr-质量门-runbook.md)

其中 `aimandala-pr-质量门-runbook.md` 应按 control-backed runbook-like delivery manual 阅读：

1. 当前 MVP 主链控制层入口是 `.github/workflows/mvp-ci.yml`
2. 增强链路控制层入口是 `.github/workflows/aimandala-ci.yml`
3. Paperclip CI 失败建单入口是 `shared/tools/ci/paperclip-ci-issue.mjs`
4. 当前日常判断 MVP 是否可用时，优先看 `mvp-ci`，不要把增强链路误写成唯一主路径

## 5. 历史参考入口

下面这些文件保留为历史参考，不再作为当前默认主入口：

1. [本地-Mac-执行节点单机试点-runbook.md](./本地-Mac-执行节点单机试点-runbook.md)
2. [本地人工接手-runbook.md](./本地人工接手-runbook.md)
3. [本地人工接手-comment-模板规范.md](./本地人工接手-comment-模板规范.md)
4. [legacy-report-generation-2026-05-10/解读报告生成-runbook.md](../archive/legacy-report-generation-2026-05-10/解读报告生成-runbook.md)

## 6. 控制层映射

当前 `aimandala` 已经存在一部分不再只停留在文档里的控制层约束。读 runbook 时，至少要同步知道这些入口：

1. `shared/tools/ci/server-automation-guard.mjs`
   - 负责服务器写执行前的 cwd / route 约束
2. `shared/tools/ci/server-automation-finalizer.mjs`
   - 负责服务器执行后的 diff 检查、blocked / in_review 收尾
3. `shared/tools/ci/check-paperclip-execution-health.mjs`
   - 负责 execution health 巡检与 strict gate
4. `shared/tools/ci/server-automation-run.sh`
   - 负责把 guard -> 执行 -> finalizer 接成统一服务器执行链

解读报告生成的新控制层正在切到 `mandala_interpretation_agent` 端到端直出原型。当前目标链路看：

1. `projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/agent.py`
   - 负责智能体主运行链路，目标输出 `visual_draft / prompt_pack / final_report / quality_gate`
2. `projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/contracts.py`
   - 负责端到端输入 / 输出合同
3. `projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/prompt_pack_builder.py`
   - 负责构建版本化稳定前缀包，用于 DeepSeek 上下文缓存
4. `projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/quality_gate.py`
   - 负责视觉草稿、最终报告和越界内容的质量门
5. `projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/artifact_store.py`
   - 负责写出审阅用产物
6. `projects/aimandala/toC/app/backend/scripts/run_mandala_e2e_report_fixture.py`
   - 负责端到端直出离线 fixture 运行和真实模型产物落盘

当前文档入口看：

1. [../architecture/解读智能层-曼陀罗解读智能体架构.md](../architecture/解读智能层-曼陀罗解读智能体架构.md)
2. [../specs/2026-05-11-曼陀罗解读智能体-MVP实施规格.md](../specs/2026-05-11-曼陀罗解读智能体-MVP实施规格.md)
3. [../tasks/2026-05-11-曼陀罗解读智能体-MVP实施计划.md](../tasks/2026-05-11-曼陀罗解读智能体-MVP实施计划.md)
4. [../qa/2026-05-11-曼陀罗解读智能体-MVP-QA基线.md](../qa/2026-05-11-曼陀罗解读智能体-MVP-QA基线.md)

这里的正式边界是：

1. runbook 负责说明“应该怎么走流程”
2. control layer 负责把其中关键步骤真正拦住、放行或收尾

如果问题属于：

1. 入口混乱
2. 流程描述不清
3. 当前 / 历史口径混排

先改 runbook。

如果问题属于：

1. 实际执行没有被拦住
2. 路由错误仍能继续跑
3. diff / workspace drift 没被阻断

应优先补脚本、gate 或 guard，而不是只补文档。

## 7. 当前治理判断

历史上 `aimandala` 的 runbook 类内容混在 `tasks/` 和代码 README 中。

当前先建立本目录作为正式入口：

- 新增运行说明优先落到这里
- 历史文档先保留原路径，通过索引收口
- 后续再按需要做目录迁移

当前补充说明：

- `历史任务批量关闭-runbook.md` 是当前控制面旧任务清噪的正式操作入口，固定使用 `done + 历史基线重置 comment` 的统一收口口径，并把后续第一主线明确切到普通任务本地 Mac 自动执行。
- `2026-05-03-automation-节点多项目-heartbeat-上线-runbook.md` 是当前 automation 节点把单项目 heartbeat 升级成多项目 heartbeat 的正式上线手册，固定覆盖备份、doctor、systemd 验证、坏 target 演练与回滚。
- `2026-05-03-observe-only-checkout-治理-runbook.md` 是当前 automation 节点主镜像区与巡检区治理的正式操作入口，固定把 `/opt/automation/app/mindsync` 与 `/opt/automation/app/mindsync-heartbeat` 定义为 observe-only checkout，并要求升级前先检查干净性、先备份再清理历史残留、最后同步 issue 状态。
- `execution routing` 的当前正式入口已转为 `../specs/2026-04-19-paperclip-native-execution-routing-spec.md`、`../tasks/2026-04-19-paperclip-native-execution-routing-plan.md` 与 `../qa/2026-04-19-paperclip-native-execution-routing-qa-basis.md`。
- `本地-Mac-自动执行器-runbook.md` 是当前普通任务自动在本地 Mac 上跑的正式 control-backed runbook，固定映射到 `paperclip-local-executor.mjs`、local env、launchd 和本地锁 / 日志机制；`paperclip-local-pilot.mjs` 退回为人工排障/手动接管工具。
- 旧 `解读报告生成-runbook.md` 已归档到 `../archive/legacy-report-generation-2026-05-10/`。当前报告生成重建以三圈五行方法真值源、解读智能层架构和曼陀罗解读智能体 MVP 文档为入口。
- 当前 heartbeat 剩余 `34` 条活跃 `serverAutomationBlocking` 的下一阶段正式入口，已转为 `../specs/2026-04-19-server-automation-workspace-materialization-diagnosis-spec.md`、`../tasks/2026-04-19-server-automation-workspace-materialization-diagnosis-plan.md` 与 `../qa/2026-04-19-server-automation-workspace-materialization-diagnosis-qa-basis.md`。
- `本地-Mac-执行节点单机试点-runbook.md` 保留为 2026-04-21 单机试点阶段的历史参考，不再作为当前默认入口；当前普通任务本地执行默认看 `本地-Mac-自动执行器-runbook.md`。
- `../qa/2026-04-22-local-mac-execution-host-pilot-verification.md` 是这条单机试点 runbook 当前配套的前置验证记录，明确区分“runbook 与连接合同已经成立”与“真实本地运行闭环仍待执行”。
- `本地人工接手-runbook.md` 与 `本地人工接手-comment-模板规范.md` 保留为旧 phase 2 handoff 模型的历史参考，不再作为当前默认入口。
