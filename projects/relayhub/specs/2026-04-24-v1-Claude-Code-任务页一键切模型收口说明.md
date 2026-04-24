# RelayHub v1 Claude Code 任务页一键切模型收口说明

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-24
> source_of_truth：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/specs/2026-04-24-v1-Claude-Code-任务页一键切模型收口说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 本轮目标

把任务页收口成“你点一下就能切 Claude Code 当前模型”。

当前固定语义为：

- `Claude Code` 固定映射到 `task-claude-code`
- 任务页需要给这个任务一个更直接的专用切换入口
- 用户不需要先在表格里理解全部任务，再找到 `Claude Code Web Coding`

## 2. 本轮默认口径

在 `/tasks` 页面顶部增加一个专用操作区：

- 标题固定为 `Claude Code 当前模型`
- 明确显示当前绑定到哪个入口
- 提供一个模型选择控件
- 提供一个明确按钮：
  - `切换 Claude Code 当前模型`

点击后直接更新：

- `task-claude-code.defaultModelEntryId`

## 3. 行为约束

- 不新增新的 control-plane 路由
- 继续复用现有 `PATCH /tasks/:id`
- 不改 Claude Code 自身配置入口
- 不改 `dev-relay` 固定读取 `task-claude-code` 的语义
- 切换成功后的提示继续沿用：
  - 新的绑定会对后续使用和后续新运行记录生效

## 4. 本轮不改

- 不重做整个任务页信息架构
- 不把 Runs 页改成 Claude Code 切换主入口
- 不新增全局当前模型
- 不在本轮扩 release 或部署路径
