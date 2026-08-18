# VS Code Claude Code 多 Provider 直连模型切换说明

> 状态：current
> 版本：0.2.0
> owner：Engineer
> last_updated：2026-08-06
> source_of_truth：projects/relayhub/dev-relay/2026-06-01-VS-Code-Claude-Code-AITechFlux-直连模型切换说明.md

VS Code 中的 Claude Code 使用仓库根目录 `.claude/settings.json`。当前提供两条不经过 RelayHub control-plane 的直连路径：

```text
Claude Code → AITechFlux → 当前选择的 AITechFlux 模型
```

```text
Claude Code → localhost LiteLLM → DeepSeek 官方 API
```

## 1. 为什么 DeepSeek 需要本地 LiteLLM

Claude Code 发出 Anthropic Messages 风格请求，DeepSeek 官方 API 提供 OpenAI-compatible 接口。`ANTHROPIC_BASE_URL` 不能直接指向 DeepSeek 官方地址完成协议转换。本机 LiteLLM 负责接收 `/v1/messages`，转换后调用 DeepSeek。

LiteLLM 默认配置为：

- 监听：`127.0.0.1:4000`
- readiness：`http://127.0.0.1:4000/health/readiness`
- 动态运行目录：`tmp/claude-code-deepseek/`
- 上游 Key：只从 `.env.local` 或进程环境读取

## 2. 配置 DeepSeek 私密 Key

仓库根目录 `.env.local` 已被 `.gitignore` 忽略。保留已有变量，在文件中增加：

```dotenv
DEEPSEEK_API_KEY=你的本机私密Key
```

可选自定义 API Base：

```dotenv
DEEPSEEK_API_BASE=https://api.deepseek.com
```

不要把 Key 写入 `.claude/settings.json`、LiteLLM 模板、文档、测试或 Git。

## 3. 查询 DeepSeek 实时模型目录

```bash
node shared/tools/claude-code-deepseek-proxy.mjs models
```

模型数量和 ID 以 DeepSeek 官方 `/models` 当前响应为准。工具不会用旧的 `deepseek-v4-pro` 作为官方目录兜底。

## 4. 启动与检查本地代理

当前机器需要可执行的 LiteLLM Proxy。若未安装，请在独立 Python 虚拟环境中安装，不要静默污染全局 Python：

```bash
python3 -m venv ~/.venvs/claude-code-deepseek
~/.venvs/claude-code-deepseek/bin/pip install 'litellm[proxy]'
LITELLM_BIN=~/.venvs/claude-code-deepseek/bin/litellm \
  node shared/tools/claude-code-deepseek-proxy.mjs start
```

当前机器已经安装 LiteLLM 时可直接运行：

```bash
node shared/tools/claude-code-deepseek-proxy.mjs start
```

启动工具会等待至少 5 秒。只有 `/health/readiness` 返回 HTTP 200 才报告成功。

其他生命周期命令：

```bash
node shared/tools/claude-code-deepseek-proxy.mjs status
node shared/tools/claude-code-deepseek-proxy.mjs stop
```

排障文件：

- `tmp/claude-code-deepseek/proxy.log`
- `tmp/claude-code-deepseek/proxy.pid`
- `tmp/claude-code-deepseek/litellm.generated.yaml`

这些文件均在 Git 忽略目录中。

## 5. 使用 Switch Model 菜单

无参数启动交互式菜单：

```bash
node shared/tools/switch-vscode-claude-code-model.mjs
```

菜单分为：

- `AITechFlux`
- `DeepSeek Official`

DeepSeek Official 分组实时读取 `/models`。选择 DeepSeek 模型前，本地 LiteLLM 必须已经通过 readiness。

非交互切换：

```bash
# AITechFlux，兼容旧命令
node shared/tools/switch-vscode-claude-code-model.mjs gpt56
node shared/tools/switch-vscode-claude-code-model.mjs gpt55
node shared/tools/switch-vscode-claude-code-model.mjs qwen
node shared/tools/switch-vscode-claude-code-model.mjs fast

# 显式 provider
node shared/tools/switch-vscode-claude-code-model.mjs aitechflux:gpt56
node shared/tools/switch-vscode-claude-code-model.mjs deepseek:<官方模型ID>
```

切换失败时脚本不会写入半成品配置。成功切换后需要 Reload VS Code，使 Claude Code 后台进程重新读取 `.claude/settings.json`。

## 6. Claude Code selector 槽位

Claude Code 固定提供 Opus、Sonnet、Haiku 三个默认模型槽位，无法展示任意数量的 DeepSeek 模型。

- DeepSeek reasoning 类模型优先映射到 Opus。
- DeepSeek chat 类模型优先映射到 Sonnet 和 Haiku。
- DeepSeek `/models` 返回的完整目录始终通过 Switch Model 交互菜单提供。
- AITechFlux 路径继续保留：
  - Opus：`deepseek-v4-pro`
  - Sonnet：`Qwen3.6-35B-A3B`
  - Haiku：`高性能极速模型`

## 7. 文本与视觉限制

DeepSeek 官方路径按纯文本模型使用。如果当前 Claude Code 会话包含截图、图片或其他视觉上下文，请切回支持视觉输入的模型，例如 AITechFlux 的 `gpt-5.6-sol`，并建议新开不含图片上下文的会话后再切 DeepSeek。

AITechFlux 的部分文本模型也可能返回：

```text
unknown variant image_url, expected text
```

这同样表示当前模型不能处理会话中的图片消息块。

## 8. 安全与轮换

- `.claude/settings.json` 中只保存 localhost Base URL、模型 ID 和本地代理凭据，不保存 DeepSeek 上游 Key。
- 代理日志和错误信息不得输出上游 Key。
- 提交前运行 secret 搜索并检查 Git diff。
- 当前使用的 Key 已在对话中出现，完成接入后仍建议到 DeepSeek 控制台轮换。
