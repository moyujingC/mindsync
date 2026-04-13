# Aimandala Paperclip Automation 节点实施计划

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-13
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-13-paperclip-automation-节点实施计划.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-13-paperclip-automation-节点方案.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮目标

把新增的 `4C4G40G` 腾讯云服务器收口为 `automation` 节点，使其具备第一阶段 Paperclip 自动化宿主机的正式入口。

## 2. 本轮范围

### 2.1 要做

- 新增 `projects/aimandala/deploy/paperclip-automation/`
- 新增 Paperclip service / timer / env 模板
- 新增 automation 节点维护脚本
- 更新 runner runbook
- 更新服务器部署与运维手册
- 更新项目入口必读
- 补齐 `qa / delivery`

### 2.2 不做

- 不直接 SSH 到新机器执行安装
- 不直接在本轮落地 Tailscale
- 不在本轮改 workflow 行为
- 不在本轮引入多 runner 并发

## 3. 任务拆解

### 3.1 部署骨架

- `paperclip-automation/README.md`
- `docker-compose.paperclip.yml.example`
- `paperclip-automation.env.example`
- `paperclip-automation.service.example`

### 3.2 日常运维

- `paperclip-heartbeat.service.example`
- `paperclip-heartbeat.timer.example`
- `automation-maintenance.service.example`
- `automation-maintenance.timer.example`
- `shared/tools/ci/automation-node-maintenance.sh`

### 3.3 文档收口

- 把 `automation` 节点写入服务器手册
- 把本轮 artifact 挂入 `PROJECT.md`
- 更新 runner README 的主推荐宿主机口径

## 4. 完成标准

1. automation 节点 runbook 已可指导下一位工程师落地
2. shell 脚本能通过语法检查
3. compose 模板能通过 YAML 基础解析
4. 服务器手册和项目入口已反映三台机分工
