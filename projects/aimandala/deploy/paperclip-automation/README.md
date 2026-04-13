# Aimandala Paperclip Automation 节点

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-13
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/paperclip-automation/README.md
> 项目：aimandala
> 阶段：ops-runbook

本目录用于收口 `aimandala` 第一阶段 `automation` 节点的部署方式。

这台机器的目标不是承接正式业务流量，而是承接：

- Paperclip UI/API
- `mindsync-ci` self-hosted runner
- `ci / deploy / nightly-smoke / auto-repair`
- runner heartbeat 与日常清理

## 1. 当前机器口径

截至 `2026-04-13`，第一阶段默认以新增腾讯云服务器作为 `automation` 节点：

- 规格：`4核 / 4G / 40G`
- 默认策略：单 runner、串行执行
- 访问方式：`authenticated + private`
- 默认只面向你自己的私有网络访问，不公开暴露为正式公网服务

## 2. 推荐目录

推荐在宿主机上固定为：

```bash
/opt/automation/app/mindsync
/opt/paperclip/app/paperclip
/opt/mindsync-ci/actions-runner
/data/paperclip
```

说明：

- `mindsync` 仓库用于 runner、smoke、Paperclip 同步与 auto-fix
- `paperclip` 仓库用于构建 Docker 镜像
- `/data/paperclip` 作为 Paperclip 单机持久化目录

## 3. 部署组件

本目录提供的最小落地材料包括：

- `docker-compose.paperclip.yml.example`
  - Paperclip 容器编排模板
- `paperclip-automation.env.example`
  - systemd / docker compose 环境变量模板
- `paperclip-automation.service.example`
  - Paperclip 常驻服务模板
- `paperclip-heartbeat.service.example`
  - runner heartbeat 同步服务模板
- `paperclip-heartbeat.env.example`
  - heartbeat 环境变量模板
- `paperclip-heartbeat.timer.example`
  - 每 15 分钟触发一次 heartbeat
- `automation-maintenance.service.example`
  - 日常清理服务模板
- `automation-maintenance.env.example`
  - maintenance 环境变量模板
- `automation-maintenance.timer.example`
  - 每日清理计划模板

## 4. Paperclip 部署方式

第一阶段默认走：

- Docker
- embedded PostgreSQL
- local disk
- private authenticated access

关键要求：

1. 容器必须挂载 `mindsync` 仓库目录
2. 挂载路径应保持与宿主机一致，避免 local adapter 找不到工作目录
3. `OPENAI_API_KEY` 至少要能在容器里使用，供 `codex_local` 执行 auto-fix
4. `BETTER_AUTH_SECRET` 必须配置
5. 如果 automation 节点直连 GitHub / npm / Debian 源很慢，可在 `/etc/default/paperclip-automation` 中配置 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY`，模板已支持同时透传到 Docker build 与容器运行时
6. `USER_UID` / `USER_GID` 需要与宿主机实际运维用户一致，否则 `/data/paperclip` 等挂载目录可能因为 UID 不匹配而报权限错误
7. 若使用 Docker bridge 网络，优先让容器监听 `lan` / `0.0.0.0`，再通过宿主机的 Tailscale 域名对外访问；`tailnet` 绑定更适合直接跑在宿主机进程上，而不是容器内

## 5. Runner 角色

第一阶段 runner 固定为：

- 名称：`mindsync-ci`
- 标签：
  - `self-hosted`
  - `linux`
  - `mindsync-ci`
  - `aimandala`

额外约束：

- 单 runner
- 默认串行执行
- 不与正式业务容器混跑
- 不在本机部署 `dev` / `prod` 的业务服务

## 6. Heartbeat 与清理

当前默认仍建议用 `check-runner-heartbeat.mjs` 做 runner 巡检。

第一阶段先接受它运行在同一台 `automation` 节点上，覆盖：

- runner 在线但长时间 `queued`
- 最近成功运行超时

它默认不能覆盖：

- 整台 `automation` 节点完全宕机

因此当前正确理解是：

- 本地 timer 负责大多数异常
- GitHub 上的 `Waiting for a runner` 仍是整机故障的最终兜底信号

日常清理由：

- `/Users/xinran/Downloads/dev/mindsync/shared/tools/ci/automation-node-maintenance.sh`

负责，默认处理：

- runner `_temp` 残留
- `npm` / `pip` cache
- `git worktree prune`
- Paperclip 旧日志压缩与过期清理

## 7. 最小上线顺序

推荐按下面顺序落地：

1. 在服务器上 clone `mindsync`
2. 在服务器上 clone `paperclip`
3. 复制 `.example` 文件为真实配置文件：
   - `docker-compose.paperclip.yml.example -> docker-compose.paperclip.yml`
   - `paperclip-automation.env.example -> /etc/default/paperclip-automation`
   - `paperclip-heartbeat.env.example -> /etc/default/paperclip-heartbeat`
   - `automation-maintenance.env.example -> /etc/default/automation-maintenance`
4. 启动 Paperclip service
5. 完成私有网络访问与 board claim
6. 注册 `mindsync-ci` runner
7. 启动 heartbeat timer
8. 启动 maintenance timer
9. 回到 GitHub / Paperclip 做联调验收

## 8. 最小验收

完成部署后，至少确认：

1. `http://<private-host>:3100/api/health` 返回 `{"status":"ok"}`
2. GitHub 能看到 `mindsync-ci` runner 在线
3. Paperclip 面板能登录并看到公司数据
4. 触发一次 `ci` 后，job 实际落到这台机器执行
5. `check-runner-heartbeat.mjs` 可以本机手动执行成功
