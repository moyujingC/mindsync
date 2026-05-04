# 本地执行器优先本地 worktree 实施记录

> 状态：current
> 版本：0.1.0
> owner：Engineer
> 最后更新：2026-04-27
> source_of_truth：company/projects/Automation/2026-04-27-本地执行器优先本地-worktree-IMPLEMENTATION.md
> 项目：Automation Platform
> 阶段：implementation
> depends_on：company/projects/Automation/2026-04-27-项目工作区与执行工作区分层-SPEC.md

## 1. 本轮改动

对 `shared/tools/paperclip-local-executor.mjs` 增加项目 workspace 选择逻辑：

1. 读取 issue 的 `projectId`
2. 拉取项目详情
3. 在项目 workspaces 中优先选择：
   - `local-worktree`
   - `local-monorepo`
   - 其他 `/Users/...` 本地路径
4. 只有都不存在时，才退回执行器启动目录 `process.cwd()`

## 2. 预期收益

这样 `local_manual_review` 不再默认误跑到：

- 启动 launchd 时所在目录
- 根仓库主 checkout

而是会优先进入项目自己的本地 worktree。

## 3. 当前限制

1. 仍然按 workspace 名字约定识别 `local-worktree` / `local-monorepo`
2. 还没有把“不同项目的本地 workspace 选择规则”抽成独立配置
3. 还没有补真实远端 issue 的端到端回归执行
