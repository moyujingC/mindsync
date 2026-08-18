# RelayHub v1 VS Code Claude Code DeepSeek 官方直连接入 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-08-06
> source_of_truth：projects/relayhub/qa/2026-08-06-v1-VS-Code-Claude-Code-DeepSeek-官方直连接入-qa-basis.md
> 项目：RelayHub
> 阶段：qa
> depends_on：projects/relayhub/tasks/2026-08-06-v1-VS-Code-Claude-Code-DeepSeek-官方直连接入实施任务.md

## 1. 验收目标

验证 Claude Code 可以在不经过 RelayHub 的情况下，通过 localhost LiteLLM 使用 DeepSeek 官方 API；现有 AITechFlux 切换能力不回归，私密 Key 不进入可提交文件。

## 2. 核心验收项

### 2.1 动态模型目录

- `models` 命令请求 DeepSeek 官方 `/models`。
- 输出的模型数量与 ID 来自实时接口。
- 重复、空白或无效模型项不会进入菜单和 LiteLLM 配置。
- 接口失败时返回明确错误，不使用过时硬编码目录兜底。

### 2.2 本地协议代理

- LiteLLM 只监听 `127.0.0.1`。
- `start` 在启动后等待至少 5 秒。
- 只有 `/health/readiness` 返回 HTTP 200 才报告成功。
- `status` 同时报告 readiness 与 PID 状态。
- 端口占用、进程残留或 LiteLLM 缺失时给出可操作错误。

### 2.3 Switch Model

- 无参数菜单按 `AITechFlux`、`DeepSeek Official` 分组。
- 旧命令如 `gpt56`、`qwen`、`fast` 保持可用。
- `deepseek:<model-id>` 只接受官方目录当前存在的 ID。
- 切换 DeepSeek 前必须确认本地代理 readiness 为 HTTP 200。
- 任一前置检查失败时 `.claude/settings.json` 内容不变。
- DeepSeek 完整目录通过交互菜单提供，Opus/Sonnet/Haiku 三个固定槽位只做代表性映射。

### 2.4 配置与 Secret

- 上游 `DEEPSEEK_API_KEY` 只存在于 `.env.local` 或进程环境。
- `.claude/settings.json` 不含上游 Key。
- LiteLLM 模板和生成配置只引用环境变量。
- 日志、文档、测试 fixture 和 Git diff 不含真实 Key。
- 切回 AITechFlux 后 localhost Base URL 和本地代理 token 被移除。

### 2.5 运行能力

- Claude Code 经 `/v1/messages` 到 LiteLLM，再到 DeepSeek 的纯文本请求成功。
- DeepSeek 官方模型按文本模型验收，不以截图或视觉输入作为通过条件。
- AITechFlux 切回后原有模型路径仍可用。

## 3. 自动化回归

```bash
node --check shared/tools/claude-code-deepseek-proxy.mjs
node --check shared/tools/claude-code-deepseek-proxy.smoke.mjs
node shared/tools/claude-code-deepseek-proxy.smoke.mjs
node --check shared/tools/switch-vscode-claude-code-model.mjs
node --check shared/tools/switch-vscode-claude-code-model.smoke.mjs
node shared/tools/switch-vscode-claude-code-model.smoke.mjs
```

## 4. 手工验证

1. 在被忽略的 `.env.local` 配置 `DEEPSEEK_API_KEY`。
2. 运行 `node shared/tools/claude-code-deepseek-proxy.mjs models`，记录实时模型数量与 ID。
3. 运行 `node shared/tools/claude-code-deepseek-proxy.mjs start`。
4. 使用 HTTP 请求验证 `/health/readiness` 返回 200，并用 `lsof -i :4000` 辅助确认监听地址。
5. 运行无参数 Switch Model 菜单，确认模型列表与步骤 2 一致。
6. 选择 DeepSeek chat 和 reasoning 模型，检查 `.claude/settings.json`。
7. 重载 VS Code，用 Claude Code 发送最小纯文本请求。
8. 切回 `gpt56`，确认 AITechFlux 配置恢复。
9. 运行 Git diff 与 secret 搜索。

## 5. 通过标准

- 所有自动化回归命令通过。
- readiness 返回 HTTP 200 后才报告代理可用。
- 实时模型目录、菜单与生成配置一致。
- DeepSeek 纯文本真链路成功。
- AITechFlux 回归成功。
- 可提交文件和 Git diff 不含 DeepSeek 上游 API Key。

## 6. 风险提醒

- 用户当前使用的 Key 已在对话中出现，功能验收通过后仍建议轮换。
- DeepSeek 官方模型、LiteLLM 路由行为和 `/models` 返回可能随上游变化；动态目录用于降低硬编码漂移，不替代运行时回归。
- Claude Code 的三个 selector 槽位无法容纳无限模型，完整目录以命令行菜单为准。
