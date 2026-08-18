# RelayHub v1 VS Code Claude Code DeepSeek 官方直连接入实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-08-06
> source_of_truth：projects/relayhub/tasks/2026-08-06-v1-VS-Code-Claude-Code-DeepSeek-官方直连接入实施任务.md
> 项目：RelayHub
> 阶段：task
> depends_on：projects/relayhub/dev-relay/2026-06-01-VS-Code-Claude-Code-AITechFlux-直连模型切换说明.md

## 1. 实施目标

让仓库级 VS Code Claude Code 在保留 AITechFlux 路径的前提下，通过本机 LiteLLM 协议转换层使用 DeepSeek 官方 API，并在现有 Switch Model 工具中动态显示 DeepSeek `/models` 返回的模型。

## 2. 实施内容

1. 增加本机 LiteLLM 生命周期工具，提供 `start`、`stop`、`status`、`models`。
2. DeepSeek 模型目录以官方 `/models` 实时响应为准，不硬编码旧模型列表。
3. 扩展现有模型切换脚本：
   - 无参数时显示按 provider 分组的交互式菜单。
   - 保留 AITechFlux 旧参数调用。
   - 支持 `deepseek:<model-id>` 非交互调用。
4. DeepSeek 模式写入 localhost Base URL 和本地代理凭据，不写入上游 API Key。
5. 配置写入前验证模型存在且 LiteLLM readiness 返回 HTTP 200；失败时保持原配置不变。
6. 增加纯函数 smoke tests 和运维说明。

## 3. 不变约束

- 不把 RelayHub control-plane 或 Console 加入请求链路。
- 不修改用户级 Claude Code 配置。
- DeepSeek API Key 只进入被 Git 忽略的 `.env.local` 或进程环境。
- 不在日志、错误、文档、测试 fixture、Git diff 中输出真实 Key。
- AITechFlux 的现有 presets 和 selector 槽位保持可恢复。
- DeepSeek 官方模型按纯文本模型使用；视觉会话切回支持图片的模型。

## 4. 测试要求

- Node 语法检查通过。
- smoke tests 覆盖模型目录解析、去重排序、LiteLLM 配置生成、provider 参数解析、selector 映射和双向 settings 生成。
- 未配置 Key、代理未就绪、未知模型时不得修改 `.claude/settings.json`。
- LiteLLM 启动后等待至少 5 秒，并以 `/health/readiness` HTTP 200 作为成功标准。
- 实时报告 DeepSeek `/models` 返回的模型数量和 ID。
- 切回 AITechFlux 后确认 Base URL 和模型字段恢复。

## 5. 回归命令

```bash
node --check shared/tools/claude-code-deepseek-proxy.mjs
node --check shared/tools/claude-code-deepseek-proxy.smoke.mjs
node shared/tools/claude-code-deepseek-proxy.smoke.mjs
node --check shared/tools/switch-vscode-claude-code-model.mjs
node --check shared/tools/switch-vscode-claude-code-model.smoke.mjs
node shared/tools/switch-vscode-claude-code-model.smoke.mjs
```

## 6. 交付物

- `shared/tools/claude-code-deepseek-proxy.mjs`
- `shared/tools/claude-code-deepseek-proxy.smoke.mjs`
- `shared/tools/switch-vscode-claude-code-model.mjs`
- `shared/tools/switch-vscode-claude-code-model.smoke.mjs`
- `shared/config/claude-code-deepseek.litellm.yaml`
- 更新后的 Claude Code 多 provider 直连说明
- 对应 QA basis 与验证记录
