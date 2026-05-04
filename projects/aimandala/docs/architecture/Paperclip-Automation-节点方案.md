# Aimandala Paperclip Automation 节点方案

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-13
> source_of_truth：projects/aimandala/docs/architecture/Paperclip-Automation-节点方案.md
> 项目：aimandala
> 阶段：architecture
> depends_on：projects/aimandala/docs/architecture/CI-CD与自动修复架构.md
> depends_on：projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 背景

`2026-04-12` 版本的 CI/CD、nightly smoke、Paperclip 故障路由与 auto-repair 已经在仓库中落地，但当时还没有明确的专用宿主机。

当前新增一台 `4核 / 4G / 40G` 腾讯云服务器后，需要把它正式定义为 `automation` 节点，并把：

- Paperclip 常驻
- self-hosted runner 常驻
- auto-fix 执行
- heartbeat / 清理

收口成一套正式可维护的部署方式。

## 2. 本轮目标

本轮只解决第一阶段自动化宿主机落地：

1. 把新服务器正式定义为 `automation` 节点
2. Paperclip 改为私有常驻工作台，而不是临时本机实例
3. runner、nightly smoke、auto-repair 全部默认落到这台机器
4. 保持日常人工开发继续在本地进行，不强制迁入 Paperclip

## 3. 当前边界

### 3.1 要做

- 新增 `paperclip-automation` 部署 runbook
- 新增 Paperclip Docker + systemd 模板
- 新增 heartbeat / maintenance timer 模板
- 新增 automation 节点清理脚本
- 更新 ops runbook，把服务器分工改成三台机
- 补齐本轮 `spec / task / qa / delivery`

### 3.2 不做

- 不在本轮改成多节点 Paperclip
- 不强制接外部 Postgres / S3
- 不把日常人工开发迁入 Paperclip
- 不在本轮实现整机宕机的外部 watcher

## 4. 设计口径

### 4.1 节点角色

新服务器只承接：

- Paperclip UI/API
- `mindsync-ci` runner
- `ci / deploy / nightly-smoke / auto-repair`
- runner heartbeat 与 maintenance

明确不承接：

- `dev` 业务服务
- `prod` 业务服务
- 前端正式站点
- 后端正式 API

### 4.2 资源策略

这台机器固定按：

- 单 runner
- 串行执行
- 4C4G40G

来设计。

磁盘策略默认要求：

- 至少保留 `12~15G` 空闲空间
- 清理 runner `_temp`
- 清理 `npm/pip` cache
- 执行 `git worktree prune`
- 压缩与清理 Paperclip 旧日志

### 4.3 Paperclip 运行方式

第一阶段默认：

- Docker
- embedded PostgreSQL
- local disk
- `authenticated + private`

容器必须挂载：

- `/data/paperclip`
- `mindsync` 仓库路径

原因是 `codex_local / claude_local` 在容器内执行时，必须能访问仓库工作目录。

### 4.4 面板定位

Paperclip 在这一阶段只作为：

- 状态工作台
- Bug Tracker
- 自动修复结果面板

默认不做：

- 全量成功状态镜像
- 日常编码入口

## 5. 验收口径

1. 新服务器有正式 runbook 和 service/timer 模板
2. Paperclip 能私有常驻，具备最小部署环境模板
3. runner、heartbeat、maintenance 均有正式 systemd 模板
4. 服务器运维手册已经把 `automation` 节点纳入正式分工
