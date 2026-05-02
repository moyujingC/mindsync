# Aimandala Paperclip Automation 节点

> 状态：current
> 版本：0.1.4
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/paperclip-automation/README.md
> 项目：aimandala
> 阶段：ops-runbook

本目录用于收口 `aimandala` 第一阶段 `automation` 节点的部署方式。

它应被理解为：

- `aimandala` 对 [company/projects/Automation/PROJECT.md](/Users/xinran/Downloads/dev/mindsync/company/projects/Automation/PROJECT.md) 的项目级落地
- 当前首个正式项目级实例 runbook
- 不是公司级 `Automation Platform` 的总入口

这台机器的目标不是承接正式业务流量，而是承接：

- Paperclip UI/API
- `mindsync-ci` self-hosted runner
- `ci / deploy / nightly-smoke / auto-repair`
- runner heartbeat 与日常清理

从 `2026-04-18` 起，`aimandala` 额外固定一条执行边界：

- 服务器端只承接 `automation-execution` 任务
- 其他 `manual-review-required` 任务默认回到本地执行
- 服务器自动提交只允许进入 `automation/aimandala/<task-scope>` 固定自动化分支命名空间
- `main` 只能通过人工审核后合并，不接受服务器默认直推

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
  - 用于真正允许服务器写文件的 `automation-execution` 任务
  - 包括 auto-repair、deploy / smoke、maintenance 相关的隔离执行
- `/data/paperclip/instances/default/workspaces`
  - Paperclip 历史兼容工作区目录
  - 只观测，不再作为 `aimandala` 新执行的可信落点
- `paperclip` 仓库用于构建 Docker 镜像
- `/data/paperclip` 作为 Paperclip 单机持久化目录
- `mindsync` 仓库的 `origin` 应统一使用 GitHub SSH：
  - `git@github.com:moyujingC/mindsync.git`

### 2.1 工作区边界原则

当前 automation 节点必须遵守下面三条边界：

1. heartbeat / maintenance / runner-doctor 不再使用主镜像区作为 `WorkingDirectory`
2. 普通 agent 不应把正式改动直接写回 `/opt/automation/app/mindsync`
3. 会写文件的执行任务必须进入 `/opt/automation/worktrees/<issue-or-run>/...` 这类隔离目录
4. 即使项目启用了 `executionWorkspacePolicy`，也不代表所有任务都可在服务器端写入
5. 只有 `task_class: automation-execution` 且 `execution_route: server_automation` 的任务，才允许进入服务器端可写执行链

这条边界的目标不是把 agent 全部降成只读，而是避免多个执行链长期共享同一个可写 checkout。

补充可信信号：

1. 看到 `project.executionWorkspacePolicy.enabled = true` 不代表当前 issue 已真正隔离
2. 对 `一镜一梳`，真正可信的隔离信号是：
   - issue 上已有 `executionWorkspaceId`
   - 或 `currentExecutionWorkspace.id`
   - 且宿主机 `/opt/automation/worktrees` 下存在对应 worktree
3. 如果 issue 已进入 `in_progress / in_review / blocked / done`，但 `executionWorkspaceId = null`
   - 应直接按 `execution_workspace_policy_not_materialized` 处理
   - 不再把它视为“正常但稍后 heartbeat 会补齐”的状态

补充治理口径：

1. agent 的执行工作目录由 `project / issue` 级 execution workspace policy 决定，不由 adapter 单独决定
2. local adapter 只负责消费 Paperclip 注入的最终 `cwd`、`paperclipWorkspace` 与相关环境变量
3. agent 配置中的固定 `cwd` 只保留为 legacy fallback 或非项目任务兜底
4. 对 `aimandala` 项目，默认应通过 project policy 把普通工程任务落到 `git_worktree` 隔离目录

补充分流口径：

1. `automation-execution`
   - CI 失败修复、deploy、smoke、runner、maintenance、infra 巡检
   - 允许服务器端执行和自动提交
2. `manual-review-required`
   - 产品功能开发、UI / 文案、一般业务逻辑、普通研发任务
   - 默认回到本地执行，不允许服务器 Adapter 自动闭环
3. CI 汇总父任务只负责汇总和阻塞路由
   - 不进入服务器端可写执行链
   - 真正允许服务器执行的仅限具体 Automation 子任务

### 2.2 2026-04-17 已确认的失配现象

截至 `2026-04-17`，线上已确认过一类需要单独治理的失配：

1. `一镜一梳` 项目在 Paperclip 运行时里已经配置了：
   - `executionWorkspacePolicy.enabled = true`
   - `defaultMode = isolated_workspace`
   - `workspaceStrategy.type = git_worktree`
   - `worktreeParentDir = /opt/automation/worktrees`
2. 但部分实际 issue 仍表现为：
   - `executionWorkspaceId = null`
   - `currentExecutionWorkspace = null`
   - 同时任务已经进入 `in_progress / in_review / done`
3. 这说明问题不一定是“项目没配 policy”，而更可能是：
   - issue checkout 没真正绑定 execution workspace
   - 某条执行链在消费 project policy 时退回到了 shared / legacy cwd
   - 巡检链路仍在基于主镜像区或 heartbeat 巡检区判断健康

这个现象的危险性在于：

1. 主镜像区 `/opt/automation/app/mindsync` 会继续被真实任务写脏
2. 巡检区 `/opt/automation/app/mindsync-heartbeat` 也可能被误写
3. 面板上虽然显示项目已启用 `isolated_workspace`，但实际执行仍可能没真正隔离

因此今后排查 “automation 工作区又脏了” 时，不要只检查 `project.executionWorkspacePolicy` 是否存在；还必须继续检查 issue 和 execution workspace 的真实绑定状态。

### 2.3 排障最小检查集

出现 “automation 工作区变脏 / heartbeat 基线漂移 / Paperclip 说启用了隔离但仓库还在被写” 时，按下面顺序检查：

1. 检查主镜像区和巡检区是否变脏

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes ubuntu@150.158.9.95 '
  cd /opt/automation/app/mindsync && git status --short
  cd /opt/automation/app/mindsync-heartbeat && git status --short
'
```

2. 检查 `一镜一梳` 项目运行态是否真的开启了隔离策略

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes ubuntu@150.158.9.95 '
  API_KEY=$(sudo awk -F= "/^PAPERCLIP_API_KEY=/{print \$2}" /etc/default/paperclip-heartbeat)
  curl -fsS -H "Authorization: Bearer $API_KEY" \
    http://127.0.0.1:3100/api/companies/be191a6e-7447-4821-a93d-9114214c4a64/projects
'
```

3. 检查问题单是否真正绑定 execution workspace

说明：
- 若项目已启用 `isolated_workspace`
- 但目标 issue 长期是 `executionWorkspaceId = null`
- 同时它又已经有 `checkoutRunId / startedAt / completedAt`
- 应直接判定为 “workspace policy 已配置但未兑现到 issue checkout”

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes ubuntu@150.158.9.95 '
  API_KEY=$(sudo awk -F= "/^PAPERCLIP_API_KEY=/{print \$2}" /etc/default/paperclip-heartbeat)
  curl -fsS -H "Authorization: Bearer $API_KEY" \
    "http://127.0.0.1:3100/api/issues/MIN-102?companyId=be191a6e-7447-4821-a93d-9114214c4a64"
'
```

4. 检查当前 execution workspace 实体是否真的存在

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes ubuntu@150.158.9.95 '
  API_KEY=$(sudo awk -F= "/^PAPERCLIP_API_KEY=/{print \$2}" /etc/default/paperclip-heartbeat)
  curl -fsS -H "Authorization: Bearer $API_KEY" \
    "http://127.0.0.1:3100/api/companies/be191a6e-7447-4821-a93d-9114214c4a64/execution-workspaces?projectId=56826c21-e9c6-408a-804b-039990c90a53"
'
```

5. 再对照宿主机上的真实目录

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes ubuntu@150.158.9.95 '
  git -C /opt/automation/app/mindsync worktree list
  find /opt/automation/worktrees -maxdepth 2 -type d | sort
'
```

如果前 4 步显示项目 policy 已开，但第 5 步没有对应 worktree，或者 issue 仍无 workspace 绑定，就不要再把问题归咎为“忘了配 policy”；应直接按运行时 checkout / adapter 消费链路失配处理。

如果工作区再次变脏，固定按下面顺序排查：

1. 是否有本应 `manual-review-required` 的任务被错误路由到服务器
2. 是否有 `automation-execution` 任务未 materialize 到 execution workspace
3. 是否有 Adapter 在 shared checkout 上执行写操作

### 2.4 运行时治理与 fail-fast 口径

从 `2026-04-17` 起，`mindsync` 侧运维链路按下面口径执行，不依赖 Paperclip 内核兜底：

1. `shared/tools/ci/check-paperclip-execution-health.mjs`
   - 新增稳定原因码：`execution_workspace_policy_not_materialized`
   - 新增稳定原因码：`server_writable_execution_not_allowed`
   - 默认只输出告警和 JSON，不自动修补 issue workspace 绑定
   - 开启 `--strict` 或 `PAPERCLIP_EXECUTION_HEALTH_STRICT=1` 时
   - 只要发现 `policy enabled + 当前活跃的 automation issue + executionWorkspaceId = null`
   - 就返回非零，供 heartbeat / automation gate 直接失败
   - 历史 `done` 漂移样本继续输出到 JSON，但只作为审计证据，不再阻断 heartbeat
2. `shared/tools/ci/audit-paperclip-workspace-materialization.mjs`
   - 只读审计入口
   - 输出：
     - `serverAutomationBlockingIssues`
     - `historicalDoneIssuesMissingWorkspace`
     - `localExecutionRoutingIssues`
     - `executionWorkspacesOutsideExpectedRoot`
     - `hostWorktreesWithoutBoundIssue`
   - 对 `aimandala` 默认以 `/opt/automation/worktrees` 作为期望根目录
3. `shared/tools/ci/automation-node-maintenance.sh`
   - 维护前先检查 `/opt/automation/app/mindsync` 与 `/opt/automation/app/mindsync-heartbeat`
   - 任一 checkout 变脏即直接失败退出，不再静默 `reset --hard` 或自动清理
   - 日常自动清理只允许作用于 `/opt/automation/worktrees`
4. heartbeat / 巡检编排
   - 先跑 runner heartbeat
   - 再跑 execution health check strict gate
   - 若发现当前活跃 Automation issue 的 workspace materialization 漂移，本轮服务直接失败
   - 历史 `done` 漂移只进入审计，不单独阻断 heartbeat
   - 若发现本应本地执行的任务进入了服务器可写路径，只记录为 `localExecutionRoutingIssues`
   - 这类问题属于路由异常审计，不触发服务器代转交，也不单独阻断 heartbeat
   - `--apply` 只继续用于 stale running issue 的看板纠偏，不再作为普通任务 reject / handoff 处理器
   - 不继续后续 maintenance 或会触发写文件的自动动作

当前补充说明：

1. 本阶段“服务器侧去拒绝化”只改变 automation 节点的 health / audit / heartbeat 口径
2. 它不等于“本地执行节点已经真实接管普通任务”
3. 本地执行节点接入与真实回写验证属于下一阶段工作
4. 截至 2026-04-19，heartbeat 继续失败的真实基线已收敛为：
   - `serverAutomationBlocking = 34`
   - `historicalDoneWorkspaceDrift = 8`
   - `localExecutionRouting = 2`
5. 其中 strict gate 当前只由 `serverAutomationBlocking` 驱动；`localExecutionRouting` 继续只审计，不单独阻断 heartbeat
6. 因此下一阶段主任务不是再次调整 gate，而是诊断这 34 条活跃 `server_automation` issue 为什么没有真正 materialize 到 execution workspace

### 2.4.1 2026-04-19 diagnosis phase 基线

从 2026-04-19 起，automation 节点关于 execution workspace materialization 的正式基线固定为：

1. `serverAutomationBlocking = 34`
2. `historicalDoneWorkspaceDrift = 8`
3. `localExecutionRouting = 2`
4. `strictShouldFail` 只由活跃 `serverAutomationBlockingIssues` 驱动

当前阶段的正式目标不是：

1. 批量补绑 `executionWorkspaceId`
2. 批量把 active issue 改状态
3. 再次把 `local_manual_review` 拉回服务器 reject 主链

而是：

1. 先运行 diagnosis CLI，把 34 条 blocking issue 收敛成根因分桶
2. 再按桶级抽样补证据
3. 最后再进入下一轮受控修复计划

### 2.5 推荐巡检命令

```bash
cd /opt/automation/app/mindsync-heartbeat
source /etc/default/paperclip-heartbeat
node shared/tools/ci/check-paperclip-execution-health.mjs \
  --company-id "$PAPERCLIP_COMPANY_ID" \
  --project-name "一镜一梳" \
  --api-base "$PAPERCLIP_API_BASE" \
  --api-key "$PAPERCLIP_API_KEY" \
  --stale-minutes "${PAPERCLIP_EXECUTION_STALE_MINUTES:-15}" \
  --expected-root "${PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT:-/opt/automation/worktrees}" \
  --strict
```

```bash
cd /opt/automation/app/mindsync-heartbeat
source /etc/default/paperclip-heartbeat
node shared/tools/ci/audit-paperclip-workspace-materialization.mjs \
  --company-id "$PAPERCLIP_COMPANY_ID" \
  --project-name "一镜一梳" \
  --api-base "$PAPERCLIP_API_BASE" \
  --api-key "$PAPERCLIP_API_KEY" \
  --expected-root /opt/automation/worktrees \
  --repo-root /opt/automation/app/mindsync
```

当前 diagnosis phase（诊断阶段）推荐补跑：

```bash
cd /opt/automation/app/mindsync-heartbeat
source /etc/default/paperclip-heartbeat
node shared/tools/ci/diagnose-paperclip-server-automation-materialization.mjs \
  --company-id "$PAPERCLIP_COMPANY_ID" \
  --project-name "一镜一梳" \
  --api-base "$PAPERCLIP_API_BASE" \
  --api-key "$PAPERCLIP_API_KEY" \
  --expected-root "${PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT:-/opt/automation/worktrees}" \
  --repo-root /opt/automation/app/mindsync
```

预期：

1. 输出仍显示：
   - `serverAutomationBlockingIssues.length = 34`
   - `historicalDoneWorkspaceDriftIssues.length = 8`
   - `localExecutionRoutingIssues.length = 2`
2. 所有 `serverAutomationBlockingIssues` 都已进入且只进入一个 diagnosis bucket
3. 当前输出可直接作为下一轮修复计划的唯一证据链入口

## 2.7 自动提交边界

`aimandala-auto-repair.mjs` 当前固定遵守下面边界：

1. 自动提交分支只允许使用 `automation/aimandala/<task-scope>` 命名空间
2. 不允许默认直推 `main`
3. 只允许在 `/opt/automation/worktrees` 下创建隔离 worktree
4. 只允许提交白名单范围内的 CI / deploy / 运维相关改动
5. 明确禁止自动提交下列路径：
   - `projects/aimandala/toC/app/backend/data/uploads/**`
   - `projects/aimandala/toC/app/backend/data/interpretations/**`
   - `coverage/**`
   - 普通 shared checkout 漂移文件

### 2.6 主镜像区脏仓收尾口径

如果 `automation-node-maintenance.sh` 因主镜像区或 heartbeat 巡检区变脏而失败，不要直接把所有文件都当成“运行时垃圾”处理；先区分下面两类问题：

1. 运行时写脏
   - 典型信号：
     - 主镜像区出现业务文件被改写
     - `knowledge/builds/current/*` 这类受版本管理的编译产物被改写或删除
     - heartbeat strict gate 同时报出 `execution_workspace_policy_not_materialized`
   - 处理口径：
     - 先保留现场
     - 先跑 execution health strict 与 workspace audit
     - 确认是否存在活动 issue 未真正绑定 execution workspace
2. checkout 基线漂移
   - 典型信号：
     - `git status -sb` 显示 `main...origin/main [behind N]`
     - 本地仓库已受版本管理的文件，在服务器上表现为 `??`
     - 例如 `Dockerfile.paperclip-with-hermes`、`docker-compose.paperclip.yml` 这种“本应被跟踪但服务器基线太旧”的文件
   - 处理口径：
     - 不要把它们当作临时垃圾删除
     - 先确认这些文件已经存在于当前权威仓库，再决定是否更新 checkout 基线

推荐收尾顺序：

```bash
ssh -i /Users/xinran/.ssh/automationKey.pem -o IdentitiesOnly=yes ubuntu@150.158.9.95 '
  cd /opt/automation/app/mindsync &&
  git status -sb &&
  git rev-parse HEAD &&
  git rev-parse origin/main
'
```

1. 如果 checkout 已落后 `origin/main`
   - 先把服务器上的人工修复和新增文档回收到本地 `mindsync`
   - 确认不再有“只存在于服务器、尚未入库”的必要内容
2. 如果仍有受版本管理文件被删除或改写
   - 先判断它是正式资产还是运行时垃圾
   - 像 `toC/data/knowledge/builds/current/index.json` 这类正式编译产物，应先恢复到仓库基线，再继续排查为什么会被执行链写脏
3. 只有在“服务器现场已完成回收、本地权威仓库已有对应内容”之后
   - 才允许做 checkout 收敛
   - 否则 maintenance 的 fail-fast 应继续保留

明确禁止：

1. 在未完成差异回收前，直接对 `/opt/automation/app/mindsync` 或 `/opt/automation/app/mindsync-heartbeat` 执行 `reset --hard` / `clean -fd`
2. 把所有 `??` 文件都视为一次性垃圾
3. 看到项目 policy 已开启，就跳过 issue workspace 绑定检查

本次 `2026-04-17` 的线上排查中，主镜像区同时存在这两类问题：

1. `execution_workspace_policy_not_materialized`
   - 导致活动 issue 没真正落到 `/opt/automation/worktrees`
2. `/opt/automation/app/mindsync` 落后 `origin/main`
   - 导致部分已经进入权威仓库的部署文件，在服务器上被显示成 `??`

因此今后收尾时，必须同时检查“运行时漂移”和“checkout 基线漂移”，不能只盯 dirty worktree 表象。

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
7. 同时必须为 `auxiliary.compression` 写入同一套 `base_url` / `api_key` / `model`
8. 否则 `CEO` 在 Hermes 触发 context compression 时会报：
   - `No auxiliary LLM provider configured`
9. `BETTER_AUTH_SECRET` 必须配置
10. 如果 automation 节点直连 GitHub / npm / Debian 源很慢，可在 `/etc/default/paperclip-automation` 中配置 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY`，模板已支持同时透传到 Docker build 与容器运行时
   - 当前公司已确认可用的共享代理是阿里云美国节点上的 `tinyproxy`：`47.253.255.110:18888`
   - 标准写法：
     - `HTTP_PROXY=http://47.253.255.110:18888`
     - `HTTPS_PROXY=http://47.253.255.110:18888`
11. `USER_UID` / `USER_GID` 需要与宿主机实际运维用户一致，否则 `/data/paperclip` 等挂载目录可能因为 UID 不匹配而报权限错误
12. 若使用 Docker bridge 网络，优先让容器监听 `lan` / `0.0.0.0`，再通过宿主机的 Tailscale 域名对外访问；`tailnet` 绑定更适合直接跑在宿主机进程上，而不是容器内
13. `paperclip-automation.service` 的日常启动命令不应再附带 `--build`；镜像构建应作为独立运维步骤执行，避免 systemd 长时间卡在 Docker build 阶段导致 `3100` 端口不可用
14. `/data/paperclip` 下的持久化文件应保持为宿主机运维用户可读写；若发现 `/paperclip/instances/default/.env` 为 `root:root 600`，容器内应用会因为 `EACCES` 反复重启
15. automation 宿主机与容器默认统一使用 `Asia/Shanghai`，避免 Paperclip、日志与定时任务时间继续显示为 UTC
16. `CEO` 的 `hermes_local` 默认必须走容器内原生安装，不再复用宿主机 Python venv
17. 当前推荐做法是在部署目录维护自定义 Dockerfile，通过扩展 Paperclip 官方构建流程把 Hermes CLI 与 Python 依赖直接装进容器

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

### 4.0.1 Paperclip 版本基线与升级回归口径

这份 runbook 同时承担 `aimandala` 当前 `Paperclip` 服务端版本基线入口。

截至 `2026-04-27`，当前正式治理口径固定为：

- 当前推荐目标版本：`v2026.416.0`
- 当前推荐已验证基线：`v2026.416.0`
- 当前判断证据：
  - 官方 GitHub Releases
  - 官方 GitHub Security Advisories
  - 官方仓库近期高影响 merged changes（已合并改动）

为什么当前要以 `v2026.416.0` 为基线：

1. `2026-04-16` 官方发布了 `v2026.416.0`
2. 同日公开了多条安全通告
3. 其中至少一条 critical（严重）级 execution workspace 命令注入问题明确写明修复版本为 `v2026.416.0`
4. 当前 `aimandala` 已正式依赖 execution workspace policy、`/opt/automation/worktrees` 与 authenticated（鉴权）模式，因此不应继续停留在更低版本口径

当前版本判断规则：

1. 若出现新的安全通告，优先采用首个已修复稳定版或更高稳定版
2. 若无安全紧急性，默认优先采用最新正式 stable release（稳定正式发布版）
3. 默认不把 `canary` 当长期目标版本
4. 只有当 stable 明显不能覆盖当前已命中的关键问题时，才允许短期继续停留在更高 `canary`
5. 若当前运行实例已经高于稳定版安全修复线，但仍是 `canary`
   - 应优先把服务端主仓代码收正到对应 stable
   - 而不是长期把 `canary` 当正式口径

升级后最小回归检查清单：

1. execution workspace 真实绑定仍正常
   - 重点看 issue 上的 `executionWorkspaceId` / `currentExecutionWorkspace`
   - 不只看 project policy 是否存在
2. heartbeat 与 execution health strict gate 通过
   - 不新增 `execution_workspace_policy_not_materialized`
   - 不新增 `server_writable_execution_not_allowed`
3. `manual-review-required` 任务未被误送入 `server_automation`
4. `codex_local` / `claude_local` / `pi_local` 的基本唤醒、comment 回写与最小环境探测正常
5. authenticated 模式下关键敏感接口不存在跨 company（跨公司）越权回归
6. 若本轮升级涉及 auth / host / port 相关修复
   - 同步验证公网入口、Tailscale 入口、`publicBaseUrl` 与回跳行为

当前补充治理要求：

1. 周检报告可作为版本判断证据
2. 但项目级正式版本口径仍以本 runbook 为 deploy 入口
3. 若后续推荐目标版本变化，应同步更新：
   - 本文
   - [company/服务器与基础设施入口.md](/Users/xinran/Downloads/dev/mindsync/company/服务器与基础设施入口.md)
   - [company/knowledge-base/system/Paperclip-周检机制与版本跟踪说明.md](/Users/xinran/Downloads/dev/mindsync/company/knowledge-base/system/Paperclip-周检机制与版本跟踪说明.md)

## 4.2 `hermes_local` 容器原生方案

当前默认方案是：不改 `paperclip` 主仓源码，只在本部署目录维护一份自定义 Dockerfile，把 Hermes 安装进与 Paperclip 同一容器运行时。

当前固定文件：

- `Dockerfile.paperclip-with-hermes`
- `docker-compose.paperclip.yml`
- `docker-compose.paperclip.yml.example`

为什么必须这么做：

1. `hermes_local` 实际在 Paperclip 容器内执行
2. 如果把宿主机 `/opt/hermes-agent/venv` 只读挂进容器，本质上是在复用“别的 Python 解释器创建出来的 venv”
3. 本次线上事故已证明这会导致 Python 版本错配
   - 宿主机 venv: `Python 3.11`
   - 容器运行时: `Python 3.13`
   - 结果：`hermes` 可执行文件存在，但 `import hermes_cli` 失败
4. 因此 `CEO bug` 的真实修复口径不是补权限，而是让 Hermes 与容器 Python 保持同源构建

当前最小实现：

1. `build.context` 继续指向 `/opt/paperclip/app/paperclip`
2. `dockerfile` 改为本目录下的 `Dockerfile.paperclip-with-hermes`
3. 在该 Dockerfile 的 production stage 中：
   - 安装 `python3-venv`
   - 创建 `/opt/hermes` 虚拟环境
   - 通过 `git+https://github.com/NousResearch/hermes-agent.git@${HERMES_GIT_REF}` 安装 Hermes 官方源码
   - 链接 `/usr/local/bin/hermes`
4. compose 不再挂载：
   - `/opt/hermes-agent:/opt/hermes-agent:ro`
   - `/opt/hermes-agent/venv/bin/hermes:/usr/local/bin/hermes:ro`
5. `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL` 仍继续由 `/etc/default/paperclip-automation` 注入容器
6. 容器启动时自动把以上配置同步到 `/paperclip/.hermes/config.yaml`
   - `default_provider: main`
   - `providers.main`
   - `auxiliary.compression`
7. 这样可以避免 Hermes 在 context compression 时再次报：
   - `No auxiliary LLM provider configured`
8. 若要和 RelayHub 控制面保持一致，应优先执行：
   - `export RELAYHUB_INTERNAL_TOKEN=...`
   - `bash shared/tools/sync-paperclip-hermes-model.sh sync`
   - 由 RelayHub 的 `entry-paperclip-hermes-local-server` 决定默认 `base_url / model / api_key`

推荐重建：

```bash
cd /opt/automation/app/mindsync/projects/aimandala/deploy/paperclip-automation
docker compose -f docker-compose.paperclip.yml build --no-cache paperclip
docker compose -f docker-compose.paperclip.yml up -d paperclip
```

最小验收：

```bash
docker exec paperclip-automation-paperclip-1 sh -lc 'python3 --version && command -v hermes && hermes --version'
docker exec paperclip-automation-paperclip-1 sh -lc 'python3 - <<\"PY\"\nimport hermes_cli\nprint(\"hermes_cli ok\")\nPY'
```

如果以上两步都通过，再到 Paperclip 面板执行：

- `CEO -> Test environment`

只有容器内健康检查和面板测试都通过，才算 `CEO` 真正恢复 `hermes_local` 能力。

### 4.2.0.1 变更 provider / model 后必须先 reset session

2026-04-16 的线上复跑又额外确认了一条重要经验：

1. 即使容器环境变量和 `/paperclip/.hermes/config.yaml` 都已经切到新 provider
2. 只要 Paperclip 继续给 Hermes 传旧的 `--resume <session_id>`
3. Hermes 仍可能沿用旧 session 内残留的 provider / base_url 状态
4. 从而出现：
   - 当前配置已经是 Ark
   - 但真实请求仍打到历史 OpenRouter
   - 最终报：
     - `401 Missing Authentication header`

因此只要下面任一项发生变化：

- `adapter_config.model`
- provider / base URL
- Hermes 认证方式
- `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL`
- `/paperclip/.hermes/config.yaml`

都不要直接复跑旧 session，而应先 reset 该 agent 的 session。

当前最低要求：

1. 清空 `agent_runtime_state.session_id`
2. 清空该 agent 在 `agent_task_sessions` 中的旧会话
3. 再执行：
   - `CEO -> Test environment`
   - 或下一次 heartbeat

这一步不是可选优化，而是当前 `hermes_local` 切 provider 后的默认复验前置动作。

## 4.2.1 宿主机注入方案的当前结论

“宿主机注入 Hermes”现在不再作为推荐路径。

原因不是它理念上绝对错误，而是当前 automation 节点已经实际踩中下面这个高概率故障：

- 宿主机 venv 的 shebang 指向 `/opt/hermes-agent/venv/bin/python3`
- 该路径进入容器后会落到容器自己的 Python 解释器
- 一旦容器 Python 主版本不同，整个 venv 就会失效

因此除非后续明确把宿主机与容器改成完全同版本同布局运行时，并重新验证过兼容性，否则不要再把宿主机注入当成默认修复手段。

## 4.2.2 Hermes 来源口径

当前 Hermes 不应被理解为“稳定发布在 PyPI 的 `hermes-agent==0.9.0` 包”。

本次线上复核已确认：

- 宿主机现有可用环境实际是 `hermes-agent @ file:///tmp/hermes-agent`
- 该目录内容对应 `NousResearch/hermes-agent`
- 官方仓库存在可用 tag，例如 `v2026.4.13`

因此当前更稳的容器构建口径是：

1. 不依赖宿主机临时目录 `/tmp/hermes-agent`
2. 不假设存在可安装的 PyPI 发行包
3. 直接在 Docker build 中按固定 Git ref 安装官方 Hermes 源码

当前 compose 默认值：

- `HERMES_GIT_REF=v2026.4.13`

如果后续要升级 Hermes，应优先改这个 ref，并重新执行：

```bash
docker compose -f docker-compose.paperclip.yml build --no-cache paperclip
docker compose -f docker-compose.paperclip.yml up -d paperclip
```

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
9. 若要和 RelayHub 控制面保持一致，应优先执行：
   - `export RELAYHUB_INTERNAL_TOKEN=...`
   - `bash shared/tools/sync-paperclip-pi-model.sh sync`
   - 由 RelayHub 的 `entry-paperclip-pi-local-server` 决定默认 `provider / model / base_url / api_key`

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
- `escalate-engineer-stuck-issues.mjs`
  - 用于识别已经由 `Engineer` 多次失败、适合转人工的任务
  - 当前默认只按“失败信号达到阈值”做候选，不默认按任务年龄或公共卡点批量升级
  - 当前推荐先用 dry-run 观察输出，再决定是否加到 maintenance timer
  - 若后续提供 `PAPERCLIP_ESCALATION_USER_ID`，可在转 `blocked` 的同时直接 assign 给用户本人
  - maintenance 已可选接入这条巡检；默认 `PAPERCLIP_ENGINEER_ESCALATE_APPLY=0`，只输出候选报告

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
4. 安装 systemd 单元前，必须把模板同步到真实路径，并立即核对实际 unit 内容：
   - `paperclip-heartbeat.service.example -> /etc/systemd/system/paperclip-heartbeat.service`
   - `paperclip-heartbeat.timer.example -> /etc/systemd/system/paperclip-heartbeat.timer`
   - `automation-maintenance.service.example -> /etc/systemd/system/automation-maintenance.service`
   - `automation-maintenance.timer.example -> /etc/systemd/system/automation-maintenance.timer`
   - 明确禁止继续保留旧的 `/opt/automation/ops/paperclip-ci/*.mjs` 路径
5. 同步 unit 后必须执行：
   - `sudo systemctl daemon-reload`
   - `sudo systemctl cat paperclip-heartbeat.service`
   - `sudo systemctl cat automation-maintenance.service`
   - 确认 `WorkingDirectory` 与 `ExecStart` 已指向 `/opt/automation/app/mindsync-heartbeat` 和仓库内 `shared/tools/ci/*`
6. 在宿主机执行 `sudo timedatectl set-timezone Asia/Shanghai`，再用 `timedatectl` 确认系统时区已切到北京时间
7. 启动 Paperclip service
8. 完成私有网络访问与 board claim
9. 注册 `mindsync-ci` runner
10. 启动 heartbeat timer
11. 启动 maintenance timer
12. 回到 GitHub / Paperclip 做联调验收

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
5. `systemctl cat paperclip-heartbeat.service` 显示的 `WorkingDirectory` 与 `ExecStart` 和仓库模板一致，而不是旧的 `/opt/automation/ops/paperclip-ci`
6. `check-runner-heartbeat.mjs` 可以本机手动执行成功
7. `runner-doctor.sh --strict` 返回成功，且 labels / token / 最新 workflow 诊断一致
8. `paperclip-heartbeat.timer` 会同时完成 runner 巡检和执行健康巡检
9. `paperclip-heartbeat.service` 若失败，需先区分：
   - systemd unit 路径漂移
   - strict gate 命中 `execution_workspace_policy_not_materialized`
   - 其他 runner / token / API 故障
## Automation Node Prerequisites

- 同步 `mindsync` 的 Paperclip skill 恢复脚本前，automation 节点必须安装 `python3`、`ruby`、`curl`。
- `shared/tools/getnote-setup.sh` 与 `shared/tools/sync-paperclip-agent-skills.sh` 都会调用 `ruby` 解析 YAML；缺少 `ruby` 时，服务器无法自恢复 agent skill 绑定。
- 公网 SSH Key 登录后，如需补依赖，优先在节点上执行 `sudo dnf install -y ruby`。
