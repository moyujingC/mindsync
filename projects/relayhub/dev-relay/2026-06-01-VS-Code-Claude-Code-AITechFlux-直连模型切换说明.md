# VS Code Claude Code AITechFlux 直连模型切换说明

> 状态：current
> last_updated：2026-06-01
> source_of_truth：projects/relayhub/dev-relay/2026-06-01-VS-Code-Claude-Code-AITechFlux-直连模型切换说明.md

当前 `VS Code` 中使用的 `Claude Code` 不走 RelayHub 任务绑定链路，而是通过仓库根目录的 `.claude/settings.json` 直连 `AITechFlux` 第三方 API。

当前默认配置：

```json
{
  "ANTHROPIC_BASE_URL": "https://aitechflux.com",
  "ANTHROPIC_MODEL": "gpt-5.5",
  "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-pro",
  "ANTHROPIC_DEFAULT_SONNET_MODEL": "Qwen3.6-35B-A3B",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL": "高性能低价模型"
}
```

可选模型：

| 用途 | 模型名 |
| --- | --- |
| 默认高性能 | `gpt-5.5` |
| DeepSeek（深度求索）高质量文本候选 | `deepseek-v4-pro` |
| Qwen（通义千问）中文与轻中等文本候选 | `Qwen3.6-35B-A3B` |
| 成本优先文本候选 | `高性能低价模型` |

当前已知限制：

- `deepseek-v4-pro` 在这条 AITechFlux Claude Code 直连路径上只接受 `text`（文本）消息块。
- 如果当前 Claude Code 会话里包含截图、图片或其他视觉上下文，Claude Code 可能发送 `image_url`（图片链接）消息块，AITechFlux 会返回类似错误：

```text
messages[19]: unknown variant image_url, expected text
```

- 遇到这个错误时，切回 `gpt-5.5`，或新开一个不含图片上下文的纯文本 Claude Code 会话再切 `deepseek-v4-pro`。

切换命令：

```bash
node shared/tools/switch-vscode-claude-code-model.mjs gpt55
node shared/tools/switch-vscode-claude-code-model.mjs deepseek
node shared/tools/switch-vscode-claude-code-model.mjs qwen
node shared/tools/switch-vscode-claude-code-model.mjs cheap
```

脚本会同步更新：

- `ANTHROPIC_MODEL`
- `ANTHROPIC_REASONING_MODEL`
- `CLAUDE_CODE_SUBAGENT_MODEL`

为了让 VS Code Claude Code 的模型选择器里能直接出现三个候选，脚本会固定保留：

- `ANTHROPIC_DEFAULT_OPUS_MODEL=deepseek-v4-pro`
- `ANTHROPIC_DEFAULT_SONNET_MODEL=Qwen3.6-35B-A3B`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL=高性能低价模型`

这三个槽位只是为了在选择器里可选。包含截图或图片的任务仍建议使用 `gpt-5.5`。

切换后需要重载 VS Code，确保后台 Claude Code 进程重新读取 `.claude/settings.json`。
