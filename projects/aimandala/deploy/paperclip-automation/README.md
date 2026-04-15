# Aimandala Paperclip Automation 节点

> 状态：current
> 版本：0.1.3
> owner：Engineer
> last_updated：2026-04-15
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
/opt/automation/app/mindsync-heartbeat
/opt/automation/worktrees
/opt/paperclip/app/paperclip
/opt/mindsync-ci/actions-runner
/data/paperclip
```

说明：

- `/opt/automation/app/mindsync`
  - 主镜像区
  - 只作为权威镜像、共享脚本源、运维排障参考
  - 默认不再让 agent 直接在这里长期写入
- `/opt/automation/app/mindsync-heartbeat`
  - 巡检区
  - 只用于 heartbeat、runner-doctor、maintenance、执行健康巡检
  - 默认要求始终对齐 `origin/main` 且保持干净
- `/opt/automation/worktrees`
  - 隔离执行区
  - 用于 `codex_local`、`claude_local`、`pi_local`、auto-repair 等会真实写文件的执行任务
- `paperclip` 仓库用于构建 Docker 镜像
- `/data/paperclip` 作为 Paperclip 单机持久化目录
- `mindsync` 仓库的 `origin` 应统一使用 GitHub SSH：
  - `git@github.com:moyujingC/mindsync.git`

### 2.1 工作区边界原则

当前 automation 节点必须遵守下面三条边界：

1. heartbeat / maintenance / runner-doctor 不再使用主镜像区作为 `WorkingDirectory`
2. 普通 agent 不应把正式改动直接写回 `/opt/automation/app/mindsync`
3. 会写文件的执行任务必须进入 `/opt/automation/worktrees/<issue-or-run>/...` 这类隔离目录

这条边界的目标不是把 agent 全部降成只读，而是避免多个执行链长期共享同一个可写 checkout。

补充治理口径：

1. agent 的执行工作目录由 `project / issue` 级 execution workspace policy 决定，不由 adapter 单独决定
2. local adapter 只负责消费 Paperclip 注入的最终 `cwd`、`paperclipWorkspace` 与相关环境变量
3. agent 配置中的固定 `cwd` 只保留为 legacy fallback 或非项目任务兜底
4. 对 `aimandala` 项目，默认应通过 project policy 把普通工程任务落到 `git_worktree` 隔离目录

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

## 3.1 automation 节点登录口径

默认主路径：

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes ubuntu@150.158.9.95
```

说明：

- 公网 SSH key 是 automation 节点默认主入口
- 若该入口失效，应视为运维 bug 并立即修复
- Tailscale SSH 只作为人工协同兜底

## 4. Paperclip 部署方式

第一阶段默认走：

- Docker
- embedded PostgreSQL
- local disk
- private authenticated access

关键要求：

1. 容器必须挂载 `mindsync` 仓库目录
2. 挂载路径应保持与宿主机一致，避免 Paperclip 为 agent 解析出的执行工作目录在容器内失效
3. `OPENAI_API_KEY` 至少要能在容器里使用，供 `codex_local` 执行 auto-fix
4. 若 `CEO` 使用 `hermes_local`，镜像内必须内置真实 Hermes CLI，而不是临时占位脚本
5. `hermes_local` 第一阶段默认直接复用容器环境中的 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`
6. 当检测到 `OPENAI_BASE_URL` 时，容器启动时应自动为 `~/.hermes/config.yaml` 写入 `provider: main`
7. `BETTER_AUTH_SECRET` 必须配置
8. 如果 automation 节点直连 GitHub / npm / Debian 源很慢，可在 `/etc/default/paperclip-automation` 中配置 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY`，模板已支持同时透传到 Docker build 与容器运行时
   - 当前公司已确认可用的共享代理是阿里云美国节点上的 `tinyproxy`：`47.253.255.110:18888`
   - 标准写法：
     - `HTTP_PROXY=http://47.253.255.110:18888`
     - `HTTPS_PROXY=http://47.253.255.110:18888`
9. `USER_UID` / `USER_GID` 需要与宿主机实际运维用户一致，否则 `/data/paperclip` 等挂载目录可能因为 UID 不匹配而报权限错误
10. 若使用 Docker bridge 网络，优先让容器监听 `lan` / `0.0.0.0`，再通过宿主机的 Tailscale 域名对外访问；`tailnet` 绑定更适合直接跑在宿主机进程上，而不是容器内
11. `paperclip-automation.service` 的日常启动命令不应再附带 `--build`；镜像构建应作为独立运维步骤执行，避免 systemd 长时间卡在 Docker build 阶段导致 `3100` 端口不可用
12. `/data/paperclip` 下的持久化文件应保持为宿主机运维用户可读写；若发现 `/paperclip/instances/default/.env` 为 `root:root 600`，容器内应用会因为 `EACCES` 反复重启
13. automation 宿主机与容器默认统一使用 `Asia/Shanghai`，避免 Paperclip、日志与定时任务时间继续显示为 UTC
14. 若整张 Paperclip 镜像重建过慢，可先采用“宿主机注入 Hermes”方案：在宿主机安装 `/opt/hermes-agent/venv/bin/hermes`，再通过 compose 只读挂载 `/opt/hermes-agent:/opt/hermes-agent` 并为容器补齐 `PATH`
15. “宿主机注入 Hermes”只适用于 `hermes_local` 这类本地 CLI 依赖；它不是临时假命令，仍然必须是可实际执行任务的真实 Hermes 安装

当前推荐角色口径：

- `CEO`: `hermes_local`
- `Idea Clarifier`: `pi_local` 主链路，`claude_local` 兜底链路
- `Engineer`: `codex_local`
- `Test / QA`: `codex_local`

### 4.0 execution workspace 默认策略

`aimandala` 在 Paperclip 运行时的默认策略应固定为：

- `executionWorkspacePolicy.enabled = true`
- `executionWorkspacePolicy.defaultMode = isolated_workspace`
- `executionWorkspacePolicy.allowIssueOverride = true`
- `executionWorkspacePolicy.defaultProjectWorkspaceId = aimandala-monorepo primary workspace`
- `executionWorkspacePolicy.workspaceStrategy.type = git_worktree`
- `executionWorkspacePolicy.workspaceStrategy.baseRef = main`
- `executionWorkspacePolicy.workspaceStrategy.branchTemplate = {{issue.identifier}}-{{slug}}`
- `executionWorkspacePolicy.workspaceStrategy.worktreeParentDir = /opt/automation/worktrees`

解释：

- `project` 负责给新 issue 提供默认执行工作区模式
- `issue` 负责决定本次任务是沿用默认隔离目录，还是显式复用 / 改成 shared
- `agent` 只在最终解析出的 execution workspace 中运行
- `adapter` 不再被当作工作目录治理边界本体

## 4.2 `hermes_local` 宿主机注入方案

当 `CEO` 已切到 `hermes_local`，但 Paperclip Docker 镜像重建耗时过长时，第一阶段允许先走宿主机注入方案，让任务尽快真正可跑。

推荐宿主机安装位置：

```bash
/opt/hermes-agent/venv/bin/hermes
```

最小落地方式：

1. 在 automation 宿主机创建 Python venv，例如 `/opt/hermes-agent/venv`
2. 在该 venv 中安装真实 Hermes Agent，而不是占位脚本
3. 在 `docker-compose.paperclip.yml` 中挂载：
   - `/opt/hermes-agent:/opt/hermes-agent:ro`
   - `/opt/hermes-agent/venv/bin/hermes:/usr/local/bin/hermes:ro`
4. 在容器环境中补齐：
   - `PATH=/opt/hermes-agent/venv/bin:...`
5. 保持 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL` 继续通过 `/etc/default/paperclip-automation` 注入容器

说明：

- 某些基础镜像或运行时会覆盖 compose 中注入的 `PATH`
- 因此第一阶段推荐同时把宿主机 Hermes 可执行文件直接挂到容器内的 `/usr/local/bin/hermes`
- 这样即使 `PATH` 回退到系统默认值，`hermes_local` 仍然能找到真实 CLI

通过口径：

```bash
docker exec paperclip-automation-paperclip-1 sh -lc 'command -v hermes && hermes --version'
```

如果这一步通过，再去 Paperclip 的 Agent Configuration 页面执行：

- `CEO -> Test environment`

只有当这两步都通过，才算 `CEO` 真正具备 `hermes_local` 执行能力。

## 4.1 `pi_local` 额外要求

`Idea Clarifier` 当前保留 `pi_local` 作为正式主链路，因此 automation 节点必须把 `pi` 当作正式运行时依赖，而不是临时试验能力。

最小要求：

1. 当前 Paperclip 实际运行在哪里，`pi` 就必须装在哪里
2. 如果 Paperclip 跑在 Docker 容器里，`pi` 必须在容器镜像内可执行，不能只装在宿主机
3. 如果 Paperclip 跑在宿主机 systemd 进程里，`pi` 必须装在同一用户环境，并确保 service `PATH` 可见
4. `Idea Clarifier` 不应再默认改派给 `CEO` 代跑；标准兜底应是 `claude_local`
5. 如果需要借助阿里云美国节点改善访问 OpenAI / npm / Debian 源，只应把它当作当前 automation 宿主的代理 / VPN；不要把 `Idea Clarifier` 或 `pi_local` 迁移到阿里云机器执行
6. 当前默认共享代理就是阿里云美国机上的 `tinyproxy`：
   - `HTTP_PROXY=http://47.253.255.110:18888`
   - `HTTPS_PROXY=http://47.253.255.110:18888`
7. `Idea Clarifier` 当前已验证通过的运行时口径为：
   - `model = volcengine-coding-plan/Doubao-Seed-2.0-pro`
   - `HOME=/paperclip`
   - `pi` 通过 `/paperclip/.pi/agent/models.json` 中的自定义 provider 访问火山
8. 不要把 `Idea Clarifier` 直接配置成 `openai/Doubao-Seed-2.0-pro`
   - `pi` 内置 `openai` provider 默认走 `openai-responses`
   - 当前火山 `https://ark.cn-beijing.volces.com/api/coding/v3` 实测兼容的是 `chat/completions`
   - 因此必须固定走自定义 `openai-completions` provider

最小检查：

```bash
which pi
pi --version
HOME=/paperclip pi --list-models | rg 'volcengine-coding-plan|Doubao-Seed-2.0-pro'
```

同时应在 Paperclip 的 Agent Configuration 页面执行：

- `Idea Clarifier -> Test environment`

通过口径：

1. `which pi` 能返回真实可执行路径
2. `pi --version` 或等价健康检查成功
3. `HOME=/paperclip pi --list-models` 能看到 `volcengine-coding-plan/Doubao-Seed-2.0-pro`
4. `Test environment` 通过

如果这四项任一失败：

- 不应把问题理解为“用户电脑没装 pi”
- 应先按“automation 服务器当前实际执行环境缺失 `pi`”排障
- 运行时应自动回退到 `claude_local`，避免澄清任务直接卡死

## 4.3 tinyproxy 标准口径

当前公司已验证可用的国际出网代理为：

- 宿主：阿里云美国节点 `47.253.255.110`
- 服务：`tinyproxy`
- 端口：`18888`

标准环境变量：

```bash
HTTP_PROXY=http://47.253.255.110:18888
HTTPS_PROXY=http://47.253.255.110:18888
NO_PROXY=127.0.0.1,localhost,vm-0-11-opencloudos.tail176582.ts.net
```

说明：

- `automation`、`main`、`release` 这些国内节点如需访问 `GitHub`、`PyPI`、`npm`、`Debian` 源，优先复用这个 Team Proxy
- 它是“公司级共享出网能力”，不是某次临时排障技巧
- 若代理不可用，应先检查美国机上的 `tinyproxy`，而不是直接把问题归咎于目标站点

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

同时，heartbeat timer 现在还应补一层执行健康巡检：

- `check-paperclip-execution-health.mjs`
  - 用于发现 `activeRun=running` 但长期没有评论或状态回写的疑似卡住任务
  - 默认把这类任务转为 `blocked`，并回写标准化说明

人工排障统一先跑：

```bash
sudo bash -lc '
  cd /opt/automation/app/mindsync-heartbeat &&
  bash shared/tools/ci/runner-doctor.sh \
    --env-file /etc/default/paperclip-heartbeat \
    --strict
'
```

说明：

- `runner-doctor.sh` 默认只读取当前 shell 环境，不会自动猜测应该加载 `/etc/default/paperclip-automation` 还是 `/etc/default/paperclip-heartbeat`
- 当前 runner heartbeat 的 GitHub / Paperclip 凭证以 `/etc/default/paperclip-heartbeat` 为准
- 若 `runner-doctor.sh` 报 `GITHUB_REPOSITORY and GITHUB_TOKEN are required`，优先检查是否遗漏 `--env-file /etc/default/paperclip-heartbeat`，不要直接把它判断成 runner 故障
- 若诊断持续显示 `expected commit` 与当前 `head` 不一致，或工作树长期 `dirty`，应先按 `workspace_drift` 处理 automation 节点工作区
- 当前固定口径：
  - `paperclip-heartbeat.service`
    - `WorkingDirectory=/opt/automation/app/mindsync-heartbeat`
  - `automation-maintenance.service`
    - `WorkingDirectory=/opt/automation/app/mindsync-heartbeat`
  - `REPO_ROOT=/opt/automation/app/mindsync`
    - 主镜像区，仅用于 worktree 注册和运维参考
  - `HEARTBEAT_REPO_ROOT=/opt/automation/app/mindsync-heartbeat`
    - 巡检区
  - `EXECUTION_WORKTREE_ROOT=/opt/automation/worktrees`
    - 隔离执行区

日常清理由：

- `/Users/xinran/Downloads/dev/mindsync/shared/tools/ci/automation-node-maintenance.sh`

负责，默认处理：

- runner `_temp` 残留
- `npm` / `pip` cache
- `git worktree prune`
- Paperclip 旧日志压缩与过期清理
- 过期隔离 worktree 回收

## 7. 最小上线顺序

推荐按下面顺序落地：

1. 在服务器上 clone `mindsync`
2. 在服务器上 clone `paperclip`
3. 复制 `.example` 文件为真实配置文件：
   - `docker-compose.paperclip.yml.example -> docker-compose.paperclip.yml`
   - `paperclip-automation.env.example -> /etc/default/paperclip-automation`
   - `paperclip-heartbeat.env.example -> /etc/default/paperclip-heartbeat`
   - `automation-maintenance.env.example -> /etc/default/automation-maintenance`
   - 其中 `PAPERCLIP_EXECUTION_HOST` 应显式写成当前 automation 宿主标识，例如 `automation@150.158.9.95`
4. 在宿主机执行 `sudo timedatectl set-timezone Asia/Shanghai`，再用 `timedatectl` 确认系统时区已切到北京时间
5. 启动 Paperclip service
6. 完成私有网络访问与 board claim
7. 注册 `mindsync-ci` runner
8. 启动 heartbeat timer
9. 启动 maintenance timer
10. 回到 GitHub / Paperclip 做联调验收

## 7.1 Comment 执行来源口径

当前 Paperclip 回写 comment 默认要求显式带出执行来源：

- `adapter`
  - 表示哪条服务器端执行链回写了 comment
  - 当前固定命名：
    - `github-actions/self-hosted-runner:ci`
    - `github-actions/self-hosted-runner:deploy`
    - `github-actions/self-hosted-runner:nightly-smoke`
    - `github-actions/self-hosted-runner:auto-repair`
    - `github-actions/self-hosted-runner:runner-heartbeat`
- `host`
  - 表示实际执行宿主
  - 当前建议固定写为 `/etc/default/paperclip-automation` 与 `/etc/default/paperclip-heartbeat` 中的 `PAPERCLIP_EXECUTION_HOST`
  - 推荐值：`automation@150.158.9.95`

如果后续更换 automation 节点，必须同步更新这两个 env 文件中的 `PAPERCLIP_EXECUTION_HOST`，不要只改服务器入口文档。

## 8. 日常启动与更新策略

当前固定采用：

- 启动不构建
- 构建独立执行

推荐命令：

```bash
sudo systemctl start paperclip-automation
sudo systemctl stop paperclip-automation
```

需要更新镜像时，先显式加载 `/etc/default/paperclip-automation`，再手动执行：

```bash
set -a
. /etc/default/paperclip-automation
set +a

docker compose -f docker-compose.paperclip.yml build
docker compose -f docker-compose.paperclip.yml up -d
```

如果容器启动后反复重启，优先检查：

```bash
systemctl status paperclip-automation --no-pager
docker ps
docker logs paperclip-automation-paperclip-1
curl http://127.0.0.1:3100/api/health
sudo chown -R ubuntu:ubuntu /data/paperclip
```
## 9. 最小验收

完成部署后，至少确认：

1. `http://<private-host>:3100/api/health` 返回 `{"status":"ok"}`
2. GitHub 能看到 `mindsync-ci` runner 在线
3. Paperclip 面板能登录并看到公司数据
4. 触发一次 `ci` 后，job 实际落到这台机器执行
5. `check-runner-heartbeat.mjs` 可以本机手动执行成功
6. `runner-doctor.sh --strict` 返回成功，且 labels / token / 最新 workflow 诊断一致
7. `paperclip-heartbeat.timer` 会同时完成 runner 巡检和执行健康巡检
## Automation Node Prerequisites

- 同步 `mindsync` 的 Paperclip skill 恢复脚本前，automation 节点必须安装 `python3`、`ruby`、`curl`。
- `shared/tools/getnote-setup.sh` 与 `shared/tools/sync-paperclip-agent-skills.sh` 都会调用 `ruby` 解析 YAML；缺少 `ruby` 时，服务器无法自恢复 agent skill 绑定。
- 公网 SSH Key 登录后，如需补依赖，优先在节点上执行 `sudo dnf install -y ruby`。
