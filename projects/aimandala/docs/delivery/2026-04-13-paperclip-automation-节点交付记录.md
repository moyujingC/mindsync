# Aimandala Paperclip Automation 节点交付记录

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-13-paperclip-automation-节点交付记录.md
> 项目：aimandala
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-13-paperclip-automation-节点实施计划.md
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-13-paperclip-automation-节点验证记录.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮交付内容

### 1.1 automation 节点部署骨架

新增：

- `projects/aimandala/deploy/paperclip-automation/README.md`
- `docker-compose.paperclip.yml.example`
- `paperclip-automation.env.example`
- `paperclip-heartbeat.env.example`
- `automation-maintenance.env.example`
- `paperclip-automation.service.example`

### 1.2 定时任务与清理

新增：

- `paperclip-heartbeat.service.example`
- `paperclip-heartbeat.timer.example`
- `automation-maintenance.service.example`
- `automation-maintenance.timer.example`
- `shared/tools/ci/automation-node-maintenance.sh`

### 1.3 文档收口

同步更新：

- `projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md`
- `projects/aimandala/deploy/github-runner/README.md`
- `projects/aimandala/PROJECT.md`

## 2. 当前结果

截至本轮，新增的 `4C4G40G` 腾讯云机器已经在仓库文档中被正式定义为：

- `automation` 节点
- Paperclip 私有工作台宿主机
- 单 runner 串行执行宿主机

并且已经具备：

- Paperclip Docker 常驻模板
- heartbeat / maintenance 的 systemd timer 模板
- automation 节点的日常清理脚本
- 三台机分工明确的 ops runbook
- runner-doctor 与 Paperclip 执行健康巡检入口

## 3. 未完成但已留好入口

1. 真机 clone `paperclip` 仓库
2. 真机配置 `/etc/default/paperclip-automation`
3. 真机配置 `/etc/default/paperclip-heartbeat`
4. 真机配置 `/etc/default/automation-maintenance`
5. 真机启动 Paperclip / heartbeat / maintenance service
6. 真机注册 GitHub runner
7. 真机导入或同步公司 / 项目配置到 Paperclip 运行时
8. 真机验证 `runner-doctor.sh --strict`
9. 真机验证 heartbeat timer 会同时执行 runner 巡检与执行健康巡检

## 3.1 上线完成定义

只有同时满足下面条件，才算 automation 节点真正上线：

1. `mindsync-ci` runner 已注册完成且 labels 正确
2. `paperclip-heartbeat.service / timer` 在线
3. heartbeat 使用的 GitHub token 已通过 runner 读取权限验证
4. `runner-doctor.sh --strict` 通过
5. 至少一条真实 workflow 已被该 runner 拾取并完成

## 4. 当前残留风险

1. 当前仅完成仓库侧落地，尚未真实上线到新节点
2. heartbeat 若仍运行在同一台机器上，不能覆盖整机宕机
3. `40G` 磁盘足够第一阶段，但需要坚持 cache / log 清理纪律
