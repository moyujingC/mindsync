# Automation Platform 入口

> 状态：current
> 版本：0.1.3
> owner：CEO / Orchestrator, Engineer
> 最后更新：2026-06-01
> source_of_truth：company/projects/Automation/PROJECT.md

这份文档是 `mindsync` 中 `Automation Platform` 的公司级 capability 入口。

它用于收口 `知行工坊` 当前围绕 `Paperclip` 运行时、执行路由、服务器 automation 与普通任务本地执行链形成的共享能力定义。

它不是某个具体项目的 deploy 手册，也不是某一台机器的运维备忘。

## 1. 它是什么

`Automation Platform` 是公司级执行与运维底座。

它当前承接的能力包括：

- `Paperclip` 相关执行路由
- `server_automation` 服务器执行链
- `local_manual_review` 普通任务本地执行链
- execution workspace policy
- heartbeat、maintenance 与执行健康审计

它服务多个项目，但当前首个正式落地样例是：

- [company/projects/一镜一梳/PROJECT.md](../一镜一梳/PROJECT.md)
- [projects/aimandala/PROJECT.md](../../../projects/aimandala/PROJECT.md)

## 2. 它和 Paperclip 的关系

`Paperclip` 更像控制面（control plane，任务控制台/调度面）。

`Automation Platform` 更像执行底座，负责把控制面的执行语义落到真实宿主机、工作区与巡检链路上。

截至 `2026-06-01`，`MindSync` 已将 `Paperclip` 推荐目标版本提升到 `v2026.529.0`。从这一版开始，默认分工也同步收口为：

- `Paperclip`
  - 优先负责 review / dependency（审阅 / 依赖）交互
  - 优先负责 execution workspace lifecycle（执行工作区生命周期）与 finalize（收尾）保证
- `Automation Platform`
  - 保留 route policy（路由策略）
  - 保留 freeze policy（冻结策略）
  - 保留宿主机边界与只读 / 可写执行链约束
  - 保留治理审计与健康巡检

当前默认分层应理解为：

- `Paperclip`
  - 建任务、分派、回写、协作与状态观察
- `Automation Platform`
  - 负责执行分流、宿主机边界、workspace 审计与健康检查
- `MindSync`
  - 负责长期治理文档、项目工作区、实现与交付材料

因此不要把 `Automation Platform` 等同于 `Paperclip` 本身，也不要把某个项目的 automation 节点部署目录当成它的总入口。

## 3. 它和普通任务本地执行链的关系

当前 `Automation Platform` 内部固定区分两条链：

MVP 阶段临时冻结规则：

- 服务器只保留 `Paperclip` control plane（控制面）和必要的只读巡检能力
- 服务器端自动修改仓库、自动修复、自动 finalizer commit（收尾提交）全部暂停
- 产品代码、文档和普通研发修改默认回到本地 Mac 执行
- 若必须在服务器执行 deploy / smoke，只能人工触发，并且必须先确认不会写入 observe-only checkout
- 当前运行态已停用 `paperclip-heartbeat.timer` 与 `automation-maintenance.timer`
- 后续恢复任何服务器写入链路前，必须先完成独立验证与人工确认

### 3.0 MVP 上线判断补充

对接入 `Automation Platform` 的项目，MVP 上线判断默认还应满足：

- 对外交付版本唯一，公开口径不分裂
- 内部预备能力不直接对外开放
- 冻结规则与执行入口的状态描述一致
- 运行时、测试、文档三者对同一上线状态给出相同信号
- 如果系统仍然同时保留“公开上线”和“内部预备”两个口径，必须先收束到一个默认口径

### 3.1 `server_automation`

面向：

- `task_class: automation-execution`
- `execution_route: server_automation`

典型任务：

- CI 失败修复
- deploy / smoke
- runner heartbeat
- infra / maintenance
- 其他明确依赖服务器本地环境、runner、systemd、docker 或服务器凭据的任务

当前主要由 automation 节点承接。

MVP 阶段补充：

- `server_automation` 现在只保留语义分类，不代表允许自动写仓库
- 自动执行包装器应设置 `PAPERCLIP_SERVER_AUTOMATION_FREEZE=1`
- 任何命中 `automation-execution + server_automation` 的真实写执行都应 fail-fast（快速失败）

### 3.2 `local_manual_review`

面向：

- `task_class: manual-review-required`
- `execution_route: local_manual_review`

典型任务：

- 产品功能开发
- UI / 文案
- 一般业务逻辑改动
- 数据结构调整
- 其他需要人工审核的普通研发任务

当前正式宿主是用户当前这台 Mac，由本地执行器承接，不再默认落到 automation 服务器。

MVP 阶段默认补充：

- 当前普通研发任务的公开发布口径仍应由项目级文档定义
- 如果某个产品版本只允许内部预备，不应在任务系统里被描述成已公开上线

普通任务当前正式承载位置不是单独项目，而是三层分布：

- 治理规则层
  - [company/任务类型与标签规范.md](../../../company/任务类型与标签规范.md)
  - [company/任务创建模板.md](../../../company/任务创建模板.md)
  - [company/Paperclip任务系统优化方案.md](../../../company/Paperclip任务系统优化方案.md)
- 运行时映射层
  - [.paperclip.yaml](.paperclip.yaml)
  - [company/服务器与基础设施入口.md](../../../company/服务器与基础设施入口.md)
  - [company/Paperclip-Agent-模型配置总表.md](../../../company/Paperclip-Agent-模型配置总表.md)
- 执行脚本层
  - [shared/tools/paperclip-local-executor.mjs](shared/tools/paperclip-local-executor.mjs)
  - [shared/tools/paperclip-local-pilot.mjs](shared/tools/paperclip-local-pilot.mjs)

补充导航口径：

- 版本基线与升级后最小回归检查
  - 看 [projects/aimandala/deploy/paperclip-automation/README.md](../../../projects/aimandala/deploy/paperclip-automation/README.md)
  - 当前推荐目标版本：`v2026.529.0`
  - 当前最低安全修复线：`v2026.416.0`
  - 当前项目已验证基线：`v2026.416.0`
  - 升级验证任务：应以 `v2026.529.0` 为目标版本，替代旧的 `v2026.428.0` 验证计划
- `codex_local` 的正式安全边界
  - 看 [company/Paperclip-Agent-模型配置总表.md](../../../company/Paperclip-Agent-模型配置总表.md)
  - 与 [company/服务器与基础设施入口.md](../../../company/服务器与基础设施入口.md) 配套阅读
- execution policy 与本地 `review:*` / `task_class` 语义的原则级映射
  - 看 [company/任务审阅与状态流转规范.md](../../../company/任务审阅与状态流转规范.md)
  - 与 [company/任务类型与标签规范.md](../../../company/任务类型与标签规范.md) 配套阅读

当前默认原则：

- `Paperclip` 原生能力优先承接 review 动作、document review（文档审阅）、dependency / finalize 和 workspace lifecycle 主流程
- `MindSync` 本地治理继续定义 `review:*`、`task_class:*`、`execution_route:*` 与冻结边界

## 4. 公司级边界与项目级边界

`Automation Platform` 公司级入口默认只承接：

- 执行与运维能力的定义
- 两条执行链的边界与分流口径
- 相关治理文档、运行时映射文档和项目级 runbook 的总入口

它默认不承接：

- 某个项目的 env、systemd、docker compose 或服务器目录细节
- 某个项目的 branch namespace 细节
- 某个项目的 heartbeat 基线、特定巡检样本与阶段性排障记录

这些内容仍应留在项目级实例文档。

当前首个正式项目级实例是：

- [projects/aimandala/deploy/paperclip-automation/README.md](../../../projects/aimandala/deploy/paperclip-automation/README.md)

这份文档应被理解为：

- `aimandala` 对 `Automation Platform` 的项目级落地
- 不是公司总入口
- 不是 capability 本体定义

## 5. 当前推荐入口

如果你要理解公司级机制，先看：

1. [company/Paperclip任务系统优化方案.md](../../../company/Paperclip任务系统优化方案.md)
2. [company/任务类型与标签规范.md](../../../company/任务类型与标签规范.md)
3. [company/任务创建模板.md](../../../company/任务创建模板.md)
4. [company/服务器与基础设施入口.md](../../../company/服务器与基础设施入口.md)
5. [company/knowledge-base/system/Paperclip-设计机制与使用说明.md](../../../company/knowledge-base/system/Paperclip-设计机制与使用说明.md)
6. [2026-04-27-项目工作区与执行工作区分层-SPEC.md](./2026-04-27-项目工作区与执行工作区分层-SPEC.md)
7. [2026-04-27-项目工作区与执行工作区分层-PLAN.md](./2026-04-27-项目工作区与执行工作区分层-PLAN.md)
8. [2026-04-27-项目工作区与执行工作区分层-QA.md](./2026-04-27-项目工作区与执行工作区分层-QA.md)
9. [2026-04-27-本地执行器优先本地-worktree-IMPLEMENTATION.md](./2026-04-27-本地执行器优先本地-worktree-IMPLEMENTATION.md)

如果你要看当前首个正式落地项目的部署与运维细节，再进入：

1. [company/projects/一镜一梳/PROJECT.md](../../../company/projects/一镜一梳/PROJECT.md)
2. [projects/aimandala/PROJECT.md](../../../projects/aimandala/PROJECT.md)
3. [projects/aimandala/deploy/paperclip-automation/README.md](../../../projects/aimandala/deploy/paperclip-automation/README.md)
