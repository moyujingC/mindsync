# Observe-only Checkout 治理规格

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-03
> source_of_truth：projects/aimandala/docs/specs/2026-05-03-observe-only-checkout-治理规格.md
> 项目：aimandala
> 阶段：spec
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 问题定义

当前 automation 节点已经具备：

1. execution workspace policy（执行工作区策略）
2. `git worktree`（Git 工作树）执行根目录
3. 多项目 heartbeat

但运行态仍暴露一个更基础的问题：

1. `/opt/automation/app/mindsync`
   - 主镜像区
   - 仍可能被写脏
2. `/opt/automation/app/mindsync-heartbeat`
   - 巡检区
   - 也可能被写脏或残留现场补丁

这说明当前系统还没有把“observe-only checkout（只观察 checkout）”真正治理成硬边界。

本阶段要解决的问题不是：

1. 再做一次 heartbeat 上线
2. 再解释一次老的 diagnosis 分桶

而是：

1. 为什么主镜像区和巡检区还会被写
2. 如何把它们治理成长期干净、可升级、可阻断漂移的观察区
3. 如何把真正可写的服务器执行，稳定收口到 `/opt/automation/worktrees`

## 2. 目标

本阶段固定达成下面 5 个目标：

1. 明确 observe-only checkout 与 writable worktree 的正式边界
2. 明确升级前遇到脏 checkout 时的默认处理顺序
3. 明确哪些脏改要转正、哪些要备份、哪些要重建 checkout
4. 明确 heartbeat / maintenance 在 observe-only checkout 变脏时必须 fail-fast
5. 明确巡检 checkout 保持 `origin/main` 干净，不因目标 workflow 在 `relayhub/dev` 而要求本地切分支

## 3. 非目标

本阶段不做：

1. 不重构 `PaperclipAI` 控制面
2. 不重写 execution workspace materialization 全链
3. 不默认清掉所有线上脏改
4. 不把 observe-only checkout 变成实际执行区
5. 不要求 heartbeat checkout 追随每个项目的目标分支

## 4. 核心边界

### 4.1 目录边界

固定目录语义：

1. `/opt/automation/app/mindsync`
   - 主镜像区
   - observe-only
2. `/opt/automation/app/mindsync-heartbeat`
   - 巡检区
   - observe-only
3. `/opt/automation/worktrees/...`
   - 隔离执行区
   - writable

### 4.2 行为边界

observe-only checkout 不允许承接：

1. agent 正式写操作
2. 自动修复落盘
3. deploy / smoke 执行现场
4. maintenance 写操作
5. 直接在脏 checkout 上继续 `git pull`

writable worktree 必须承接：

1. `automation-execution`
2. `server_automation`
3. 任何需要写文件的服务器任务

### 4.3 升级边界

未来升级必须遵守：

1. checkout 干净时
   - 允许正常快进或同步
2. checkout 不干净时
   - 先分类现场
   - 再决定转正、备份、重建或定点覆盖
3. 不允许跳过分类直接在脏目录上叠加继续升级

## 5. 失败条件

出现任一情况，都视为治理未闭环：

1. `/opt/automation/app/mindsync` 再次承接真实写操作
2. `/opt/automation/app/mindsync-heartbeat` 再次承接真实写操作
3. heartbeat 或 maintenance 遇到脏 observe-only checkout 仍继续执行后续自动动作
4. 升级动作默认仍依赖脏目录直接 `git pull`
5. `server_automation` 实际 `cwd` 仍落在 observe-only checkout

## 6. 验收标准

本阶段通过至少满足：

1. 主镜像区与巡检区的语义在文档链中固定一致
2. 日常巡检与升级前检查都先看 observe-only checkout 是否干净
3. 发现脏 checkout 后，处理路径先分类，不直接粗暴覆盖
4. heartbeat checkout 的正式目标为：
   - 对齐 `origin/main`
   - 长期 `git status` 干净
5. `relayhub/dev` 的 workflow 检查被明确解释为：
   - 检查目标 branch 运行态
   - 不是要求巡检 checkout 切到 `relayhub/dev`
