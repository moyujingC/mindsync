# 一镜一梳本地 Mac 自动执行器 Runbook

> 状态：current
> 版本：0.2.0
> owner：Engineer
> last_updated：2026-05-11
> source_of_truth：projects/aimandala/docs/runbooks/本地-Mac-自动执行器-runbook.md

## 1. 目标

本 runbook 用于让 `manual-review-required + local_manual_review` 普通任务在本地 Mac 上自动执行。

它是当前普通任务本地执行的 control-backed runbook：

1. runbook 负责说明筛选、执行、回写和人工接管流程
2. `shared/tools/paperclip-local-executor.mjs` 负责执行筛选、锁、adapter 调用和状态回写
3. `launchd` 负责定时触发本地执行器

它取代“服务器拒绝后本地人工接手”的旧主路径；`paperclip-local-pilot.mjs` 只保留为排障工具，不再是默认主链。

## 2. 适用范围

本 runbook 只适用于下面这类任务：

1. `task_class: manual-review-required`
2. `execution_route: local_manual_review`
3. 目标 agent 使用本机支持的 local adapter：
   - `codex_local`
   - `claude_local`
   - `pi_local`

本 runbook 不适用于：

1. `server_automation`
2. `automation-summary`
3. `commit-summary`
4. deploy / smoke / runner / infra / maintenance 任务
5. 服务器 `/opt/automation/...` 工作区中的任务

## 3. 控制层行为

本地执行器已经内置下面这些控制：

1. 只筛选 `manual-review-required + local_manual_review`
2. 自动排除 `automation-summary` 和 `commit-summary` 父任务
3. 只支持 `codex_local / claude_local / pi_local`
4. 每个 agent 同一时间只允许一个本地任务运行
5. 执行前会按目标 agent 加载本地 local-cli 身份
6. 成功时把任务推进到 `in_review`
7. 失败时把任务推进到 `blocked`
8. comment 会回写 host、adapter、cwd、branch、sha 和错误摘要

因此，如果任务不是本地普通任务，不应通过补 prompt 或手动 comment 绕过执行器筛选。

## 4. 前置条件

先确认本地环境：

```bash
bash shared/tools/paperclip-local-env.smoke.sh
eval "$(shared/tools/paperclip-local-env.sh engineer)"
node shared/tools/paperclip-local-executor.mjs doctor --json
```

当前已知限制：

1. `codex` 可用时，`codex_local` 可执行
2. `claude` 可用时，`claude_local` 可执行
3. `pi` 当前缺失时，`pi_local` 会受控转 `blocked`

`launchd` 模板使用 `engineer` 身份启动轮询，但执行器真正执行某条 issue 前，会按目标 agent 重新调用：

```bash
shared/tools/paperclip-local-env.sh <agent-ref>
```

如果某个目标 agent 当前拿不到本机 local-cli 身份，`run-once --json` 会先在 `agentEnvSummary.error` 中显示缺口；带 `--execute` 时会受控把任务转成 `blocked`，不会继续盲跑。

## 5. 本地 dry-run

先只观察候选任务：

```bash
node shared/tools/paperclip-local-executor.mjs poll-once --json
```

再演练一轮执行计划，不写远端：

```bash
node shared/tools/paperclip-local-executor.mjs run-once --json
```

dry-run 结果应重点看：

1. `runnable`
2. `skipped`
3. `agentEnvSummary`
4. `checkoutPlan`
5. `cwdResolution`
6. `plannedTransition`

如果 `skipped` 中出现 `non_local_route`、`summary_parent`、`unsupported_adapter`、`agent_locked` 或 `agent_concurrency_limit`，应先按原因判断，不要直接手动改状态绕过。

## 6. 手动执行一轮

确认 dry-run 无误后，手动执行一轮：

```bash
node shared/tools/paperclip-local-executor.mjs daemon-tick --execute --json
```

成功时：

1. 任务进入 `in_review`
2. comment 写明本地执行结果
3. 人工再决定是否验收为 `done`

失败时：

1. 任务进入 `blocked`
2. comment 写明错误摘要
3. 人工检查日志、工作区和本地 agent 身份后再决定是否恢复

## 7. 安装 launchd

安装：

```bash
shared/tools/install-paperclip-local-executor-launchd.sh install
```

查看：

```bash
shared/tools/install-paperclip-local-executor-launchd.sh status
```

停止：

```bash
shared/tools/install-paperclip-local-executor-launchd.sh unload
```

当前 launchd 配置每 300 秒执行一次：

```bash
node /Users/xinran/.mindsync/runtime/mindsync/shared/tools/paperclip-local-executor.mjs daemon-tick --execute --json
```

launchd 使用 runtime checkout：

```bash
/Users/xinran/.mindsync/runtime/mindsync
```

安装脚本会把当前仓库的 `shared/tools/` 同步到 runtime checkout。

## 8. 日志与锁

日志目录：

```bash
~/.paperclip-local-executor/logs
```

锁目录：

```bash
~/.paperclip-local-executor/locks
```

`pi_local` session 目录：

```bash
~/.paperclip-local-executor/pi-sessions
```

查看活跃锁：

```bash
node shared/tools/paperclip-local-executor.mjs list-active
```

清理锁：

```bash
node shared/tools/paperclip-local-executor.mjs stop --agent-id <agent-id>
```

按 issue 清理锁：

```bash
node shared/tools/paperclip-local-executor.mjs stop --issue <id-or-identifier>
```

## 9. 工作区选择

执行器会优先从 issue 所属 project 的 workspaces 中选择本地工作区：

1. 优先 `local-worktree`
2. 其次 `local-monorepo`
3. 再其次 `/Users/...` 本地路径
4. 都没有时退回当前进程 cwd

因此如果任务跑到了错误目录，优先检查 project workspace 配置，而不是直接改 agent prompt。

## 10. 完成态

本 runbook 的最低完成态是：

1. `doctor --json` 可正常输出本机支持的 adapter
2. `poll-once --json` 能解释候选任务和跳过原因
3. `run-once --json` 能展示执行计划和目标 cwd
4. `daemon-tick --execute --json` 成功时进入 `in_review`
5. 失败时进入 `blocked` 且 comment 保留错误摘要
6. launchd 安装后能通过 `status` 查看

## 11. 常见错误处理

### 11.1 agent 身份缺失

现象：

1. `agentEnvSummary.error` 有错误
2. 执行后任务进入 `blocked`

处理：

1. 运行 `eval "$(shared/tools/paperclip-local-env.sh <agent-ref>)"`
2. 确认 local-cli key 可用
3. 再运行 dry-run

### 11.2 adapter 命令缺失

现象：

1. `doctor --json` 的 `availableCommands` 缺少目标命令
2. `pi_local` 因缺少 `pi` 受控失败

处理：

1. 安装对应 CLI
2. 或把任务转给当前可用 adapter
3. 不要把 adapter 缺失误判为业务代码失败

### 11.3 agent 锁残留

现象：

1. `poll-once --json` 中出现 `agent_locked`
2. `list-active` 显示残留锁

处理：

1. 确认没有真实执行仍在运行
2. 使用 `stop --agent-id` 或 `stop --issue` 清理锁
3. 再重新 dry-run

### 11.4 跑到错误工作区

现象：

1. comment 中 cwd 不符合预期
2. `cwdResolution.source` 不是期望的 local workspace

处理：

1. 检查 Paperclip project workspaces
2. 优先修正 workspace 配置
3. 不要靠 prompt 要求 agent 自己切目录

## 12. 控制层入口

本 runbook 当前对应的控制层入口是：

1. `shared/tools/paperclip-local-executor.mjs`
2. `shared/tools/paperclip-local-env.sh`
3. `shared/tools/paperclip-local-env.smoke.sh`
4. `shared/tools/paperclip-local-executor.launchd.plist`
5. `shared/tools/install-paperclip-local-executor-launchd.sh`
6. `shared/tools/paperclip-local-executor.smoke.mjs`

修改这些入口时，应同步回看本 runbook。
