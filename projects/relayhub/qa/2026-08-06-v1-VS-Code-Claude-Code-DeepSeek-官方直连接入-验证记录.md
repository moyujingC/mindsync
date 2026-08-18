# RelayHub v1 VS Code Claude Code DeepSeek 官方直连接入验证记录

> 状态：working
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-08-06
> source_of_truth：projects/relayhub/qa/2026-08-06-v1-VS-Code-Claude-Code-DeepSeek-官方直连接入-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：projects/relayhub/qa/2026-08-06-v1-VS-Code-Claude-Code-DeepSeek-官方直连接入-qa-basis.md

## 1. 验证目标

验证本地代理管理、动态模型目录处理、Switch Model 配置生成、失败原子性和 AITechFlux 回归。DeepSeek 官方实时目录与真链路验证依赖本机私密 Key。

## 2. 已执行验证

### 2.1 运行环境

- Node.js：`v24.12.0`
- Python：`3.11.3`
- LiteLLM：`1.80.11`
- LiteLLM Anthropic Messages 端点：本机安装包包含 `/v1/messages` 实现
- LiteLLM readiness 端点：本机安装包包含 `/health/readiness`

### 2.2 自动化回归

已通过：

```bash
node --check shared/tools/claude-code-deepseek-proxy.mjs
node --check shared/tools/claude-code-deepseek-proxy.smoke.mjs
node shared/tools/claude-code-deepseek-proxy.smoke.mjs
node --check shared/tools/switch-vscode-claude-code-model.mjs
node --check shared/tools/switch-vscode-claude-code-model.smoke.mjs
node shared/tools/switch-vscode-claude-code-model.smoke.mjs
```

实测输出：

```text
claude-code-deepseek-proxy smoke passed
switch-vscode-claude-code-model smoke passed
```

已覆盖：

- `.env.local` 解析，不在配置中展开真实 Key
- DeepSeek `/models` 格式校验、去重与排序
- LiteLLM 动态配置生成
- AITechFlux 旧 preset 解析
- `deepseek:<model-id>` provider 解析
- reasoning/chat selector 槽位映射
- DeepSeek 与 AITechFlux settings 双向生成
- 未知 DeepSeek 模型拒绝

### 2.3 代理未运行状态

执行 `status` 时实测：

```text
readiness: not ready
process: not running
url: http://127.0.0.1:4000
```

该状态以非零退出码结束，符合“未就绪不报告成功”的要求。

### 2.4 失败原子性

在未配置 Key 的情况下尝试切换不存在的 DeepSeek 官方模型：

```text
exit=1 unchanged=true
```

`.claude/settings.json` 的 SHA 在失败前后保持一致。

### 2.5 AITechFlux 回归

执行：

```bash
node shared/tools/switch-vscode-claude-code-model.mjs gpt56
```

结果：

- `ANTHROPIC_BASE_URL` 保持 `https://aitechflux.com`
- 当前模型保持 `gpt-5.6-sol`
- Opus/Sonnet/Haiku selector 保持原有映射
- `.claude/settings.json` 相对 Git 无差异

### 2.6 格式检查

本轮目标文件通过 `git diff --check`。

## 3. 尚未完成的真链路验证

当前仓库没有 `.env.local`，进程环境也没有 `DEEPSEEK_API_KEY`。尝试从此前对话记录自动提取并写入私密文件时，被本地权限策略拒绝；未绕过该策略，也未把 Key 写入其他位置。

因此以下项目尚未实测：

- DeepSeek `/models` 当前实时模型数量和 ID
- LiteLLM 使用真实目录生成配置并启动
- `/health/readiness` HTTP 200
- Claude Code `/v1/messages` → LiteLLM → DeepSeek 纯文本响应
- 真实 DeepSeek 模型切换后的 `.claude/settings.json`

完成方式：用户在 `.env.local` 手动配置 `DEEPSEEK_API_KEY` 后，依次执行：

```bash
node shared/tools/claude-code-deepseek-proxy.mjs models
node shared/tools/claude-code-deepseek-proxy.mjs start
node shared/tools/switch-vscode-claude-code-model.mjs
```

## 4. 当前结论

- 代码、静态配置生成、失败原子性与 AITechFlux 回归：通过。
- DeepSeek 官方实时目录与端到端调用：因私密 Key 尚未进入本机环境，当前未验证。
- QA 状态保持 `working`，不能把真链路标记为已通过。
