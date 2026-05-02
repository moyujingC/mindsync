# RelayHub v1 Claude Code 双中转入口便捷切换实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-27
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/tasks/2026-04-27-v1-Claude-Code-双中转入口便捷切换实施任务.md
> 项目：RelayHub
> 阶段：task

## 1. 实施目标

让用户能在任务页里快速把当前 `Claude Code` 从 `PPChat` 切到 `AITechFlux`，或反向切回，而不必在模型库与任务库之间来回跳。

## 2. 实施内容

- 在 `/tasks` 的 `Claude Code 当前模型` 区块增加专用双入口切换 UI
- 专门读取并展示：
  - `preset-ppchat-relay`
  - `preset-aitechflux-relay`
- 支持对单个入口先执行测试连接
- 支持把 `task-claude-code` 切换到该入口
- 保留现有通用下拉切换与 `验证 Claude Code 当前模型`

## 3. 验收重点

- 用户能一眼看清两个入口当前状态
- 用户能直接点击“测试入口”
- 用户能直接点击“切换到这个入口”
- 切换后 `task-claude-code.defaultModelEntryId` 正确变化
- 验证按钮仍可复用当前绑定做真链路验证
