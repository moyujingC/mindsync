# RelayHub v1 Claude Code 任务页切后即验收口说明

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-24
> source_of_truth：projects/relayhub/specs/2026-04-24-v1-Claude-Code-任务页切后即验收口说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 本轮目标

让用户在任务页切完 `Claude Code` 当前模型后，可以直接做一次真链路验证。

## 2. 本轮默认口径

- 验证动作放在 `/tasks` 的 `Claude Code 当前模型` 专用区
- 按钮固定为：
  - `验证 Claude Code 当前模型`
- 前端直接请求本地 `dev-relay`
- 请求目标固定为：
  - `POST http://127.0.0.1:4319/chat/completions`

## 3. 行为约束

- 不新增新的 control-plane 路由
- 不改 `dev-relay` 的固定任务映射
- 验证请求继续固定依赖 `task-claude-code`
- 成功后在任务页直接展示真链路返回摘要
- 失败时展示 relay 或上游返回的错误信息

## 4. 本轮不改

- 不把任务页升级成完整聊天面板
- 不自动写入运行记录
- 不在本轮扩 release 域名验证
