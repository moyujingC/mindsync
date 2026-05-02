# Paperclip claude_local 主备模型切换实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-27
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/research-center/tasks/2026-04-27-Paperclip-Claude-Local-主备模型切换-实施任务.md
> depends_on：/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/research-center/specs/2026-04-27-Paperclip-Claude-Local-主备模型切换-SPEC.md

## 1. 实施目标

将 `Paperclip` 的 `claude_local` 运行时主模型切换为 `PPChat / gpt-5.4`，并把 `AITechFlux / Claude混合版` 收成明确备用口径。

## 2. 实施内容

- 更新 `company/Paperclip-Agent-模型配置总表.md`
- 如有必要，补运行时同步脚本或更新现有脚本
- 批量更新 `Paperclip` 运行时所有 `claude_local` agent 的 `adapterConfig.env`
- 记录备用链路的推荐值与切换口径

## 3. 验收重点

- `claude_local` agent 当前模型不再是 `ark-code-latest`
- 运行时 `ANTHROPIC_BASE_URL` 指向 `PPChat`
- 运行时 `ANTHROPIC_MODEL` 指向 `gpt-5.4`
- 备用链路信息已正式记录，不再只存在口头说明
