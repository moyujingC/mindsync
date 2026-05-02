# RelayHub v1 Codex 线路临时停用与 Claude Code 优先 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-27
> source_of_truth：projects/relayhub/qa/2026-04-27-v1-Codex-线路临时停用与-Claude-Code-优先-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 验证目标

确认当前仓库已经把 `Codex` 从默认使用路径上临时停下，但没有破坏后续继续开发它的基础。

## 2. 自动化验证

至少覆盖：

- `GET /v1/models` 在默认配置下返回 `503 codex_relay_disabled`
- `POST /v1/responses` 在默认配置下返回 `503 codex_relay_disabled`
- `Claude Code` 相关路由与任务页快捷入口不回归
- 任务页顶部不再出现 `Codex 当前模型`

## 3. 手工 smoke

至少覆盖：

- 本地启动 `dev-relay`
- 访问 `GET /v1/models`
- 发起 `POST /v1/responses`
- 两者都返回“Codex relay 已临时停用”的明确提示

## 4. 边界要求

- 若显式设置恢复开关，后续仍可重新启用现有 `Codex` 实现
- 本轮停用不应影响 `chat/completions` 与 `Claude Code` 相关路径

