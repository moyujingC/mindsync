# RelayHub v1 Claude Code 任务页切后即验实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-24
> source_of_truth：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/tasks/2026-04-24-v1-Claude-Code-任务页切后即验实施任务.md
> 项目：RelayHub
> 阶段：task

## 1. 实施目标

在任务页 `Claude Code 当前模型` 专用区补一个本地真链路验证动作。

## 2. 实施内容

- 前端 service 新增最小 `dev-relay` 验证调用
- `TasksPage` 增加 `验证 Claude Code 当前模型` 按钮
- 成功后显示简短成功消息
- 失败时显示错误消息

## 3. 测试要求

至少覆盖：

- 点击验证按钮会请求本地 `dev-relay`
- 成功时页面出现验证成功反馈
- 失败时页面出现可读错误
