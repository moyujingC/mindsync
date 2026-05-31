# VS Code Claude Code AITechFlux 直连模型切换说明

> 状态：current
> last_updated：2026-06-01
> source_of_truth：projects/relayhub/dev-relay/2026-06-01-VS-Code-Claude-Code-AITechFlux-直连模型切换说明.md

当前 `VS Code` 中使用的 `Claude Code` 不走 RelayHub 任务绑定链路，而是通过仓库根目录的 `.claude/settings.json` 直连 `AITechFlux` 第三方 API。

当前默认配置：

```json
{
  "ANTHROPIC_BASE_URL": "https://aitechflux.com",
  "ANTHROPIC_MODEL": "gpt-5.5"
}
```

可选模型：

| 用途 | 模型名 |
| --- | --- |
| 默认高性能 | `gpt-5.5` |
| DeepSeek（深度求索）高质量候选 | `deepseek-v4-pro` |
| Qwen（通义千问）中文与轻中等开发候选 | `Qwen3.6-35B-A3B` |
| 成本优先候选 | `高性能低价模型` |

切换命令：

```bash
node shared/tools/switch-vscode-claude-code-model.mjs gpt55
node shared/tools/switch-vscode-claude-code-model.mjs deepseek
node shared/tools/switch-vscode-claude-code-model.mjs qwen
node shared/tools/switch-vscode-claude-code-model.mjs cheap
```

脚本会同步更新：

- `ANTHROPIC_MODEL`
- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`
- `ANTHROPIC_REASONING_MODEL`
- `CLAUDE_CODE_SUBAGENT_MODEL`

切换后需要重载 VS Code，确保后台 Claude Code 进程重新读取 `.claude/settings.json`。
