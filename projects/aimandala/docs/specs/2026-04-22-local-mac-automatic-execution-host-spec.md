# Aimandala Local Mac Automatic Execution Host Spec

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-22
> source_of_truth：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/specs/2026-04-22-local-mac-automatic-execution-host-spec.md
> 项目：aimandala
> 阶段：spec
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/specs/2026-04-21-local-mac-execution-host-pilot-spec.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 目标

本规格把 `manual-review-required + local_manual_review` 从“可手动 pilot（试点）接手”升级为“由你的 Mac 自动执行”的正式运行链。

固定目标：

1. `automation-execution + server_automation` 继续由 automation 服务器承接
2. `manual-review-required + local_manual_review` 由你的 Mac 自动 claim / checkout / 执行 / 回写
3. Mac 端通过 `launchd` 周期运行本地执行器
4. 自动执行成功后默认推进到 `in_review`
5. 自动执行失败后默认推进到 `blocked`

## 2. 宿主边界

固定三层宿主：

1. `control plane host`
   - 继续是 automation 服务器
2. `server execution host`
   - 继续是 automation 服务器
   - 只承接 `server_automation`
3. `local execution host`
   - 正式是你的当前这台 Mac
   - 承接 `codex_local / claude_local / pi_local` 的普通任务路径

本规格生效后，`CEO` 不再保留“服务器侧 `claude_local` 例外”。若 `CEO` 的本地 `claude_local` 实测失败，应记录为本地宿主运行缺口，而不是恢复模糊口径。

## 3. 本地执行器合同

新增本地执行器：

1. `shared/tools/paperclip-local-executor.mjs`
2. 只处理 `manual-review-required + local_manual_review`
3. 排除 `source: automation-summary` 与 `commit-summary` 父任务
4. 每个 agent 同时最多执行 1 条任务
5. 通过锁文件避免重复 claim
6. 轮询控制面时可使用任一本地 agent 身份启动，但执行某条 issue 前必须重新加载该 issue 所属 agent 的本地身份
7. 回写必须带：
   - `host`
   - `adapter`
   - `cwd`
   - `branch`
   - `sha`
   - 当前判断
   - 已做动作
   - 下一步动作
   - 验证结论

## 4. adapter 范围

第一版纳入：

1. `codex_local`
2. `claude_local`
3. `pi_local`

当前本机实测事实：

1. `codex` 命令存在
2. `claude` 命令存在
3. `pi` 命令当前不存在
4. 并非所有目标 agent 当前都已具备可在本机直接签发的 local-cli 身份；缺失时应受控回写 `blocked`

因此第一版必须把 `pi_local` 识别为目标范围，但在 `pi` 命令未安装前只能受控转 `blocked`，不能伪装成已打通。

## 5. 调度合同

Mac 端调度固定为：

1. `launchd` / `LaunchAgent`
2. 默认每 5 分钟运行一次 `daemon-tick --execute`
3. 日志落到 `~/.paperclip-local-executor/logs`
4. 锁文件落到 `~/.paperclip-local-executor/locks`
5. `pi_local` session 落到 `~/.paperclip-local-executor/pi-sessions`
6. 不做 websocket、注册中心或多机选主

## 6. 非目标

本规格不做：

1. 不修改 `PaperclipAI` 源码
2. 不改服务器 heartbeat strict gate
3. 不让服务器代跑本地 CLI
4. 不把本地 Mac 离线变成服务器 heartbeat 阻断
5. 不直接自动把普通任务转 `done`
6. 不清理历史 `MIN-119 / MIN-133 / MIN-137` 样本
