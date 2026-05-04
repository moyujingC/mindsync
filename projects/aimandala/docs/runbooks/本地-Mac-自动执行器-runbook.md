# 一镜一梳本地 Mac 自动执行器 Runbook

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-22
> source_of_truth：projects/aimandala/docs/runbooks/本地-Mac-自动执行器-runbook.md

## 1. 目标

本 runbook 用于让普通任务自动在你的 Mac 上执行。

它取代“手动 pilot 是主路径”的旧操作口径；`paperclip-local-pilot.mjs` 仍可用于排障，但不再是默认主链。

## 2. 前置条件

先确认：

```bash
cd .
bash shared/tools/paperclip-local-env.smoke.sh
eval "$(shared/tools/paperclip-local-env.sh engineer)"
node shared/tools/paperclip-local-executor.mjs doctor
```

当前已知：

1. `codex` 可用
2. `claude` 可用
3. `pi` 当前缺失，因此 `pi_local` 会受控转 `blocked`

说明：`launchd` 模板使用 `engineer` 身份启动轮询，但执行器真正执行某条 issue 前，会按该 issue 的目标 agent 重新调用 `paperclip-local-env.sh <agent-ref>` 加载本地身份。

如果某个目标 agent 当前拿不到本机 local-cli 身份，`run-once --json` 会先把这个缺口显示在 `agentEnvSummary.error`；带 `--execute` 时会受控把任务转成 `blocked`，而不是直接崩掉。

## 3. 手动 dry-run

先只观察候选：

```bash
node shared/tools/paperclip-local-executor.mjs poll-once --json
```

再演练一轮执行，不写远端：

```bash
node shared/tools/paperclip-local-executor.mjs run-once --json
```

## 4. 手动执行一轮

确认 dry-run 无误后：

```bash
node shared/tools/paperclip-local-executor.mjs daemon-tick --execute --json
```

成功时任务进入 `in_review`。

失败时任务进入 `blocked`，comment 中会写明本地宿主、adapter、cwd、branch、sha 与错误摘要。

## 5. 安装 launchd

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

## 6. 日志与锁

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

## 7. 边界

自动执行器不会处理：

1. `server_automation`
2. `automation-summary`
3. `commit-summary`
4. 服务器 `/opt/automation/...` 工作区
