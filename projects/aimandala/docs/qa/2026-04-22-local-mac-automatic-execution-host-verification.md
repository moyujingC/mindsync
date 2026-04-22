# Aimandala Local Mac Automatic Execution Host Verification

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-22
> source_of_truth：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/qa/2026-04-22-local-mac-automatic-execution-host-verification.md
> 项目：aimandala
> 阶段：verification

## 1. 当前验证结论

本轮已完成本地自动执行器第一版代码与静态 smoke。

当前结论：

1. `codex_local` 本机命令存在
2. `claude_local` 本机命令存在
3. `pi_local` 目标范围已纳入，但当前 Mac 缺少 `pi` 命令
4. 本地执行器已能在 smoke 中验证候选筛选、摘要排除、并发限制与终态规则
5. 执行器已收紧为执行前按目标 issue 的 agent 重新加载本地身份
6. 真实 dry-run 已证明当前候选 `MIN-119` 会落到 `Research & Knowledge Lead / claude_local`
7. 当前这台 Mac 对 `Research & Knowledge Lead` 还拿不到 local-cli 身份，`paperclip-local-env.sh "Research & Knowledge Lead"` 返回 `403 Board access required`
8. 尚未在真实远端 issue 上执行 `--execute`

## 2. 已执行本地验证

本轮应执行：

```bash
node --check shared/tools/paperclip-local-executor.mjs
node shared/tools/paperclip-local-executor.smoke.mjs
bash -n shared/tools/install-paperclip-local-executor-launchd.sh
plutil -lint shared/tools/paperclip-local-executor.launchd.plist
git diff --check
```

## 3. 待执行远端验证

合入 `main` 后，在你的 Mac 上执行：

```bash
cd /Users/xinran/Downloads/dev/mindsync
eval "$(shared/tools/paperclip-local-env.sh engineer)"
node shared/tools/paperclip-local-executor.mjs doctor
node shared/tools/paperclip-local-executor.mjs poll-once --json
node shared/tools/paperclip-local-executor.mjs run-once --json
```

确认 dry-run 结果无误后，才执行：

```bash
node shared/tools/paperclip-local-executor.mjs daemon-tick --execute --json
```

## 4. 当前已知缺口

`pi_local` 不能宣称真实跑通，原因是当前 Mac 上 `pi` 命令不存在。

这不是服务器 heartbeat 问题，也不是 route（路由）语义问题，而是本地宿主工具链缺口。

本轮又确认了第二个运行时缺口：

1. 当前可被自动执行器选中的真实本地候选是 `MIN-119`
2. 它分配给 `Research & Knowledge Lead`
3. 执行器在 dry-run 时已能报告这一点
4. 但当前本机无法为该 agent 签发 local-cli 身份，错误是 `403 Board access required`

因此，本轮代码已经具备“普通任务自动在 Mac 上跑”的执行器骨架和受控失败行为，但要让真实普通任务自动闭环，还需要补齐目标 agent 的本地身份权限。
