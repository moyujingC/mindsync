# RelayHub v1 Claude Code 双中转入口便捷切换 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-27
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/qa/2026-04-27-v1-Claude-Code-双中转入口便捷切换-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 验证目标

确认任务页已提供 `Claude Code` 的 `PPChat / AITechFlux` 专用便捷切换能力。

## 2. 页面验收

至少覆盖：

- `Claude Code 当前模型` 区块继续存在
- 页面明确展示 `PPChat` 与 `AITechFlux` 两个候选
- 每个候选都能看见当前状态
- 每个候选都能执行测试连接
- 每个候选都能执行切换绑定

## 3. 行为验收

至少覆盖：

- 当 `PPChat` 非 `active` 时，页面显示可读状态
- 当 `AITechFlux` 为 `active` 时，可直接切换到该入口
- 切换成功后，当前绑定文案跟随变化
- `验证 Claude Code 当前模型` 继续返回成功或可读错误

## 4. 自动化回归

至少覆盖：

- `projects/relayhub/console` 测试通过
- `projects/relayhub/console` 构建通过
