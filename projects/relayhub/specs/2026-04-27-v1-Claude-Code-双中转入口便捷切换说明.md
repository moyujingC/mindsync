# RelayHub v1 Claude Code 双中转入口便捷切换说明

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-27
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/specs/2026-04-27-v1-Claude-Code-双中转入口便捷切换说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 目标

把当前 `Claude Code` 在两个中转入口之间的切换，收成任务页里的顺手操作：

- `PPChat`
- `AITechFlux`

## 2. 目标用户动作

用户不需要先去模型库、再回任务库做两段操作。

当前希望在一个区域内完成：

1. 看见这两个候选入口
2. 看见当前绑定到哪一个
3. 看见每个入口当前是否 `active`
4. 必要时先测试入口
5. 直接把 `task-claude-code` 切过去
6. 切完后立即验证真链路

## 3. 范围

本轮只处理：

- `Claude Code`
- `task-claude-code`
- `preset-ppchat-relay`
- `preset-aitechflux-relay`

本轮不处理：

- `Codex`
- 其他任务
- release

## 4. 默认决策

- 继续复用现有 `/tasks` 页面
- 不新增新的 HTTP API
- 继续通过 `PATCH /tasks/task-claude-code` 完成切换
- 继续通过 `POST /models/:id/test` 完成入口测试
- `验证 Claude Code 当前模型` 继续走本地 `dev-relay`

## 5. 交互要求

任务页中的 `Claude Code 当前模型` 区块，应提供：

- 两个明确可读的候选卡片：`PPChat`、`AITechFlux`
- 当前状态展示
- 当前绑定提示
- 一键测试入口
- 一键切换到该入口

如果入口不是 `active`，页面应明确提示先测试，而不是让用户去猜为什么切完不能用。
