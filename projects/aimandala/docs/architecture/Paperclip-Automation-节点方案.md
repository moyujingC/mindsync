# Aimandala Paperclip Automation 节点方案

> 状态：current
> 版本：0.2.0
> owner：Engineer
> last_updated：2026-05-17
> source_of_truth：projects/aimandala/docs/architecture/Paperclip-Automation-节点方案.md
> 项目：aimandala
> 阶段：architecture
> depends_on：projects/aimandala/docs/architecture/CI-CD与自动修复架构.md
> depends_on：projects/aimandala/docs/runbooks/2026-05-03-automation-节点多项目-heartbeat-上线-runbook.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 背景

Aimandala 当前已经不再把 Paperclip Automation 节点理解成“临时跑几个脚本的机器”。

它现在承担的是一个受控的自动化宿主角色，主要用于：

- Paperclip 私有运行面板
- self-hosted runner（自托管执行器）
- heartbeat（心跳巡检）
- maintenance（维护清理）
- 部分自动修复和自动化治理链路

这份文档只讲节点角色与系统边界，不替代 runbook。

## 2. 当前仓库里的真实落点

当前相关部署模板已经在仓库中：

1. `projects/aimandala/deploy/paperclip-automation/`
   - Docker、systemd、timer、env 模板
2. `projects/aimandala/deploy/github-runner/`
   - runner service 模板
3. `projects/aimandala/docs/runbooks/`
   - heartbeat、observe-only checkout、本地执行器等操作手册

这说明当前状态已经不是“只有方案，没有落点”，而是“模板已存在，运行治理继续收口中”。

## 3. 节点目标

Automation 节点当前的设计目标有四个：

1. 给 Paperclip 提供私有常驻工作台
2. 给 GitHub workflow 提供固定 self-hosted runner
3. 承接 heartbeat、execution health 和维护任务
4. 保持日常人工开发继续在本地，不把普通编码默认搬到这台节点

## 4. 节点角色边界

### 4.1 当前承接

Automation 节点当前应承接：

1. Paperclip UI / API
2. `mindsync-ci` runner
3. 增强 CI / deploy / nightly smoke / auto-repair
4. heartbeat / maintenance
5. 多项目自动化治理所需的控制脚本执行

### 4.2 当前不承接

Automation 节点当前不应承接：

1. `dev` 业务服务
2. `prod` 业务服务
3. 正式前端站点
4. 正式后端 API
5. 普通人工开发主工作台

通俗说，这台机器更像“自动化值班室”，不是“产品应用服务器”。

## 5. 节点运行结构

### 5.1 Paperclip 运行层

当前设计口径：

- Docker 部署
- 私有访问
- 本地持久化存储
- 当前阶段仍按单节点理解

当前仓库里已有：

- `docker-compose.paperclip.yml`
- `Dockerfile.paperclip-with-hermes`
- `paperclip-automation.service.example`

### 5.2 Runner 运行层

当前设计口径：

- 单 runner
- 串行执行优先
- 先稳定，再考虑并发扩容

当前仓库里已有：

- `deploy/github-runner/mindsync-ci-runner.service.example`

### 5.3 巡检与维护层

当前设计口径：

- heartbeat timer（定时心跳）
- maintenance timer（定时维护）
- checkout 治理
- 磁盘和缓存清理

当前仓库里已有：

- `paperclip-heartbeat.service.example`
- `paperclip-heartbeat.timer.example`
- `automation-maintenance.service.example`
- `automation-maintenance.timer.example`

## 6. 资源与磁盘策略

当前仍按单机轻量自动化宿主设计，不按大规模并发节点设计。

默认资源理解：

- 4C4G40G 一类的小型自动化宿主
- runner 以串行为主
- 优先保证稳定、可恢复、可清理

默认磁盘治理动作包括：

1. 清理 runner `_temp`
2. 清理 `npm` / `pip` cache
3. 执行 `git worktree prune`
4. 清理或压缩旧日志
5. 对 observe-only checkout（只读巡检检出区）做干净性检查

## 7. 与 observe-only checkout 的关系

当前 Automation 节点不只是“跑容器”，还涉及工作区治理。

相关治理已转入正式 runbook：

- [../runbooks/2026-05-03-observe-only-checkout-治理-runbook.md](../runbooks/2026-05-03-observe-only-checkout-治理-runbook.md)

当前架构上要明确两点：

1. 主镜像区和 heartbeat 巡检区应该被看作 observe-only checkout
2. 如果 checkout 已脏，不应继续把它当安全升级目标或稳定执行基线

## 8. 与本地 Mac 执行器的关系

Aimandala 当前不是所有自动执行都回到服务器。

当前已经存在另一条正式路径：

- [../runbooks/本地-Mac-自动执行器-runbook.md](../runbooks/本地-Mac-自动执行器-runbook.md)

这意味着现在有两类宿主：

1. Automation 节点
   - 负责服务器端自动化、runner、heartbeat、巡检
2. 本地 Mac 执行器
   - 负责普通任务的本地自动执行

这两者要分开理解，不能再把所有 execution routing（执行路由）都写成“默认上服务器”。

## 9. 当前已知限制

截至 `2026-05-17`，Automation 节点仍有这些限制：

1. 仍是单节点口径，不是多节点高可用
2. 不默认接外部 Postgres / S3
3. 整机宕机后的外部 watcher 仍不是本轮重点
4. 节点干净性和 heartbeat service 健康，仍是升级或恢复写入前的阻断项

## 10. 当前最重要的判断规则

如果你只想判断“这件事应不应该落到 Automation 节点”，可以看这三条：

1. 如果它是 Paperclip、runner、heartbeat、nightly、auto-repair 一类自动化治理任务
   - 可以落到 Automation 节点
2. 如果它是正式产品服务、开发 API 或日常前端宿主
   - 不该落到 Automation 节点
3. 如果它是普通任务自动执行，但不要求服务器宿主
   - 优先看本地 Mac 执行器链路
