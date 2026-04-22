# Aimandala Local Mac Automatic Execution Host Plan

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-22
> source_of_truth：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/tasks/2026-04-22-local-mac-automatic-execution-host-plan.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/specs/2026-04-22-local-mac-automatic-execution-host-spec.md

## 1. 实施目标

本轮把普通任务本地执行从手动 pilot 升级为 Mac 自动执行器。

必须落地：

1. 本地执行器 CLI
2. launchd `LaunchAgent` 模板与安装脚本
3. 自动执行 runbook
4. 宿主语义治理文档更新
5. 本地 smoke 与 verification

## 2. 实施顺序

固定顺序：

1. 先补 `paperclip-local-executor` smoke
2. 再实现本地执行器
3. 再补 launchd 模板与安装脚本
4. 再更新 spec / task / qa / verification / runbook
5. 最后跑本地静态检查、smoke、dry-run

禁止倒序：

1. 不先改服务器 heartbeat
2. 不先 patch 远端历史 issue
3. 不先承诺 `pi_local` 已跑通

## 3. CLI 合同

本地执行器必须提供：

1. `doctor`
2. `poll-once`
3. `run-once`
4. `daemon-tick`
5. `list-active`
6. `stop`
7. `resume`

`run-once` 与 `daemon-tick` 默认 dry-run，只有 `--execute` 才会写远端。

## 4. 执行合同

第一版执行规则：

1. 候选任务必须是 `manual-review-required + local_manual_review`
2. 摘要父任务必须排除
3. 每个 agent 同时最多 1 条
4. 成功推进到 `in_review`
5. 失败推进到 `blocked`
6. `server_automation` 不进入本地执行器
7. 执行具体 issue 前必须加载目标 agent 的 `paperclip-local-env.sh <agent-ref>` 身份，不能用启动进程的单一身份冒充所有 agent

## 5. 已知缺口

当前 Mac 上 `pi` 命令不存在。

因此：

1. `pi_local` 已纳入目标范围
2. 但第一版验证只能证明它被正确识别和受控阻断
3. 真正跑通 `pi_local` 需要先安装并配置 `pi` CLI
4. 若某个目标 agent 当前无法在本机签发 local-cli 身份，执行器必须明确暴露该缺口，并在执行态受控转 `blocked`
