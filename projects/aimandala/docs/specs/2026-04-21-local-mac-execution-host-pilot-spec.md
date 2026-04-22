# Aimandala Local Mac Execution Host Pilot Spec

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-21
> source_of_truth：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/specs/2026-04-21-local-mac-execution-host-pilot-spec.md
> 项目：aimandala
> 阶段：spec
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/specs/2026-04-19-paperclip-native-execution-routing-spec.md
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/specs/2026-04-19-server-automation-blocking-sample-interpretation-spec.md
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/deploy/paperclip-automation/README.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 问题定义

`aimandala` 当前关于 execution routing（执行分流）已经有两条正式结论：

1. `manual-review-required + local_manual_review`
   - 已被定义为普通任务的直接本地执行主路径
2. `automation-execution + server_automation`
   - 已被定义为 automation 节点的服务器执行主路径

但运行时仍存在一条关键断裂：

1. `.paperclip.yaml` 当前仍把 `*_local` 解释为“Paperclip 服务宿主机本地”
2. `company/Paperclip-Agent-模型配置总表.md` 仍把 `codex_local / claude_local` 主口径解释为 automation 节点本地执行
3. `company/服务器与基础设施入口.md` 仍把 automation 节点视为大多数 local adapter（本地适配器）的主执行宿主

这意味着：

1. 任务语义已经写成“普通任务应该去本地”
2. 但真正的本地 execution host（执行宿主机）还没有接通
3. 当前 `codex_local / claude_local` 仍主要在服务器跑，而不是在你的 Mac 上跑

因此，下一阶段真正要解决的，不是继续改任务语义，而是把“你的 Mac 作为正式 local execution host”单机接入。

## 2. 目标

本规格只收一件事：

1. 把你的当前这台 Mac 接成 `aimandala` 普通任务的单机本地执行节点试点

本轮固定目标：

1. 保持 control plane（控制面）继续在 automation 服务器
2. 保持 `server_automation` 继续由 automation 节点承接
3. 让 `local_manual_review` 真正由你的 Mac claim / checkout / 执行 / 回写
4. 让服务器 heartbeat 不再把这条本地执行链当成自身执行责任

## 3. 非目标

本规格不做：

1. 不修改 `PaperclipAI` 源码
2. 不做多开发者共享接入方案
3. 不做自动选主、本地节点注册中心或节点调度系统
4. 不修改 heartbeat strict 规则
5. 不把本地节点离线变成服务器 heartbeat 阻断条件
6. 不重做 `automation-summary` 或 diagnosis 脚本语义
7. 不新建第二套 Paperclip 控制面

## 4. 核心规则

### 4.1 三层宿主机语义必须拆开

从本规格生效起，必须固定区分下面 3 个宿主：

1. `control plane host`
   - 继续是 automation 服务器
   - 负责 UI / API / issue / status / comment / audit
2. `server execution host`
   - 继续是 automation 服务器
   - 只承接 `automation-execution + server_automation`
3. `local execution host`
   - 单机试点下，固定就是你的当前这台 Mac
   - 只承接 `manual-review-required + local_manual_review`

禁止继续使用下面模糊表达：

1. `*_local = automation 服务器本地`
2. `local_manual_review = 只是文档语义，运行时还不算正式本地执行`

### 4.2 单机试点的最小连接合同

你的 Mac 必须复用现有远端 Paperclip 控制面，而不是新建控制面。

连接合同固定为：

1. 使用现有远端 `host / port / company id / API key`
2. 由本地 Mac 直连远端控制面
3. 控制面仍继续保留在 automation 服务器

### 4.3 单机试点的执行合同

本地 Mac 单机试点只允许承接：

1. `manual-review-required + local_manual_review`

明确不承接：

1. `automation-execution + server_automation`
2. deploy / smoke / runner / infra / maintenance
3. `automation-summary / commit-summary` 这类控制面协调父任务

### 4.4 本地工作区合同

本地执行工作区固定为：

1. 你的 Mac 上的本地仓库
2. 或你的 Mac 上的本地 worktree

明确禁止：

1. 复用 `/opt/automation/...`
2. 把服务器 checkout 当作本地试点执行目录

### 4.5 本地回写合同

单机试点下，本地执行至少必须回写：

1. 已 claim
2. 本地执行目录 `cwd`
3. 本地 `branch`
4. 当前 `sha`
5. 当前判断
6. 已做动作
7. 下一步动作
8. 验证结论

### 4.6 状态推进合同

推荐路径固定为：

1. `todo`
2. `in_progress`
3. `in_review`
4. `done`

若中途受阻，可转：

1. `blocked`

本规格不引入新状态。

### 4.7 服务器边界

单机试点接入后，服务器对普通任务的职责固定为：

1. control plane 展示
2. 审计与观测
3. heartbeat
4. issue / comment / status 存储

服务器不再承担：

1. 代跑本地 CLI
2. 先 reject 再 handoff
3. 把本地执行失败视为服务器 strict gate 失败

## 5. 固定验证样本

单机试点至少覆盖 3 类样本：

1. 真实普通研发任务
   - 作为单机试点正样本
2. 摘要型父任务反例
   - `MIN-137`
   - `MIN-133`
3. 本地任务错路由审计反例
   - 保留 `localExecutionRouting` 只作为审计对象

其中固定解释为：

1. `MIN-137`
   - `Runner-Heartbeat`
   - 摘要任务
   - 不是本地执行子任务
2. `MIN-133`
   - `CI commit-summary` 父任务
   - 不是普通本地执行子任务

## 6. 验收标准

本规格通过至少满足：

1. 明确 control plane 在服务器、本地执行在你的 Mac
2. 明确 `*_local` 对普通任务路径不再默认等于 automation 服务器本地
3. 明确单机试点只服务你当前这台 Mac
4. 明确本地执行最小回写字段
5. 让后续实现者无需再决定：
   - 普通任务执行宿主到底是服务器还是你的 Mac
   - `automation-summary` 是否属于本地试点接入对象
   - 是否需要在本轮引入多机调度
