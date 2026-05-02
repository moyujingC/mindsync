# Aimandala Local Mac Automatic Execution Host QA Basis

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-22
> source_of_truth：projects/aimandala/docs/qa/2026-04-22-local-mac-automatic-execution-host-qa-basis.md
> 项目：aimandala
> 阶段：qa-basis
> depends_on：projects/aimandala/docs/specs/2026-04-22-local-mac-automatic-execution-host-spec.md

## 1. 验证目标

验证普通任务是否已经具备“自动在 Mac 上跑”的第一版运行链。

通过标准：

1. 本地执行器能识别 `local_manual_review`
2. 本地执行器能排除摘要父任务
3. 本地执行器按每 agent 1 条限制调度
4. 成功样本默认转 `in_review`
5. 失败样本默认转 `blocked`
6. launchd 可安装、启动、停止

## 2. smoke 场景

必须覆盖：

1. `manual-review-required + local_manual_review` 正样本
2. `automation-summary` 反样本
3. `server_automation` 反样本
4. 同 agent 并发限制
5. `codex_local` 可用性识别
6. `claude_local` 可用性识别
7. `pi_local` 命令缺失时受控阻断
8. 执行前按目标 agent 加载本地身份，而不是复用轮询进程身份
9. 目标 agent 若无本机 local-cli 身份，dry-run 必须显式暴露该权限缺口

## 3. 真实样本验证

真实远端验证至少需要：

1. `poll-once --json` 能列出候选普通任务
2. `run-once --json` dry-run 不写远端
3. `daemon-tick --execute --json` 能对 1 条正样本完成：
   - claim
   - 本地执行
   - comment
   - `in_review`
4. `MIN-137` 不得被执行
5. `MIN-133` 不得被执行
6. 对非 Engineer agent 的样本，dry-run 输出能证明已解析目标 agent 身份
7. 若目标 agent 无权签发本地身份，执行器不能崩溃，必须受控给出 `blocked` 解释

## 4. 阻断条件

出现以下任一情况，本轮不通过：

1. `server_automation` 被本地执行器接走
2. 摘要父任务被自动执行
3. 成功任务直接转 `done`
4. Mac 停止导致服务器 heartbeat strict fail
5. `pi_local` 在 `pi` 命令不存在时被伪装成成功
